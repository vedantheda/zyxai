import { supabase, supabaseAdmin } from '@/lib/supabase'
import {
  Conversation,
  Message,
  MessageParticipant,
  CreateConversationRequest,
  SendMessageRequest,
  UpdateConversationRequest,
  MessageFilters,
  PaginatedConversations,
  PaginatedMessages,
  MessageStats,
  MessageAttachment
} from '@/lib/types/messages'

export class MessageService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Conversation Management
  async getConversations(filters: MessageFilters = {}): Promise<PaginatedConversations> {
    try {
      let query = supabaseAdmin
        .from('conversations')
        .select(`
          *,
          client:clients(id, name, email)
        `)
        .order('last_message_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId)
      }
      if (filters.adminId) {
        query = query.eq('admin_id', filters.adminId)
      }

      // Apply pagination
      const limit = filters.limit || 20
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Get unread counts and admin data for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const unreadCount = await this.getUnreadCount(conv.id)

          // Get admin profile data
          let adminData = null
          if (conv.admin_id) {
            const { data: adminProfile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email, avatar_url')
              .eq('id', conv.admin_id)
              .single()
            adminData = adminProfile
          }

          return {
            ...this.mapConversation({ ...conv, admin: adminData }),
            unreadCount
          }
        })
      )

      return {
        conversations: conversationsWithUnread,
        totalCount: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    } catch (error) {
      console.error('Error getting conversations:', error)
      throw error
    }
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          client:clients(id, name, email)
        `)
        .eq('id', conversationId)
        .single()

      if (error) throw error
      if (!data) return null

      const unreadCount = await this.getUnreadCount(conversationId)

      // Get admin profile data
      let adminData = null
      if (data.admin_id) {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('id', data.admin_id)
          .single()
        adminData = adminProfile
      }

      return {
        ...this.mapConversation({ ...data, admin: adminData }),
        unreadCount
      }
    } catch (error) {
      console.error('Error getting conversation:', error)
      return null
    }
  }

  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    try {
      // Verify the client exists
      console.log('🔍 MessageService: Looking for client:', { clientId: request.clientId })

      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, name, email')
        .eq('id', request.clientId)
        .single()

      console.log('🔍 MessageService: Client lookup result:', {
        clientId: request.clientId,
        client,
        clientError
      })

      if (clientError || !client) {
        console.error('Client not found:', { clientError, client, clientId: request.clientId })
        throw new Error('Client not found')
      }

      // Create conversation
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert({
          client_id: request.clientId,
          admin_id: this.userId,
          priority: request.priority || 'normal'
        })
        .select()
        .single()

      if (convError) throw convError

      // Add participants
      await supabaseAdmin
        .from('message_participants')
        .insert([
          {
            conversation_id: conversation.id,
            user_id: this.userId,
            role: 'admin'
          },
          {
            conversation_id: conversation.id,
            user_id: request.clientId,
            role: 'client'
          }
        ])

      // Send initial message if provided
      if (request.initialMessage) {
        await this.sendMessage({
          conversationId: conversation.id,
          content: request.initialMessage
        })
      }

      return this.mapConversation(conversation)
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  async updateConversation(
    conversationId: string,
    updates: UpdateConversationRequest
  ): Promise<Conversation> {
    try {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single()

      if (error) throw error

      return this.mapConversation(data)
    } catch (error) {
      console.error('Error updating conversation:', error)
      throw error
    }
  }

  // Message Management
  async getMessages(
    conversationId: string,
    limit = 50,
    before?: string
  ): Promise<PaginatedMessages> {
    try {
      let query = supabaseAdmin
        .from('messages')
        .select(`
          *
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (before) {
        query = query.lt('created_at', before)
      }

      const { data, error } = await query

      if (error) throw error

      const messages = (data || []).map(this.mapMessage).reverse()

      return {
        messages,
        totalCount: messages.length,
        hasMore: messages.length === limit,
        nextCursor: messages.length > 0 ? messages[0].createdAt.toISOString() : undefined
      }
    } catch (error) {
      console.error('Error getting messages:', error)
      throw error
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    try {
      // Determine sender type based on user role
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', this.userId)
        .single()

      const senderType = profile?.role === 'client' ? 'client' : 'admin'

      // Create message
      const { data: message, error: messageError } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: request.conversationId,
          sender_id: this.userId,
          sender_type: senderType,
          content: request.content,
          message_type: request.messageType || 'text',
          metadata: request.metadata || {}
        })
        .select(`
          *
        `)
        .single()

      if (messageError) throw messageError

      // Handle file attachments if any
      if (request.attachments && request.attachments.length > 0) {
        try {
          const { fileUploadService } = await import('@/lib/services/fileUpload')

          // Upload files and create attachment records
          for (const file of request.attachments) {
            const uploadResult = await fileUploadService.uploadFile(file, 'message-attachments', 'messages')

            // Create attachment record
            await supabaseAdmin
              .from('message_attachments')
              .insert({
                message_id: message.id,
                filename: uploadResult.name,
                original_filename: uploadResult.name,
                file_size: uploadResult.size,
                content_type: uploadResult.type,
                storage_path: uploadResult.path,
                file_url: uploadResult.url,
                is_image: uploadResult.type.startsWith('image/'),
                uploaded_by: this.userId,
                created_at: new Date().toISOString()
              })
          }
        } catch (error) {
          console.error('Error uploading attachments:', error)
          // Continue without attachments rather than failing the entire message
        }
      }

      return this.mapMessage(message)
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  async markAsRead(conversationId: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin.rpc('mark_messages_as_read', {
        conversation_id_param: conversationId,
        user_id_param: this.userId
      })

      if (error) throw error

      return data || 0
    } catch (error) {
      console.error('Error marking messages as read:', error)
      return 0
    }
  }

  async getUnreadCount(conversationId?: string): Promise<number> {
    try {
      if (conversationId) {
        const { count, error } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .eq('is_read', false)
          .neq('sender_id', this.userId)

        if (error) throw error
        return count || 0
      } else {
        const { data, error } = await supabaseAdmin.rpc('get_unread_message_count', {
          user_id_param: this.userId
        })

        if (error) throw error
        return data || 0
      }
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    try {
      // Verify the user owns this message
      const { data: existingMessage, error: fetchError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .eq('sender_id', this.userId)
        .single()

      if (fetchError || !existingMessage) {
        throw new Error('Message not found or you do not have permission to edit it')
      }

      // Update the message
      const { data: message, error: updateError } = await supabaseAdmin
        .from('messages')
        .update({
          content: content.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single()

      if (updateError) throw updateError

      return this.mapMessage(message)
    } catch (error) {
      console.error('Error editing message:', error)
      throw error
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      // Verify the user owns this message
      const { data: existingMessage, error: fetchError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .eq('sender_id', this.userId)
        .single()

      if (fetchError || !existingMessage) {
        throw new Error('Message not found or you do not have permission to delete it')
      }

      // Delete message attachments first
      await supabaseAdmin
        .from('message_attachments')
        .delete()
        .eq('message_id', messageId)

      // Delete message reactions
      await supabaseAdmin
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)

      // Delete the message
      const { error: deleteError } = await supabaseAdmin
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (deleteError) throw deleteError
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  async addReaction(messageId: string, emoji: string): Promise<any> {
    try {
      // Check if reaction already exists
      const { data: existingReaction } = await supabaseAdmin
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', this.userId)
        .eq('emoji', emoji)
        .single()

      if (existingReaction) {
        return existingReaction // Already reacted with this emoji
      }

      // Add new reaction
      const { data: reaction, error } = await supabaseAdmin
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: this.userId,
          emoji: emoji,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return reaction
    } catch (error) {
      console.error('Error adding reaction:', error)
      throw error
    }
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', this.userId)
        .eq('emoji', emoji)

      if (error) throw error
    } catch (error) {
      console.error('Error removing reaction:', error)
      throw error
    }
  }

  async getMessageStats(): Promise<MessageStats> {
    try {
      // Get basic stats
      const [totalConversations, activeConversations, unreadMessages] = await Promise.all([
        this.getConversationCount(),
        this.getConversationCount('active'),
        this.getUnreadCount()
      ])

      // Get weekly stats
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const [messagesThisWeek, conversationsThisWeek] = await Promise.all([
        this.getMessageCountSince(weekAgo),
        this.getConversationCountSince(weekAgo)
      ])

      return {
        totalConversations,
        activeConversations,
        unreadMessages,
        averageResponseTime: 0, // TODO: Calculate average response time
        messagesThisWeek,
        conversationsThisWeek
      }
    } catch (error) {
      console.error('Error getting message stats:', error)
      return {
        totalConversations: 0,
        activeConversations: 0,
        unreadMessages: 0,
        averageResponseTime: 0,
        messagesThisWeek: 0,
        conversationsThisWeek: 0
      }
    }
  }

  // Helper methods
  private async getConversationCount(status?: string): Promise<number> {
    let query = supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query
    if (error) throw error
    return count || 0
  }

  private async getMessageCountSince(since: Date): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since.toISOString())

    if (error) throw error
    return count || 0
  }

  private async getConversationCountSince(since: Date): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since.toISOString())

    if (error) throw error
    return count || 0
  }

  private mapConversation(data: any): Conversation {
    return {
      id: data.id,
      clientId: data.client_id,
      adminId: data.admin_id,
      status: data.status,
      priority: data.priority,
      lastMessageAt: new Date(data.last_message_at),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      client: data.client ? {
        id: data.client.id,
        name: data.client.name,
        email: data.client.email,
        avatarUrl: undefined
      } : undefined,
      admin: data.admin ? {
        id: data.admin.id,
        name: `${data.admin.first_name || ''} ${data.admin.last_name || ''}`.trim(),
        email: data.admin.email,
        avatarUrl: data.admin.avatar_url
      } : undefined
    }
  }

  private mapMessage(data: any): Message {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      senderType: data.sender_type,
      content: data.content,
      messageType: data.message_type,
      attachments: [], // Temporarily disabled until we fix the relationship
      isRead: data.is_read || false,
      readAt: data.read_at ? new Date(data.read_at) : undefined,
      isEdited: data.is_edited || false,
      editedAt: data.edited_at ? new Date(data.edited_at) : undefined,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      sender: data.sender ? {
        id: data.sender.id,
        name: `${data.sender.first_name || ''} ${data.sender.last_name || ''}`.trim(),
        email: data.sender.email,
        avatarUrl: data.sender.avatar_url,
        role: data.sender.role
      } : {
        id: data.sender_id,
        name: 'Unknown User',
        email: '',
        avatarUrl: undefined,
        role: data.sender_type || 'user'
      }
    }
  }

  private mapParticipant(data: any): MessageParticipant {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      userId: data.user_id,
      role: data.role,
      joinedAt: new Date(data.joined_at),
      lastReadAt: new Date(data.last_read_at),
      isActive: data.is_active,
      notificationsEnabled: data.notifications_enabled,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      user: data.user ? {
        id: data.user.id,
        name: `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim(),
        email: data.user.email,
        avatarUrl: data.user.avatar_url,
        role: data.user.role
      } : undefined
    }
  }

  private mapAttachment(data: any): MessageAttachment {
    return {
      id: data.id,
      filename: data.filename,
      originalFilename: data.original_filename,
      fileSize: data.file_size,
      contentType: data.content_type,
      fileUrl: data.file_url,
      storagePath: data.storage_path,
      isImage: data.is_image,
      thumbnailUrl: data.thumbnail_url,
      uploadedBy: data.uploaded_by,
      createdAt: new Date(data.created_at)
    }
  }
}
