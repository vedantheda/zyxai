'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Message, Conversation } from '@/lib/types/messages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Badge } from '@/components/ui/badge'
import {
  Send,
  Paperclip,
  MoreVertical,
  Clock,
  Check,
  CheckCheck,
  User,
  Settings,
  X,
  Edit3,
  Trash2,
  Save,
  ChevronDown
} from 'lucide-react'
// import { formatDistanceToNow, format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileAttachmentInput, AttachmentDisplay } from './FileAttachment'
import { MessageReactions, type MessageReaction } from './MessageReactions'
import { fileUploadService } from '@/lib/services/fileUpload'
import { useToast } from '@/components/ui/toast'
import { useUserPresence } from '@/hooks/features/useUserPresence'
interface MessageChatProps {
  conversation: Conversation | null
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>
  onMarkAsRead?: () => void
  onLoadMoreMessages?: (conversationId: string, before?: string) => Promise<void>
  onAddReaction?: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>
  onDeleteMessage?: (messageId: string) => Promise<void>
  loading?: boolean
  sending?: boolean
  hasMoreMessages?: boolean
  typingUsers?: Set<string>
  onTypingIndicator?: (conversationId: string, isTyping: boolean) => void
}
export function MessageChat({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onMarkAsRead,
  onLoadMoreMessages,
  onAddReaction,
  onRemoveReaction,
  onEditMessage,
  onDeleteMessage,
  loading = false,
  sending = false,
  hasMoreMessages = false,
  typingUsers = new Set(),
  onTypingIndicator
}: MessageChatProps) {
  const [messageContent, setMessageContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesTopRef = useRef<HTMLDivElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const { addToast } = useToast()
  const { isUserOnline } = useUserPresence()
  // Check if user is at bottom
  const isAtBottom = useCallback(() => {
    const scrollElement = scrollViewportRef.current
    if (!scrollElement) return true

    const { scrollTop, scrollHeight, clientHeight } = scrollElement
    return Math.abs(scrollHeight - scrollTop - clientHeight) < 10 // 10px tolerance
  }, [])

  // Track scroll position to show/hide scroll button
  useEffect(() => {
    const scrollElement = scrollViewportRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      setShowScrollButton(!isAtBottom())
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [isAtBottom])
  // Mark as read when conversation changes (debounced to prevent spam)
  useEffect(() => {
    if (conversation?.id && onMarkAsRead) {
      const timeoutId = setTimeout(() => {
        onMarkAsRead()
      }, 500) // Debounce for 500ms

      return () => clearTimeout(timeoutId)
    }
  }, [conversation?.id]) // Remove onMarkAsRead from dependencies to prevent infinite loop

  // Load draft when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      const draftKey = `draft_${conversation.id}`
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        setMessageContent(savedDraft)
      } else {
        setMessageContent('')
      }
    }
  }, [conversation?.id])

  // Save draft when content changes
  useEffect(() => {
    if (conversation?.id && messageContent.trim()) {
      const draftKey = `draft_${conversation.id}`
      const timeoutId = setTimeout(() => {
        localStorage.setItem(draftKey, messageContent)
      }, 1000) // Debounce for 1 second

      return () => clearTimeout(timeoutId)
    }
  }, [conversation?.id, messageContent])

  // Clear draft when message is sent
  const clearDraft = () => {
    if (conversation?.id) {
      const draftKey = `draft_${conversation.id}`
      localStorage.removeItem(draftKey)
    }
  }

  // Infinite scroll for loading more messages
  useEffect(() => {
    const scrollElement = scrollViewportRef.current
    if (!scrollElement || !onLoadMoreMessages || !conversation) return

    const handleScroll = async () => {
      if (scrollElement.scrollTop === 0 && hasMoreMessages && !loadingMore && !loading) {
        setLoadingMore(true)
        const oldestMessage = messages[0]
        try {
          await onLoadMoreMessages(conversation.id, oldestMessage?.id)
        } catch (error) {
          console.error('Failed to load more messages:', error)
        } finally {
          setLoadingMore(false)
        }
      }
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [conversation?.id, hasMoreMessages, loadingMore, loading, messages, onLoadMoreMessages])
  const handleSendMessage = async () => {
    if ((!messageContent.trim() && attachments.length === 0) || sending || !conversation) return
    const content = messageContent.trim()
    const filesToSend = [...attachments]

    // Clear immediately for better UX
    setMessageContent('')
    setAttachments([])
    clearDraft() // Clear the saved draft
    try {
      // Stop typing indicator
      if (onTypingIndicator && conversation) {
        onTypingIndicator(conversation.id, false)
      }
      // Send message with attachments
      await onSendMessage(content, filesToSend)
      textareaRef.current?.focus()
    } catch (error) {
      // Restore message and attachments on error
      setMessageContent(content)
      setAttachments(filesToSend)
    }
  }
  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessageContent(value)
    // Send typing indicator
    if (onTypingIndicator && conversation && value.trim()) {
      onTypingIndicator(conversation.id, true)
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (onTypingIndicator && conversation) {
          onTypingIndicator(conversation.id, false)
        }
      }, 3000)
    } else if (onTypingIndicator && conversation && !value.trim()) {
      onTypingIndicator(conversation.id, false)
    }
  }
  // File attachment functions
  const handleFileSelect = async (files: File[]) => {
    setAttachments(prev => [...prev, ...files])
    addToast({
      type: 'success',
      title: 'Files Added',
      description: `${files.length} file(s) ready to send`
    })
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Message editing handlers
  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
    setTimeout(() => {
      editTextareaRef.current?.focus()
    }, 100)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent('')
  }

  const handleSaveEdit = async () => {
    if (!editingMessageId || !onEditMessage || !editingContent.trim()) return

    try {
      await onEditMessage(editingMessageId, editingContent.trim())
      setEditingMessageId(null)
      setEditingContent('')
      addToast({
        type: 'success',
        title: 'Message updated',
        description: 'Your message has been updated successfully'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to update message',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!onDeleteMessage) return

    if (confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      try {
        await onDeleteMessage(messageId)
        addToast({
          type: 'success',
          title: 'Message deleted',
          description: 'The message has been deleted successfully'
        })
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Failed to delete message',
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    }
  }
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

  // Scroll to bottom function
  const scrollToBottom = () => {
    const scrollElement = scrollViewportRef.current
    if (scrollElement) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
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
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={participant?.avatarUrl} />
                <AvatarFallback>
                  {participant ? getInitials(participant.name) : '?'}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              {participant && (
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                  isUserOnline(participant.id || '') ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              )}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{participant?.name || 'Unknown User'}</span>
                {participant && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isUserOnline(participant.id || '')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isUserOnline(participant.id || '') ? 'Online' : 'Offline'}
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {conversation.client ? 'Client Conversation' : 'Admin Conversation'}
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
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <div
          ref={scrollViewportRef}
          className="h-full p-4 overflow-y-auto overflow-x-hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Load more messages indicator */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading more messages...</span>
              </div>
            </div>
          )}
          <div ref={messagesTopRef} />

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
                            {/* Message reactions */}
                            {(message.reactions && message.reactions.length > 0) || onAddReaction ? (
                              <div className={`${isOwnMessage ? 'flex justify-end' : ''}`}>
                                <MessageReactions
                                  messageId={message.id}
                                  reactions={message.reactions || []}
                                  currentUserId={currentUserId}
                                  onAddReaction={onAddReaction || (() => Promise.resolve())}
                                  onRemoveReaction={onRemoveReaction || (() => Promise.resolve())}
                                  disabled={!onAddReaction || !onRemoveReaction}
                                />
                              </div>
                            ) : null}
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
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <div className="absolute bottom-4 right-4">
            <Button
              onClick={scrollToBottom}
              size="sm"
              className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
              title="Scroll to bottom"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
      {/* Message input */}
      <div className="p-6 border-t bg-background/50">
        {/* File attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-4">
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
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
            <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="h-[38px] px-4"
                  disabled={sending}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Attach Files</DialogTitle>
                </DialogHeader>
                <FileAttachmentInput
                  onFileSelect={handleFileSelect}
                  maxFiles={5}
                  maxFileSize={10}
                  disabled={sending}
                />
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleSendMessage}
              disabled={(!messageContent.trim() && attachments.length === 0) || sending}
              size="default"
              className="h-[38px] px-6"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
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
