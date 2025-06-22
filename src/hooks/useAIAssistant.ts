'use client'
import { useState, useCallback, useRef } from 'react'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

export interface AIConversation {
  id: string
  title: string
  messages: AIMessage[]
  createdAt: Date
  updatedAt: Date
}

export function useAIAssistant() {
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const conversationIdCounter = useRef(0)
  const messageIdCounter = useRef(0)

  const createNewConversation = useCallback(async () => {
    const newConversation: AIConversation = {
      id: `conv_${++conversationIdCounter.current}`,
      title: `Conversation ${conversationIdCounter.current}`,
      messages: [{
        id: `msg_${++messageIdCounter.current}`,
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. How can I help you with your tax practice today?',
        timestamp: new Date()
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setConversations(prev => [newConversation, ...prev])
    setCurrentConversation(newConversation)
    return newConversation
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation) {
      await createNewConversation()
      return
    }

    const userMessage: AIMessage = {
      id: `msg_${++messageIdCounter.current}`,
      role: 'user',
      content,
      timestamp: new Date()
    }

    // Add user message
    setCurrentConversation(prev => {
      if (!prev) return prev
      const updated = {
        ...prev,
        messages: [...prev.messages, userMessage],
        updatedAt: new Date()
      }
      setConversations(convs => convs.map(c => c.id === prev.id ? updated : c))
      return updated
    })

    setIsLoading(true)
    setError(null)

    try {
      // Simulate AI response (replace with actual AI API call)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const aiResponse: AIMessage = {
        id: `msg_${++messageIdCounter.current}`,
        role: 'assistant',
        content: generateMockResponse(content),
        timestamp: new Date()
      }

      setCurrentConversation(prev => {
        if (!prev) return prev
        const updated = {
          ...prev,
          messages: [...prev.messages, aiResponse],
          updatedAt: new Date()
        }
        setConversations(convs => convs.map(c => c.id === prev.id ? updated : c))
        return updated
      })
    } catch (err) {
      setError('Failed to get AI response. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [currentConversation, createNewConversation])

  const analyzeDocument = useCallback(async (documentId: string) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // Simulate document analysis
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const analysisMessage: AIMessage = {
        id: `msg_${++messageIdCounter.current}`,
        role: 'assistant',
        content: `I've analyzed the document (ID: ${documentId}). Here's what I found:\n\n• Document appears to be a tax-related form\n• Contains financial data that may be relevant for tax calculations\n• Suggests reviewing specific sections for accuracy\n• Recommends cross-referencing with other client documents`,
        timestamp: new Date()
      }

      if (currentConversation) {
        setCurrentConversation(prev => {
          if (!prev) return prev
          const updated = {
            ...prev,
            messages: [...prev.messages, analysisMessage],
            updatedAt: new Date()
          }
          setConversations(convs => convs.map(c => c.id === prev.id ? updated : c))
          return updated
        })
      }
    } catch (err) {
      setError('Failed to analyze document. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [currentConversation])

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId))
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null)
    }
  }, [currentConversation])

  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    setConversations(prev => prev.map(c => 
      c.id === conversationId 
        ? { ...c, title, updatedAt: new Date() }
        : c
    ))
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title } : prev)
    }
  }, [currentConversation])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Quick actions
  const quickActions = {
    analyzeLatestDocuments: useCallback(async () => {
      await sendMessage('Please analyze the latest uploaded documents and provide insights.')
    }, [sendMessage]),

    calculateQuarterlyTaxes: useCallback(async () => {
      await sendMessage('Help me calculate quarterly tax estimates for my clients.')
    }, [sendMessage]),

    getUpcomingDeadlines: useCallback(async () => {
      await sendMessage('What are the upcoming tax deadlines I need to be aware of?')
    }, [sendMessage]),

    generateTaxPlanningStrategy: useCallback(async () => {
      await sendMessage('Generate a tax planning strategy for the current tax year.')
    }, [sendMessage])
  }

  return {
    conversations,
    currentConversation,
    isLoading,
    isAnalyzing,
    error,
    sendMessage,
    analyzeDocument,
    createNewConversation,
    deleteConversation,
    updateConversationTitle,
    setCurrentConversation,
    quickActions,
    clearError
  }
}

// Mock response generator
function generateMockResponse(userMessage: string): string {
  const responses = [
    "I understand you're asking about tax-related matters. Let me help you with that.",
    "Based on current tax regulations, here are some key points to consider:",
    "That's a great question about tax planning. Here's what I recommend:",
    "For tax compliance purposes, you should be aware of the following:",
    "Let me break down the tax implications for you:"
  ]

  const details = [
    "• Review all relevant documentation carefully",
    "• Ensure compliance with current tax codes",
    "• Consider potential deductions and credits",
    "• Plan for quarterly estimated payments",
    "• Keep detailed records for audit purposes"
  ]

  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  const randomDetails = details.slice(0, Math.floor(Math.random() * 3) + 2).join('\n')
  
  return `${randomResponse}\n\n${randomDetails}\n\nIs there anything specific you'd like me to elaborate on?`
}
