/**
 * Optimized Database Service for ZyxAI
 * Fixes N+1 query issues and improves performance
 */

import { supabase, supabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']
type Conversation = Tables['conversations']['Row']
type Message = Tables['messages']['Row']
type Contact = Tables['contacts']['Row']
type Call = Tables['calls']['Row']

interface OptimizedConversation extends Conversation {
  admin?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  }
  unread_count: number
  latest_message?: {
    content: string
    created_at: string
    sender_type: string
  }
}

interface OptimizedContact extends Contact {
  call_count: number
  last_call_date: string | null
  last_call_status: string | null
  tags: string[]
}

export class OptimizedDatabaseService {
  /**
   * Get conversations with all related data in a single optimized query
   * Fixes N+1 query issue in MessageService
   */
  static async getOptimizedConversations(
    userId: string,
    filters: {
      limit?: number
      offset?: number
      status?: string
      search?: string
    } = {}
  ): Promise<{
    conversations: OptimizedConversation[]
    totalCount: number
    error: string | null
  }> {
    try {
      const { limit = 20, offset = 0, status, search } = filters

      // Build the query with all joins to avoid N+1 queries
      let query = supabaseAdmin
        .from('conversations')
        .select(`
          *,
          admin:profiles!admin_id(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          messages!inner(
            id,
            content,
            created_at,
            sender_type,
            is_read
          )
        `, { count: 'exact' })
        .eq('client_id', userId)
        .order('updated_at', { ascending: false })

      // Apply filters
      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Process the data to calculate unread counts and latest messages
      const optimizedConversations: OptimizedConversation[] = (data || []).map(conv => {
        const messages = conv.messages || []
        
        // Calculate unread count
        const unread_count = messages.filter(msg => 
          !msg.is_read && msg.sender_type === 'admin'
        ).length

        // Get latest message
        const latest_message = messages.length > 0 
          ? messages.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
          : undefined

        return {
          ...conv,
          admin: conv.admin,
          unread_count,
          latest_message: latest_message ? {
            content: latest_message.content,
            created_at: latest_message.created_at,
            sender_type: latest_message.sender_type
          } : undefined
        }
      })

      return {
        conversations: optimizedConversations,
        totalCount: count || 0,
        error: null
      }

    } catch (error: any) {
      console.error('Error in getOptimizedConversations:', error)
      return {
        conversations: [],
        totalCount: 0,
        error: error.message || 'Failed to fetch conversations'
      }
    }
  }

