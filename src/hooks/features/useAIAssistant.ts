'use client'
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { AIService, AIMessage, AIConversation, DocumentAnalysisResult, TaxCalculationRequest, TaxCalculationResult } from '@/lib/ai/AIService'
import { supabase } from '@/lib/supabase'
export interface UseAIAssistantOptions {
  autoSave?: boolean
  maxMessages?: number
}
// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
export function useAIAssistant(options: UseAIAssistantOptions = {}) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const aiService = user ? new AIService(user.id) : null
  const loadConversations = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20)
      if (error) {
        // Don't set error state for database issues - just continue with empty state
        setConversations([])
        return
      }
      const loadedConversations: AIConversation[] = (data || []).map(conv => ({
        id: conv.id,
        userId: conv.user_id,
        title: conv.title,
        messages: (conv.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        metadata: conv.metadata
      }))
      setConversations(loadedConversations)
      // Set current conversation to the most recent one if none is selected
      if (!currentConversation && loadedConversations.length > 0) {
        setCurrentConversation(loadedConversations[0])
      }
    } catch (err) {
      // Don't set error state - just continue with empty conversations
      setConversations([])
    }
  }, [user, currentConversation])
  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, loadConversations])
  const createNewConversation = useCallback(async (title: string = 'New Chat'): Promise<void> => {
    if (!user) return
    try {
      // Create welcome message
      const welcomeMessage: AIMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: `Hello! I'm Neuronize AI, your intelligent tax practice assistant. I can help you with:
🔍 **Document Analysis** - Extract data from tax forms with high accuracy
📊 **Tax Calculations** - Perform complex calculations and projections
👥 **Client Management** - Track deadlines and provide insights
💡 **Tax Planning** - Strategic recommendations and optimization
What would you like help with today?`,
        timestamp: new Date()
      }
      const conversationId = generateUUID()
      const newConversation: AIConversation = {
        id: conversationId,
        userId: user.id,
        title,
        messages: [welcomeMessage],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      // Try to save to database, but continue with local state if it fails
      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .insert({
            id: conversationId,
            user_id: user.id,
            title: title,
            messages: [welcomeMessage],
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        if (error) {
          // Mark as local conversation
          newConversation.metadata = { local: true }
        }
      } catch (dbError) {
        // Mark as local conversation
        newConversation.metadata = { local: true }
      }
      // Always update local state regardless of database success
      setCurrentConversation(newConversation)
      setConversations(prev => [newConversation, ...prev])
    } catch (err) {
      // Fallback: create a local-only conversation
      const fallbackConversation: AIConversation = {
        id: 'local-' + generateUUID(),
        userId: user.id,
        title: title + ' (Local)',
        messages: [{
          id: generateUUID(),
          role: 'assistant',
          content: `Hello! I'm Neuronize AI in demo mode. I can help you with tax-related questions and document analysis.`,
          timestamp: new Date()
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setCurrentConversation(fallbackConversation)
      setConversations(prev => [fallbackConversation, ...prev])
      setError('Using local mode - conversations will not be saved')
    }
  }, [user])
  const sendMessage = useCallback(async (
    message: string,
    context?: {
      documentIds?: string[]
      clientId?: string
      actionType?: string
    }
  ): Promise<string> => {
    if (!aiService || !message.trim()) return ''
    setIsLoading(true)
    setError(null)
    try {
      // If no current conversation, create one first
      let conversationToUse = currentConversation
      if (!conversationToUse) {
        try {
          await createNewConversation('New Chat')
          // Wait a bit for the conversation to be created
          await new Promise(resolve => setTimeout(resolve, 100))
          // Get the newly created conversation from state
          conversationToUse = currentConversation
        } catch (createError) {
          // Continue without a conversation - the AIService will handle this
        }
      }
      // Step 1: Add user message immediately to show in chat
      if (conversationToUse) {
        const userMessage: AIMessage = {
          id: generateUUID(),
          role: 'user',
          content: message,
          timestamp: new Date()
        }
        const conversationWithUserMessage = {
          ...conversationToUse,
          messages: [...conversationToUse.messages, userMessage],
          updatedAt: new Date()
        }
        setCurrentConversation(conversationWithUserMessage)
        setConversations(prev => prev.map(c =>
          c.id === conversationToUse.id ? conversationWithUserMessage : c
        ))
        // Update conversationToUse for the AI call
        conversationToUse = conversationWithUserMessage
      }
      // Step 2: Call AI service to get response
      const result = await aiService.sendMessage(
        message,
        conversationToUse?.id,
        context
      )
      // Step 3: Add AI response to the conversation
      if (conversationToUse) {
        const assistantMessage: AIMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        }
        const finalConversation = {
          ...conversationToUse,
          messages: [...conversationToUse.messages, assistantMessage],
          updatedAt: new Date()
        }
        setCurrentConversation(finalConversation)
        setConversations(prev => prev.map(c =>
          c.id === conversationToUse.id ? finalConversation : c
        ))
      }
      // Optionally reload conversations in background to sync with database
      try {
        loadConversations()
      } catch (loadError) {
        }
      return result.response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)
      return ''
    } finally {
      setIsLoading(false)
    }
  }, [aiService, currentConversation, conversations, loadConversations, createNewConversation])
  const analyzeDocument = useCallback(async (documentId: string): Promise<DocumentAnalysisResult | null> => {
    if (!aiService) return null
    setIsAnalyzing(true)
    setError(null)
    try {
      const result = await aiService.analyzeDocument(documentId)
      // Send a message about the analysis
      await sendMessage(
        `I've analyzed the document. Here are the key findings: ${result.insights.join(', ')}`,
        { documentIds: [documentId], actionType: 'document_analysis' }
      )
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze document'
      setError(errorMessage)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [aiService, sendMessage])
  const calculateTaxes = useCallback(async (request: TaxCalculationRequest): Promise<TaxCalculationResult | null> => {
    if (!aiService) return null
    setIsLoading(true)
    setError(null)
    try {
      const result = await aiService.calculateTaxes(request)
      // Send a message about the calculation
      const summary = `Tax calculation complete:
• Federal Tax: $${result.federalTax.toLocaleString()}
• State Tax: $${result.stateTax.toLocaleString()}
• Total Tax: $${result.totalTax.toLocaleString()}
• Effective Rate: ${result.effectiveRate.toFixed(2)}%`
      await sendMessage(summary, {
        clientId: request.clientId,
        actionType: 'tax_calculation'
      })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate taxes'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [aiService, sendMessage])
  const getClientInsights = useCallback(async (clientId: string): Promise<string[]> => {
    if (!aiService) return []
    try {
      const insights = await aiService.getClientInsights(clientId)
      // Send a message with the insights
      await sendMessage(
        `Here are the key insights for this client:\n${insights.map(insight => `• ${insight}`).join('\n')}`,
        { clientId, actionType: 'client_insights' }
      )
      return insights
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get client insights'
      setError(errorMessage)
      return []
    }
  }, [aiService, sendMessage])
  const deleteConversation = useCallback(async (conversationId: string): Promise<void> => {
    if (!user) return
    // Always remove from local state first
    setConversations(prev => prev.filter(c => c.id !== conversationId))
    if (currentConversation?.id === conversationId) {
      const remaining = conversations.filter(c => c.id !== conversationId)
      setCurrentConversation(remaining.length > 0 ? remaining[0] : null)
    }
    // Try to delete from database, but don't fail if it doesn't work
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id)
      if (error) {
        }
    } catch (err) {
      // Don't set error state - the conversation is already removed locally
    }
  }, [user, currentConversation, conversations])
  const updateConversationTitle = useCallback(async (conversationId: string, title: string): Promise<void> => {
    if (!user) return
    // Update local state first
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, title, updatedAt: new Date() } : c
    ))
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title } : null)
    }
    // Try to update database, but don't fail if it doesn't work
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', user.id)
      if (error) {
        }
    } catch (err) {
      // Don't set error state - the title is already updated locally
    }
  }, [user, currentConversation])
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  // Quick action helpers
  const quickActions = {
    analyzeLatestDocuments: useCallback(async () => {
      return sendMessage('Analyze the latest uploaded documents and provide insights.')
    }, [sendMessage]),
    calculateQuarterlyTaxes: useCallback(async () => {
      return sendMessage('Calculate estimated quarterly taxes for the current period.')
    }, [sendMessage]),
    getUpcomingDeadlines: useCallback(async () => {
      return sendMessage('Show me clients with upcoming tax deadlines.')
    }, [sendMessage]),
    generateTaxPlanningStrategy: useCallback(async () => {
      return sendMessage('Generate a comprehensive tax planning strategy.')
    }, [sendMessage]),
    reviewClientStatus: useCallback(async (clientId: string) => {
      return sendMessage('Review the current status and provide recommendations for this client.', {
        clientId,
        actionType: 'client_review'
      })
    }, [sendMessage])
  }
  return {
    // State
    conversations,
    currentConversation,
    isLoading,
    isAnalyzing,
    error,
    // Actions
    sendMessage,
    analyzeDocument,
    calculateTaxes,
    getClientInsights,
    createNewConversation,
    deleteConversation,
    updateConversationTitle,
    setCurrentConversation,
    clearError,
    // Quick actions
    quickActions,
    // Utilities
    refreshConversations: loadConversations,
    hasActiveConversation: !!currentConversation,
    messageCount: currentConversation?.messages.length || 0,
    // Service access
    aiService
  }
}
