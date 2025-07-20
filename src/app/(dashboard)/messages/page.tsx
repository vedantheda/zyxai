'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useMessages } from '@/hooks/features/useMessages'
import { useUserPresence } from '@/hooks/features/useUserPresence'
import { ConversationList } from '@/components/features/messages/ConversationList'
import { MessageChat } from '@/components/features/messages/MessageChat'
import { CreateConversationDialog } from '@/components/features/messages/CreateConversationDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Plus,
  Users,
  Clock,
  TrendingUp,
  UserPlus
} from '@/lib/optimization/IconOptimizer'
import { useToast } from '@/components/ui/toast'

export default function MessagesPage() {
  const { user, session, loading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !loading
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [sending, setSending] = useState(false)

  // Initialize user presence tracking
  useUserPresence()



  // Use the real messages hook
  const {
    conversations,
    currentConversation,
    messages,
    loading: messagesLoading,
    error,
    typingUsers,
    hasMoreMessages,
    loadConversation,
    loadMessages,
    loadMoreMessages,
    createConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    sendTypingIndicator,
    setCurrentConversation,
    refresh
  } = useMessages({ autoRefresh: true, refreshInterval: 30000 })

  // Show error if any - MUST BE WITH OTHER HOOKS
  useEffect(() => {
    if (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error
      })
    }
  }, [error, addToast])

  // Debug session changes
  useEffect(() => {
    console.log('🔐 MessagesPage: Session changed', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length,
      userId: session?.user?.id
    })
  }, [session])

  // Show loading during auth
  if (loading || !isReady) {
    return <LoadingScreen text="Loading messages..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view messages" />
  }

  // Check if user is client or admin
  const isClient = user?.role === 'client'

  // Handle conversation selection
  const handleSelectConversation = async (conversation: any) => {
    try {
      setCurrentConversation(conversation)
      await loadConversation(conversation.id)
      await loadMessages(conversation.id)
    } catch (error) {
      console.error('Error selecting conversation:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load conversation'
      })
    }
  }

  // Handle creating new conversation
  const handleCreateConversation = async (clientId: string, initialMessage?: string) => {
    try {
      const conversation = await createConversation({
        clientId,
        priority: 'normal',
        initialMessage
      })

      setCurrentConversation(conversation)
      setShowCreateDialog(false)

      addToast({
        type: 'success',
        title: 'Success',
        description: 'Conversation created successfully'
      })
    } catch (error) {
      console.error('Error creating conversation:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create conversation'
      })
    }
  }

  // Handle sending message with file attachments
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!currentConversation) return

    try {
      setSending(true)
      await sendMessage({
        conversationId: currentConversation.id,
        content,
        messageType: attachments && attachments.length > 0 ? 'mixed' : 'text',
        attachments
      })

      // Success toast for file attachments
      if (attachments && attachments.length > 0) {
        addToast({
          type: 'success',
          title: 'Message sent',
          description: `Message with ${attachments.length} attachment(s) sent successfully`
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      addToast({
        type: 'error',
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Failed to send message'
      })
    } finally {
      setSending(false)
    }
  }

  // Handle marking as read
  const handleMarkAsRead = async () => {
    if (!currentConversation) return

    try {
      await markAsRead(currentConversation.id)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MessageSquare className="h-8 w-8" />
              {isClient ? 'Messages' : 'Team Messages'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isClient
                ? 'Communicate with your team and get support'
                : 'Team messaging and client communication hub'
              }
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {!isClient && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            )}
            <Button variant="outline" onClick={refresh}>
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
      </div>

      {/* Quick Stats */}
      {conversations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                  <p className="text-2xl font-bold">{conversations.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Chats</p>
                  <p className="text-2xl font-bold">
                    {conversations.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unread Messages</p>
                  <p className="text-2xl font-bold">
                    {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
                  </p>
                </div>
                <Badge className="h-8 w-8 rounded-full bg-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                  <p className="text-2xl font-bold">< 1h</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <div className="h-[500px] lg:h-[600px]">
              <ConversationList
                conversations={conversations}
                currentConversation={currentConversation}
                onSelectConversation={handleSelectConversation}
                onCreateConversation={!isClient ? () => setShowCreateDialog(true) : undefined}
                loading={messagesLoading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="h-[500px] lg:h-[600px]">
            <MessageChat
              conversation={currentConversation}
              messages={messages}
              currentUserId={user?.id || ''}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
              onLoadMoreMessages={loadMoreMessages}
              onAddReaction={addReaction}
              onRemoveReaction={removeReaction}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              loading={messagesLoading}
              sending={sending}
              hasMoreMessages={hasMoreMessages}
              typingUsers={typingUsers}
              onTypingIndicator={sendTypingIndicator}
            />
            </div>
          </div>
      </div>

      {/* Create Conversation Dialog - Admin Only */}
      {!isClient && (
        <CreateConversationDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateConversation={handleCreateConversation}
        />
      )}
    </div>
  )
}