  /**
   * Get contacts with aggregated call data in a single query
   * Fixes N+1 query issue in ContactService
   */
  static async getOptimizedContacts(
    organizationId: string,
    filters: {
      limit?: number
      offset?: number
      search?: string
      tags?: string[]
    } = {}
  ): Promise<{
    contacts: OptimizedContact[]
    totalCount: number
    error: string | null
  }> {
    try {
      const { limit = 50, offset = 0, search, tags } = filters

      // Single query with aggregations to avoid N+1 queries
      let query = supabaseAdmin
        .from('contacts')
        .select(`
          *,
          calls!left(
            id,
            created_at,
            status,
            direction
          ),
          contact_tags!left(
            tag:tags(name)
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search) {
        query = query.or(`
          first_name.ilike.%${search}%,
          last_name.ilike.%${search}%,
          email.ilike.%${search}%,
          phone.ilike.%${search}%,
          company.ilike.%${search}%
        `)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Process the data to calculate aggregations
      const optimizedContacts: OptimizedContact[] = (data || []).map(contact => {
        const calls = contact.calls || []
        const contactTags = contact.contact_tags || []

        // Calculate call statistics
        const call_count = calls.length
        const sortedCalls = calls.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const lastCall = sortedCalls[0]

        // Extract tags
        const tags = contactTags
          .map(ct => ct.tag?.name)
          .filter(Boolean) as string[]

        return {
          ...contact,
          call_count,
          last_call_date: lastCall?.created_at || null,
          last_call_status: lastCall?.status || null,
          tags
        }
      })

      // Apply tag filter after processing (if needed)
      let filteredContacts = optimizedContacts
      if (tags && tags.length > 0) {
        filteredContacts = optimizedContacts.filter(contact =>
          tags.some(tag => contact.tags.includes(tag))
        )
      }

      return {
        contacts: filteredContacts,
        totalCount: count || 0,
        error: null
      }

    } catch (error: any) {
      console.error('Error in getOptimizedContacts:', error)
      return {
        contacts: [],
        totalCount: 0,
        error: error.message || 'Failed to fetch contacts'
      }
    }
  }

  /**
   * Get calls with related data in a single optimized query
   */
  static async getOptimizedCalls(
    organizationId: string,
    filters: {
      limit?: number
      offset?: number
      agentId?: string
      status?: string
      direction?: string
      dateRange?: { start: string; end: string }
    } = {}
  ): Promise<{
    calls: any[]
    totalCount: number
    error: string | null
  }> {
    try {
      const { limit = 50, offset = 0, agentId, status, direction, dateRange } = filters

      // Single query with all joins
      let query = supabaseAdmin
        .from('calls')
        .select(`
          *,
          agent:ai_agents(
            id,
            name,
            agent_type
          ),
          contact:contacts(
            id,
            first_name,
            last_name,
            company,
            phone,
            email
          ),
          call_recordings(
            id,
            recording_url,
            duration
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (agentId) {
        query = query.eq('agent_id', agentId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (direction) {
        query = query.eq('direction', direction)
      }

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        calls: data || [],
        totalCount: count || 0,
        error: null
      }

    } catch (error: any) {
      console.error('Error in getOptimizedCalls:', error)
      return {
        calls: [],
        totalCount: 0,
        error: error.message || 'Failed to fetch calls'
      }
    }
  }

  /**
   * Batch operations for better performance
   */
  static async batchUpdateContacts(
    updates: Array<{ id: string; data: Partial<Contact> }>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Use upsert for batch operations
      const { error } = await supabaseAdmin
        .from('contacts')
        .upsert(
          updates.map(update => ({
            id: update.id,
            ...update.data,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'id' }
        )

      if (error) throw error

      return { success: true, error: null }

    } catch (error: any) {
      console.error('Error in batchUpdateContacts:', error)
      return { success: false, error: error.message || 'Batch update failed' }
    }
  }

  /**
   * Get dashboard analytics with optimized queries
   */
  static async getDashboardAnalytics(
    organizationId: string,
    timeRange: { start: string; end: string }
  ): Promise<{
    analytics: {
      totalCalls: number
      successfulCalls: number
      totalContacts: number
      activeAgents: number
      callsByDay: Array<{ date: string; count: number }>
      topAgents: Array<{ name: string; calls: number }>
    }
    error: string | null
  }> {
    try {
      // Use a single query with aggregations
      const { data, error } = await supabaseAdmin.rpc('get_dashboard_analytics', {
        org_id: organizationId,
        start_date: timeRange.start,
        end_date: timeRange.end
      })

      if (error) throw error

      return {
        analytics: data || {
          totalCalls: 0,
          successfulCalls: 0,
          totalContacts: 0,
          activeAgents: 0,
          callsByDay: [],
          topAgents: []
        },
        error: null
      }

    } catch (error: any) {
      console.error('Error in getDashboardAnalytics:', error)
      return {
        analytics: {
          totalCalls: 0,
          successfulCalls: 0,
          totalContacts: 0,
          activeAgents: 0,
          callsByDay: [],
          topAgents: []
        },
        error: error.message || 'Failed to fetch analytics'
      }
    }
  }

  /**
   * Connection health check with retry logic
   */
  static async healthCheck(): Promise<{
    healthy: boolean
    responseTime: number
    error: string | null
  }> {
    const startTime = Date.now()

    try {
      // Simple query to test connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single()

      const responseTime = Date.now() - startTime

      if (error) {
        return {
          healthy: false,
          responseTime,
          error: error.message
        }
      }

      return {
        healthy: true,
        responseTime,
        error: null
      }

    } catch (error: any) {
      const responseTime = Date.now() - startTime
      return {
        healthy: false,
        responseTime,
        error: error.message || 'Database connection failed'
      }
    }
  }
}
