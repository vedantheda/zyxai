'use client'

import { useState, useEffect } from 'react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useMessages } from '@/hooks/useMessages'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageChat } from '@/components/messages/MessageChat'
import { CreateConversationDialog } from '@/components/messages/CreateConversationDialog'
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
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading messages..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view messages" />
  }

  // Check if user is client or admin
  const isClient = user?.role === 'client'

  const {
    conversations,
    currentConversation,
    messages,
    stats,
    loading,
    error,
    loadConversation,
    loadMessages,
    sendMessage,
    markAsRead,
    createConversation,
    setCurrentConversation,
    refresh
  } = useMessages({ autoRefresh: true, refreshInterval: 30000 })

  const [sending, setSending] = useState(false)

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

  // Handle sending message
  const handleSendMessage = async (content: string) => {
    if (!currentConversation) return

    try {
      setSending(true)
      await sendMessage({
        conversationId: currentConversation.id,
        content
      })
    } catch (error) {
      console.error('Error sending message:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to send message'
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

  // Show error if any
  useEffect(() => {
    if (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error
      })
    }
  }, [error, addToast])

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isClient ? 'Messages' : 'Client Messages'}
            </h1>
            <p className="text-muted-foreground">
              {isClient
                ? 'Communicate with your tax professional'
                : 'Communicate with your clients'
              }
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {!isClient && (
              <>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Conversation
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleCreateConversation('d82c05ad-7518-473e-beaf-5ccebc03796f', 'Test Conversation', 'Hello! This is a test message from the admin.')}
                >
                  Create Test Chat
                </Button>
              </>
            )}
            <Button variant="outline" onClick={refresh}>
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Conversations</p>
                    <p className="text-2xl font-bold">{stats.totalConversations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Chats</p>
                    <p className="text-2xl font-bold">{stats.activeConversations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive" className="w-5 h-5 rounded-full p-0 flex items-center justify-center">
                    {stats.unreadMessages}
                  </Badge>
                  <div>
                    <p className="text-sm text-muted-foreground">Unread Messages</p>
                    <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">{stats.messagesThisWeek}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <ConversationList
              conversations={conversations}
              currentConversation={currentConversation}
              onSelectConversation={handleSelectConversation}
              onCreateConversation={!isClient ? () => setShowCreateDialog(true) : undefined}
              loading={loading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <MessageChat
              conversation={currentConversation}
              messages={messages}
              currentUserId={user?.id || ''}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
              loading={loading}
              sending={sending}
            />
          </div>
        </div>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>{isClient ? 'Need Help?' : 'Admin Messaging Guide'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">
                  {isClient ? 'Getting Started' : 'Best Practices'}
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  {isClient ? (
                    <>
                      <li>• Your tax professional will start conversations with you</li>
                      <li>• You'll receive notifications for new messages</li>
                      <li>• All conversations are secure and private</li>
                    </>
                  ) : (
                    <>
                      <li>• Respond to client messages promptly</li>
                      <li>• Use clear, professional language</li>
                      <li>• Create conversations for new clients</li>
                      <li>• Mark conversations as read when handled</li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">
                  {isClient ? 'Tips' : 'Features'}
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  {isClient ? (
                    <>
                      <li>• Be specific when asking questions</li>
                      <li>• Include relevant document details</li>
                      <li>• Check messages regularly during tax season</li>
                    </>
                  ) : (
                    <>
                      <li>• Real-time message notifications</li>
                      <li>• Search conversations and messages</li>
                      <li>• Track read/unread status</li>
                      <li>• Organize by priority and status</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
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
