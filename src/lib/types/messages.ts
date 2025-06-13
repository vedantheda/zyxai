// Message System Types and Interfaces
export interface MessageAttachment {
  id: string
  filename: string
  originalFilename: string
  fileSize: number
  contentType: string
  fileUrl: string
  storagePath: string
  isImage: boolean
  thumbnailUrl?: string
  uploadedBy: string
  createdAt: Date
}
export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderType: 'client' | 'admin'
  content: string
  messageType: 'text' | 'file' | 'system' | 'mixed'
  attachments: MessageAttachment[]
  isRead: boolean
  readAt?: Date
  isEdited: boolean
  editedAt?: Date
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  // Populated fields
  sender?: {
    id: string
    name: string
    email: string
    avatarUrl?: string
    role: string
  }
}
export interface Conversation {
  id: string
  clientId: string
  adminId: string
  subject: string
  status: 'active' | 'closed' | 'archived'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
  // Populated fields
  client?: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
  admin?: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
  lastMessage?: Message | string
  unreadCount?: number
  participants?: MessageParticipant[]
}
export interface MessageParticipant {
  id: string
  conversationId: string
  userId: string
  role: 'client' | 'admin' | 'observer'
  joinedAt: Date
  lastReadAt: Date
  isActive: boolean
  notificationsEnabled: boolean
  createdAt: Date
  updatedAt: Date
  // Populated fields
  user?: {
    id: string
    name: string
    email: string
    avatarUrl?: string
    role: string
  }
}
export interface CreateConversationRequest {
  clientId: string
  subject: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  initialMessage?: string
}
export interface SendMessageRequest {
  conversationId: string
  content: string
  messageType?: 'text' | 'file' | 'system' | 'mixed'
  attachments?: any[]
  metadata?: Record<string, any>
}
export interface UpdateConversationRequest {
  subject?: string
  status?: 'active' | 'closed' | 'archived'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}
export interface MessageFilters {
  status?: 'active' | 'closed' | 'archived'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  clientId?: string
  adminId?: string
  unreadOnly?: boolean
  search?: string
  limit?: number
  offset?: number
}
export interface MessageNotification {
  id: string
  userId: string
  conversationId: string
  messageId: string
  type: 'new_message' | 'new_conversation' | 'mention'
  title: string
  content: string
  isRead: boolean
  createdAt: Date
  // Populated fields
  conversation?: Conversation
  message?: Message
}
export interface MessageStats {
  totalConversations: number
  activeConversations: number
  unreadMessages: number
  averageResponseTime: number // in minutes
  messagesThisWeek: number
  conversationsThisWeek: number
}
// Real-time event types
export interface MessageEvent {
  type: 'message_sent' | 'message_read' | 'conversation_updated' | 'typing_start' | 'typing_stop'
  conversationId: string
  userId: string
  data: any
  timestamp: Date
}
export interface TypingIndicator {
  conversationId: string
  userId: string
  userName: string
  isTyping: boolean
  timestamp: Date
}
// Message search and pagination
export interface MessageSearchResult {
  messages: Message[]
  conversations: Conversation[]
  totalCount: number
  hasMore: boolean
}
export interface PaginatedMessages {
  messages: Message[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
}
export interface PaginatedConversations {
  conversations: Conversation[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
}
// Message validation
export interface MessageValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
// File upload types
export interface FileUploadProgress {
  fileId: string
  filename: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}
export interface MessageDraft {
  conversationId: string
  content: string
  attachments: File[]
  lastSaved: Date
}
// Message formatting and display
export interface MessageDisplayOptions {
  showTimestamps: boolean
  showReadReceipts: boolean
  groupByDate: boolean
  showAvatars: boolean
  compactMode: boolean
}
// Conversation settings
export interface ConversationSettings {
  conversationId: string
  notificationsEnabled: boolean
  emailNotifications: boolean
  soundEnabled: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
}
// Message templates for common responses
export interface MessageTemplate {
  id: string
  title: string
  content: string
  category: string
  isActive: boolean
  usageCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
// Bulk operations
export interface BulkMessageOperation {
  messageIds: string[]
  operation: 'mark_read' | 'mark_unread' | 'delete' | 'archive'
}
export interface BulkConversationOperation {
  conversationIds: string[]
  operation: 'close' | 'archive' | 'delete' | 'change_priority'
  data?: any
}
