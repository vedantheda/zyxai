'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
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

  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const subscriptionRef = useRef<any>()

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
          console.error('🔐 Session refresh failed:', refreshError)
          throw new Error('Session refresh failed')
        }
        currentSession = refreshData.session || session
        console.log('🔐 Session refreshed for API call')
      } catch (err) {
        console.error('🔐 Failed to refresh session:', err)
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
        console.error('🔐 Unauthorized - session may be expired, forcing reload')
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
      console.error('Error loading conversations:', err)
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
      console.error('Error loading conversation:', err)
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
      console.error('Error loading messages:', err)
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
      console.error('Error creating conversation:', err)
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
      console.error('Error sending message:', err)
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
      console.error('Error updating conversation:', err)
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
      console.error('Error marking as read:', err)
    }
  }, [apiCall])

  // Load message stats
  const loadStats = useCallback(async () => {
    try {
      const messageStats: MessageStats = await apiCall('/stats')
      setStats(messageStats)
    } catch (err) {
      console.error('Error loading stats:', err)
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
  }, [options.autoRefresh, options.refreshInterval, session?.access_token])

  // Real-time subscriptions
  useEffect(() => {
    if (!session?.access_token) return

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('New message received:', payload)
          const newMessage = payload.new as any

          // Get sender info for the message
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url, role')
            .eq('id', newMessage.sender_id)
            .single()

          const formattedMessage = {
            id: newMessage.id,
            conversationId: newMessage.conversation_id,
            senderId: newMessage.sender_id,
            senderType: newMessage.sender_type,
            content: newMessage.content,
            messageType: newMessage.message_type,
            attachments: [],
            isRead: newMessage.is_read,
            readAt: newMessage.read_at ? new Date(newMessage.read_at) : undefined,
            isEdited: newMessage.is_edited,
            editedAt: newMessage.edited_at ? new Date(newMessage.edited_at) : undefined,
            metadata: newMessage.metadata || {},
            createdAt: new Date(newMessage.created_at),
            updatedAt: new Date(newMessage.updated_at),
            sender: senderProfile ? {
              id: senderProfile.id,
              name: `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim(),
              email: senderProfile.email,
              avatarUrl: senderProfile.avatar_url,
              role: senderProfile.role
            } : undefined
          }

          // Add message to current messages if it's for the current conversation
          if (currentConversation && newMessage.conversation_id === currentConversation.id) {
            setMessages(prev => [...prev, formattedMessage])
          }

          // Update conversations list with new last message
          setConversations(prev => prev.map(conv =>
            conv.id === newMessage.conversation_id
              ? {
                  ...conv,
                  lastMessage: formattedMessage,
                  lastMessageAt: new Date(newMessage.created_at)
                }
              : conv
          ))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message updated:', payload)
          const updatedMessage = payload.new as any

          // Update message in current messages
          setMessages(prev => prev.map(msg =>
            msg.id === updatedMessage.id
              ? {
                  ...msg,
                  isRead: updatedMessage.is_read,
                  readAt: updatedMessage.read_at ? new Date(updatedMessage.read_at) : undefined,
                  isEdited: updatedMessage.is_edited,
                  editedAt: updatedMessage.edited_at ? new Date(updatedMessage.edited_at) : undefined,
                  updatedAt: new Date(updatedMessage.updated_at)
                }
              : msg
          ))
        }
      )
      .subscribe()

    subscriptionRef.current = messagesSubscription

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [session?.access_token, currentConversation?.id])

  // Initial load
  useEffect(() => {
    if (session?.access_token) {
      loadConversations({ limit: 20, offset: 0 })
      loadStats()
    }
  }, [session?.access_token])

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

    // Utilities
    refresh: () => {
      loadConversations({ limit: 20, offset: 0 })
      loadStats()
    }
  }
}
