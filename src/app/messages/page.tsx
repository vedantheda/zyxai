'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useMessages } from '@/hooks/features/useMessages'
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
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function MessagesPage() {
  const { user, session, loading } = useAuth()
  const isAuthenticated = !!user
  const isReady = !loading
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [sending, setSending] = useState(false)



  // Use the real messages hook
  const {
    conversations,
    currentConversation,
    messages,
    loading: messagesLoading,
    error,
    typingUsers,
    loadConversation,
    loadMessages,
    createConversation,
    sendMessage,
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
  const handleCreateConversation = async (clientId: string, subject: string, initialMessage?: string) => {
    try {
      const conversation = await createConversation({
        clientId,
        subject,
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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isClient ? 'Messages' : 'Client Messages'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isClient
                ? 'Communicate with your tax professional'
                : 'Communicate with your clients'
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



      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
          {/* Conversation List */}
          <div className="lg:col-span-1 h-full">
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

          {/* Chat Area */}
          <div className="lg:col-span-2 h-full">
            <MessageChat
              conversation={currentConversation}
              messages={messages}
              currentUserId={user?.id || ''}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
              loading={messagesLoading}
              sending={sending}
              typingUsers={typingUsers}
              onTypingIndicator={sendTypingIndicator}
            />
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
