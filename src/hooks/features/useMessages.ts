'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBrowserNotifications } from './useBrowserNotifications'
import {
  Conversation,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
  UpdateConversationRequest,
  MessageFilters,
  MessageStats,
  PaginatedConversations,
  PaginatedMessages,
  TypingIndicator
} from '@/lib/types/messages'
interface UseMessagesOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}
export function useMessages(options: UseMessagesOptions = {}) {
  const { session } = useAuth()
  const { showMessageNotification, shouldShowNotification } = useBrowserNotifications()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMoreConversations, setHasMoreConversations] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [typingTimeouts, setTypingTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map())
  const refreshIntervalRef = useRef<NodeJS.Timeout>()
  const realtimeChannelRef = useRef<any>(null)

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
            unreadCount: (conv.unreadCount || 0) + (message.senderId !== session?.user?.id ? 1 : 0)
          }
        : conv
    ))

    // Update stats
    if (message.senderId !== session?.user?.id) {
      setStats(prev => prev ? { ...prev, unreadMessages: prev.unreadMessages + 1 } : null)

      // Show toast notification for new messages from others
      toast.success(`New message from ${message.sender?.name || 'Unknown'}`, {
        description: message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content,
        action: {
          label: 'View',
          onClick: () => {
            // Focus the conversation if it's not already focused
            if (currentConversation?.id !== message.conversationId) {
              const conversation = conversations.find(c => c.id === message.conversationId)
              if (conversation) {
                setCurrentConversation(conversation)
              }
            }
          }
        }
      })

      // Show browser notification if page is not visible
      if (shouldShowNotification()) {
        showMessageNotification(
          message.sender?.name || 'Unknown',
          message.content,
          () => {
            // Focus the conversation when notification is clicked
            if (currentConversation?.id !== message.conversationId) {
              const conversation = conversations.find(c => c.id === message.conversationId)
              if (conversation) {
                setCurrentConversation(conversation)
              }
            }
          }
        )
      }
    }
  }, [session?.user?.id, currentConversation?.id, conversations])
  const handleMessageUpdate = useCallback((message: Message) => {
    setMessages(prev => prev.map(m => m.id === message.id ? message : m))
  }, [])
  const handleConversationUpdate = useCallback((conversation: Conversation) => {
    setConversations(prev => prev.map(c => c.id === conversation.id ? conversation : c))
    if (currentConversation?.id === conversation.id) {
      setCurrentConversation(conversation)
    }
  }, [currentConversation?.id])
  const handleTypingUpdate = useCallback((userId: string, isTyping: boolean, userName?: string) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev)
      if (isTyping) {
        newSet.add(userId)

        // Auto-clear typing indicator after 3 seconds
        setTypingTimeouts(timeouts => {
          const newTimeouts = new Map(timeouts)

          // Clear existing timeout for this user
          const existingTimeout = newTimeouts.get(userId)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
          }

          // Set new timeout
          const timeout = setTimeout(() => {
            setTypingUsers(users => {
              const updatedUsers = new Set(users)
              updatedUsers.delete(userId)
              return updatedUsers
            })
            setTypingTimeouts(timeouts => {
              const updatedTimeouts = new Map(timeouts)
              updatedTimeouts.delete(userId)
              return updatedTimeouts
            })
          }, 3000)

          newTimeouts.set(userId, timeout)
          return newTimeouts
        })
      } else {
        newSet.delete(userId)

        // Clear timeout for this user
        setTypingTimeouts(timeouts => {
          const newTimeouts = new Map(timeouts)
          const timeout = newTimeouts.get(userId)
          if (timeout) {
            clearTimeout(timeout)
            newTimeouts.delete(userId)
          }
          return newTimeouts
        })
      }
      return newSet
    })
  }, [])

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!session?.user?.id || !currentConversation) return

    try {
      // Send typing indicator through real-time channel
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            conversationId,
            userId: session.user.id,
            userName: session.user.user_metadata?.full_name || session.user.email,
            isTyping,
            timestamp: new Date().toISOString()
          }
        })
      }
    } catch (error) {
      console.error('Failed to send typing indicator:', error)
    }
  }, [session?.user?.id, session?.user?.user_metadata?.full_name, session?.user?.email, currentConversation])
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

      // For file attachments, we need to handle them differently
      // since we can't send File objects in JSON
      if (request.attachments && request.attachments.length > 0) {
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('content', request.content)
        formData.append('messageType', request.messageType || 'text')
        formData.append('metadata', JSON.stringify(request.metadata || {}))

        // Add files to FormData
        request.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file)
        })

        // Send with FormData
        const response = await fetch(`/api/messages/conversations/${request.conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const message: Message = await response.json()

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
      } else {
        // Regular text message
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    }
  }, [apiCall, session?.access_token])
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
  // Mark conversation as read (throttled to prevent spam)
  const markAsReadTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const markAsRead = useCallback(async (conversationId: string) => {
    // Clear existing timeout for this conversation
    const existingTimeout = markAsReadTimeouts.current.get(conversationId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new timeout to throttle API calls
    const timeoutId = setTimeout(async () => {
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

        // Remove timeout from map
        markAsReadTimeouts.current.delete(conversationId)
      } catch (err) {
        markAsReadTimeouts.current.delete(conversationId)
      }
    }, 1000) // Throttle to max 1 call per second per conversation

    markAsReadTimeouts.current.set(conversationId, timeoutId)
  }, [apiCall])
  // Edit message
  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const updatedMessage: Message = await apiCall(`/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      })

      // Update message in local state
      setMessages(prev =>
        prev.map(m => m.id === messageId ? updatedMessage : m)
      )

      return updatedMessage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message')
      throw err
    }
  }, [apiCall])

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await apiCall(`/messages/${messageId}`, {
        method: 'DELETE',
      })

      // Remove message from local state
      setMessages(prev => prev.filter(m => m.id !== messageId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
      throw err
    }
  }, [apiCall])

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await apiCall(`/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      })

      // Update message reactions in local state
      setMessages(prev =>
        prev.map(m => {
          if (m.id === messageId) {
            const reactions = m.reactions || []
            const existingReaction = reactions.find(r => r.emoji === emoji)

            if (existingReaction) {
              // Update existing reaction
              return {
                ...m,
                reactions: reactions.map(r =>
                  r.emoji === emoji
                    ? { ...r, count: r.count + 1, hasReacted: true }
                    : r
                )
              }
            } else {
              // Add new reaction
              return {
                ...m,
                reactions: [...reactions, {
                  emoji,
                  count: 1,
                  users: [session?.user?.id || ''],
                  hasReacted: true
                }]
              }
            }
          }
          return m
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction')
      throw err
    }
  }, [apiCall, session?.user?.id])

  // Remove reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await apiCall(`/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`, {
        method: 'DELETE',
      })

      // Update message reactions in local state
      setMessages(prev =>
        prev.map(m => {
          if (m.id === messageId) {
            const reactions = m.reactions || []
            return {
              ...m,
              reactions: reactions.map(r =>
                r.emoji === emoji
                  ? { ...r, count: Math.max(0, r.count - 1), hasReacted: false }
                  : r
              ).filter(r => r.count > 0)
            }
          }
          return m
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove reaction')
      throw err
    }
  }, [apiCall])

  // Load more messages
  const loadMoreMessages = useCallback(async (conversationId: string, before?: string) => {
    try {
      setLoading(true)
      const result: PaginatedMessages = await loadMessages(conversationId, 50, before)
      setHasMoreMessages(result.hasMore)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages')
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadMessages])

  // Load message stats
  const loadStats = useCallback(async () => {
    try {
      const messageStats: MessageStats = await apiCall('/stats')
      setStats(messageStats)
    } catch (err) {
      }
  }, [apiCall])
  // Real-time subscriptions setup
  useEffect(() => {
    if (!session?.user?.id) return

    // Clean up existing channel first
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current)
      realtimeChannelRef.current = null
    }

    // Create unique channel name to avoid conflicts
    const channelName = `messages-${session.user.id}-${Date.now()}`
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as any
          // Only handle messages for conversations we're interested in
          if (conversations.some(c => c.id === newMessage.conversation_id)) {
            handleNewMessage({
              id: newMessage.id,
              conversationId: newMessage.conversation_id,
              senderId: newMessage.sender_id,
              senderType: newMessage.sender_type,
              content: newMessage.content,
              messageType: newMessage.message_type,
              attachments: newMessage.attachments || [],
              isRead: newMessage.is_read,
              readAt: newMessage.read_at ? new Date(newMessage.read_at) : undefined,
              isEdited: newMessage.is_edited,
              editedAt: newMessage.edited_at ? new Date(newMessage.edited_at) : undefined,
              metadata: newMessage.metadata || {},
              createdAt: new Date(newMessage.created_at),
              updatedAt: new Date(newMessage.updated_at),
              sender: {
                id: newMessage.sender_id,
                name: newMessage.sender_name || 'Unknown',
                email: newMessage.sender_email || '',
                role: newMessage.sender_type
              }
            })
          }
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
          const updatedMessage = payload.new as any
          handleMessageUpdate({
            id: updatedMessage.id,
            conversationId: updatedMessage.conversation_id,
            senderId: updatedMessage.sender_id,
            senderType: updatedMessage.sender_type,
            content: updatedMessage.content,
            messageType: updatedMessage.message_type,
            attachments: updatedMessage.attachments || [],
            isRead: updatedMessage.is_read,
            readAt: updatedMessage.read_at ? new Date(updatedMessage.read_at) : undefined,
            isEdited: updatedMessage.is_edited,
            editedAt: updatedMessage.edited_at ? new Date(updatedMessage.edited_at) : undefined,
            metadata: updatedMessage.metadata || {},
            createdAt: new Date(updatedMessage.created_at),
            updatedAt: new Date(updatedMessage.updated_at)
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          const updatedConversation = payload.new as any
          handleConversationUpdate({
            id: updatedConversation.id,
            clientId: updatedConversation.client_id,
            adminId: updatedConversation.admin_id,
            status: updatedConversation.status,
            priority: updatedConversation.priority,
            lastMessageAt: new Date(updatedConversation.last_message_at),
            createdAt: new Date(updatedConversation.created_at),
            updatedAt: new Date(updatedConversation.updated_at)
          })
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { conversationId, userId, userName, isTyping } = payload.payload
        // Only handle typing indicators for current conversation and other users
        if (conversationId === currentConversation?.id && userId !== session.user.id) {
          handleTypingUpdate(userId, isTyping, userName)
        }
      })
      .subscribe()

    realtimeChannelRef.current = channel

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
      }
    }
  }, [session?.user?.id])

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

  // Initial load
  useEffect(() => {
    if (session?.access_token) {
      loadConversations({ limit: 20, offset: 0 })
      loadStats()
    }
  }, [session?.access_token, loadConversations, loadStats])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }

      // Clear all typing timeouts
      typingTimeouts.forEach(timeout => clearTimeout(timeout))

      // Clear all mark-as-read timeouts
      markAsReadTimeouts.current.forEach(timeout => clearTimeout(timeout))
      markAsReadTimeouts.current.clear()

      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
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
    loadMoreMessages,
    createConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
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
