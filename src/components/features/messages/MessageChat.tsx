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
// Temporarily disabled file attachment imports
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog'
// import { FileAttachmentInput, AttachmentDisplay } from './FileAttachment'
// import { fileUploadService } from '@/lib/services/fileUpload'
import { useToast } from '@/components/ui/toast'
interface MessageChatProps {
  conversation: Conversation | null
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string) => Promise<void>
  onMarkAsRead?: () => void
  loading?: boolean
  sending?: boolean
  typingUsers?: Set<string>
  onTypingIndicator?: (isTyping: boolean) => void
}
export function MessageChat({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onMarkAsRead,
  loading = false,
  sending = false,
  typingUsers = new Set(),
  onTypingIndicator
}: MessageChatProps) {
  const [messageContent, setMessageContent] = useState('')
  // Temporarily disable file attachments
  // const [attachments, setAttachments] = useState<any[]>([])
  // const [uploading, setUploading] = useState(false)
  // const [showAttachmentDialog, setShowAttachmentDialog] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const { addToast } = useToast()
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
    // Clear immediately for better UX
    setMessageContent('')
    try {
      // Stop typing indicator
      if (onTypingIndicator) {
        onTypingIndicator(false)
      }
      // Send message
      await onSendMessage(content)
      textareaRef.current?.focus()
    } catch (error) {
      // Restore message on error
      setMessageContent(content)
    }
  }
  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessageContent(value)
    // Send typing indicator
    if (onTypingIndicator && value.trim()) {
      onTypingIndicator(true)
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTypingIndicator(false)
      }, 3000)
    } else if (onTypingIndicator && !value.trim()) {
      onTypingIndicator(false)
    }
  }
  // Temporarily disabled file attachment functions
  /*
  const handleFileSelect = async (files: File[]) => {
    // File upload functionality temporarily disabled
  }
  const handleRemoveAttachment = (attachmentId: string) => {
    // File removal functionality temporarily disabled
  }
  */
  // Download attachment
  const handleDownloadAttachment = async (attachment: any) => {
    try {
      // If attachment has a direct URL, use it; otherwise get signed URL
      if (attachment.url) {
        window.open(attachment.url, '_blank')
      } else if (attachment.storage_path) {
        const downloadUrl = await fileUploadService.getDownloadUrl(attachment.storage_path)
        window.open(downloadUrl, '_blank')
      } else {
        throw new Error('No download URL available')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        description: 'Failed to download file'
      })
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
      // Ensure createdAt is a Date object
      const createdAt = message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt)
      const dateKey = createdAt.toISOString().split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    return groups
  }
  const formatMessageTime = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      <CardContent className="flex-1 p-0 overflow-hidden">
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
                  <div className="space-y-6">
                    {dayMessages.map((message) => {
                      const isOwnMessage = message.senderId === currentUserId
                      const sender = message.sender
                      return (
                        <div
                          key={message.id}
                          className={`flex items-start space-x-4 ${
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
                          <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div
                              className={`px-5 py-3 rounded-xl shadow-sm ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted border'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
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
              {/* Typing indicators */}
              {typingUsers.size > 0 && (
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {participant ? getInitials(participant.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      {/* Message input */}
      <div className="p-6 border-t bg-background/50">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={messageContent}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="min-h-[80px] resize-none border-2 focus:border-primary/50"
              disabled={sending}
              maxLength={2000}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || sending}
              size="default"
              className="h-[80px] px-6"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
          <span>{messageContent.length}/2000 characters</span>
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </Card>
  )
}
