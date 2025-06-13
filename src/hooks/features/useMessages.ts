'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
// Removed complex real-time - using simple patterns
import {
  Conversation,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
  UpdateConversationRequest,
  MessageFilters,
  MessageStats,
  PaginatedConversations,
  PaginatedMessages
} from '@/lib/types/messages'
interface UseMessagesOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}
export function useMessages(options: UseMessagesOptions = {}) {
  const { session } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMoreConversations, setHasMoreConversations] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  // Real-time message handlers
  const handleNewMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Avoid duplicates
      if (prev.find(m => m.id === message.id)) return prev
      return [...prev, message]
    })
    // Update conversation's last message
    setConversations(prev => prev.map(conv =>
      conv.id === message.conversationId
        ? {
            ...conv,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            unreadCount: conv.unreadCount + (message.senderId !== session?.user?.id ? 1 : 0)
          }
        : conv
    ))
    // Update stats
    if (message.senderId !== session?.user?.id) {
      setStats(prev => prev ? { ...prev, unreadMessages: prev.unreadMessages + 1 } : null)
    }
  }, [session?.user?.id])
  const handleMessageUpdate = useCallback((message: Message) => {
    setMessages(prev => prev.map(m => m.id === message.id ? message : m))
  }, [])
  const handleConversationUpdate = useCallback((conversation: Conversation) => {
    setConversations(prev => prev.map(c => c.id === conversation.id ? conversation : c))
    if (currentConversation?.id === conversation.id) {
      setCurrentConversation(conversation)
    }
  }, [currentConversation?.id])
  const handleTypingUpdate = useCallback((userId: string, isTyping: boolean) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev)
      if (isTyping) {
        newSet.add(userId)
      } else {
        newSet.delete(userId)
      }
      return newSet
    })
  }, [])
  // Simplified - removed complex real-time subscriptions
  const sendTypingIndicator = useCallback(() => {
    // Simple typing indicator - could be implemented later if needed
    console.log('Typing indicator (simplified)')
  }, [])
  // API call helper
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!session?.access_token) {
      console.error('🔐 No authentication token available', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token
      })
      throw new Error('No authentication token')
    }
    // Check if token is expired and refresh if needed
    let currentSession = session
    if (session.expires_at && session.expires_at * 1000 < Date.now() + 60000) { // Refresh 1 minute before expiry
      console.log('🔐 Token expiring soon, refreshing session')
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          throw new Error('Session refresh failed')
        }
        currentSession = refreshData.session || session
        console.log('🔐 Session refreshed for API call')
      } catch (err) {
        // Continue with existing session
      }
    }
    console.log('🔐 Making API call with token', {
      endpoint,
      hasToken: !!currentSession.access_token,
      tokenLength: currentSession.access_token.length,
      expiresAt: currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : 'unknown'
    })
    const response = await fetch(`/api/messages${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`,
        ...options.headers,
      },
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('🔐 API call failed', {
        status: response.status,
        error: errorData.error,
        endpoint
      })
      // If unauthorized, the session might be expired
      if (response.status === 401) {
        // Force a page reload to trigger re-authentication
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    return response.json()
  }, [session?.access_token, session?.expires_at])
  // Load conversations
  const loadConversations = useCallback(async (filters: MessageFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const result: PaginatedConversations = await apiCall(`/conversations?${params}`)
      if (filters.offset === 0) {
        setConversations(result.conversations)
      } else {
        setConversations(prev => [...prev, ...result.conversations])
      }
      setHasMoreConversations(result.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
      } finally {
      setLoading(false)
    }
  }, [apiCall])
  // Load specific conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setLoading(true)
      setError(null)
      const conversation: Conversation = await apiCall(`/conversations/${conversationId}`)
      setCurrentConversation(conversation)
      // Update conversation in list if it exists
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? conversation : c)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation')
      } finally {
      setLoading(false)
    }
  }, [apiCall])
  // Load messages for conversation
  const loadMessages = useCallback(async (
    conversationId: string,
    limit = 50,
    before?: string
  ) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.append('limit', String(limit))
      if (before) params.append('before', before)
      const result: PaginatedMessages = await apiCall(
        `/conversations/${conversationId}/messages?${params}`
      )
      if (!before) {
        setMessages(result.messages)
      } else {
        setMessages(prev => [...result.messages, ...prev])
      }
      setHasMoreMessages(result.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
      } finally {
      setLoading(false)
    }
  }, [apiCall])
  // Create new conversation
  const createConversation = useCallback(async (request: CreateConversationRequest) => {
    try {
      setLoading(true)
      setError(null)
      const conversation: Conversation = await apiCall('/conversations', {
        method: 'POST',
        body: JSON.stringify(request),
      })
      setConversations(prev => [conversation, ...prev])
      setCurrentConversation(conversation)
      return conversation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiCall])
  // Send message
  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    try {
      setError(null)
      const message: Message = await apiCall(
        `/conversations/${request.conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      )
      // Add message to current messages
      setMessages(prev => [...prev, message])
      // Update conversation's last message
      setConversations(prev =>
        prev.map(c =>
          c.id === request.conversationId
            ? { ...c, lastMessage: message, lastMessageAt: message.createdAt }
            : c
        )
      )
      return message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    }
  }, [apiCall])
  // Update conversation
  const updateConversation = useCallback(async (
    conversationId: string,
    updates: UpdateConversationRequest
  ) => {
    try {
      setLoading(true)
      setError(null)
      const conversation: Conversation = await apiCall(`/conversations/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? conversation : c)
      )
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(conversation)
      }
      return conversation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update conversation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiCall, currentConversation?.id])
  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await apiCall(`/conversations/${conversationId}/mark-read`, {
        method: 'POST',
      })
      // Update unread count in conversation
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      )
      // Mark messages as read
      setMessages(prev =>
        prev.map(m =>
          m.conversationId === conversationId && !m.isRead
            ? { ...m, isRead: true, readAt: new Date() }
            : m
        )
      )
    } catch (err) {
      }
  }, [apiCall])
  // Load message stats
  const loadStats = useCallback(async () => {
    try {
      const messageStats: MessageStats = await apiCall('/stats')
      setStats(messageStats)
    } catch (err) {
      }
  }, [apiCall])
  // Auto-refresh functionality
  useEffect(() => {
    if (options.autoRefresh && session?.access_token) {
      const interval = options.refreshInterval || 30000 // 30 seconds default
      refreshIntervalRef.current = setInterval(() => {
        loadConversations({ limit: 20, offset: 0 })
        loadStats()
      }, interval)
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
  }, [options.autoRefresh, options.refreshInterval, session?.access_token, loadConversations, loadStats])
  // Simplified - removed complex real-time subscriptions
  // Initial load
  useEffect(() => {
    if (session?.access_token) {
      loadConversations({ limit: 20, offset: 0 })
      loadStats()
    }
  }, [session?.access_token, loadConversations, loadStats])
  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])
  return {
    // State
    conversations,
    currentConversation,
    messages,
    stats,
    loading,
    error,
    hasMoreConversations,
    hasMoreMessages,
    typingUsers,
    // Actions
    loadConversations,
    loadConversation,
    loadMessages,
    createConversation,
    sendMessage,
    updateConversation,
    markAsRead,
    loadStats,
    setCurrentConversation,
    setError,
    sendTypingIndicator,
    // Utilities
    refresh: () => {
      loadConversations({ limit: 20, offset: 0 })
      loadStats()
    }
  }
}
