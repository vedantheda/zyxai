'use client'

import { useState, useRef, useEffect } from 'react'
import { Message, Conversation } from '@/lib/types/messages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Paperclip,
  MoreVertical,
  Clock,
  Check,
  CheckCheck,
  User,
  Settings
} from 'lucide-react'
// import { formatDistanceToNow, format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MessageChatProps {
  conversation: Conversation | null
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string) => Promise<void>
  onMarkAsRead?: () => void
  loading?: boolean
  sending?: boolean
}

export function MessageChat({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onMarkAsRead,
  loading = false,
  sending = false
}: MessageChatProps) {
  const [messageContent, setMessageContent] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // Mark as read when conversation changes
  useEffect(() => {
    if (conversation && onMarkAsRead) {
      onMarkAsRead()
    }
  }, [conversation?.id, onMarkAsRead])

  const handleSendMessage = async () => {
    if (!messageContent.trim() || sending || !conversation) return

    const content = messageContent.trim()
    setMessageContent('') // Clear immediately for better UX

    try {
      await onSendMessage(content)
      textareaRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessageContent(content) // Restore message on error
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}

    messages.forEach(message => {
      const dateKey = message.createdAt.toISOString().split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })

    return groups
  }

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateStr = date.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (dateStr === todayStr) {
      return 'Today'
    } else if (dateStr === yesterdayStr) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!conversation) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No conversation selected</p>
          <p className="text-sm">Select a conversation to start messaging</p>
        </CardContent>
      </Card>
    )
  }

  const participant = conversation.client || conversation.admin
  const messageGroups = groupMessagesByDate(messages)

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={participant?.avatarUrl} />
              <AvatarFallback>
                {participant ? getInitials(participant.name) : '?'}
              </AvatarFallback>
            </Avatar>

            <div>
              <CardTitle className="text-lg">
                {participant?.name || 'Unknown User'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {conversation.subject}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {conversation.status}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Conversation Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea ref={scrollAreaRef} className="h-full p-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(messageGroups).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(messageGroups).map(([dateKey, dayMessages]) => (
                <div key={dateKey}>
                  {/* Date header */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {formatDateHeader(dateKey)}
                    </div>
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-4">
                    {dayMessages.map((message) => {
                      const isOwnMessage = message.senderId === currentUserId
                      const sender = message.sender

                      return (
                        <div
                          key={message.id}
                          className={`flex items-start space-x-3 ${
                            isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={sender?.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {sender ? getInitials(sender.name) : '?'}
                            </AvatarFallback>
                          </Avatar>

                          {/* Message bubble */}
                          <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>

                            {/* Message metadata */}
                            <div className={`flex items-center space-x-1 mt-1 text-xs text-muted-foreground ${
                              isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                            }`}>
                              <span>{formatMessageTime(message.createdAt)}</span>

                              {isOwnMessage && (
                                <div className="flex items-center">
                                  {message.isRead ? (
                                    <CheckCheck className="w-3 h-3 text-blue-500" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[60px] resize-none"
              disabled={sending}
              maxLength={2000}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              size="sm"
              disabled={sending}
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || sending}
              size="sm"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>{messageContent.length}/2000 characters</span>
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </Card>
  )
}
