import { supabase } from '@/lib/supabase'
import { VapiService, VapiCall } from './VapiService'

export interface Call {
  id: string
  organization_id: string
  agent_id: string
  contact_id?: string
  vapi_call_id?: string
  phone_number: string
  customer_name?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  direction: 'inbound' | 'outbound'
  duration?: number
  cost?: number
  recording_url?: string
  transcript?: string
  summary?: string
  metadata?: Record<string, any>
  started_at?: string
  ended_at?: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  organization_id: string
  agent_id: string
  name: string
  description?: string
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed'
  total_contacts: number
  completed_calls: number
  successful_calls: number
  scheduled_at?: string
  created_at: string
  updated_at: string
}

export class CallService {
  // ===== INDIVIDUAL CALLS =====

  /**
   * Create an outbound call
   */
  static async createOutboundCall(data: {
    organizationId: string
    agentId: string
    contactId?: string
    phoneNumber: string
    customerName?: string
    metadata?: Record<string, any>
  }): Promise<{ call: Call | null; error: string | null }> {
    try {
      // Get agent details to find Vapi assistant ID
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select('*, organization:organizations(*)')
        .eq('id', data.agentId)
        .single()

      if (agentError || !agent) {
        return { call: null, error: 'Agent not found' }
      }

      const vapiAssistantId = agent.voice_config?.vapi_assistant_id
      if (!vapiAssistantId) {
        return { call: null, error: 'Agent not configured for voice calls' }
      }

      // Get organization's phone number
      const { phoneNumbers } = await VapiService.getPhoneNumbers()
      const orgPhoneNumber = phoneNumbers.find(pn => pn.assistantId === vapiAssistantId)
      
      if (!orgPhoneNumber) {
        return { call: null, error: 'No phone number configured for this agent' }
      }

      // Create call record in database first
      const callData = {
        organization_id: data.organizationId,
        agent_id: data.agentId,
        contact_id: data.contactId,
        phone_number: data.phoneNumber,
        customer_name: data.customerName,
        status: 'pending' as const,
        direction: 'outbound' as const,
        metadata: data.metadata
      }

      const { data: call, error: dbError } = await supabase
        .from('calls')
        .insert(callData)
        .select()
        .single()

      if (dbError) {
        return { call: null, error: dbError.message }
      }

      // Create Vapi call
      const { call: vapiCall, error: vapiError } = await VapiService.createCall({
        assistantId: vapiAssistantId,
        phoneNumberId: orgPhoneNumber.id,
        customerNumber: data.phoneNumber,
        customerName: data.customerName,
        metadata: { ...data.metadata, zyxai_call_id: call.id }
      })

      if (vapiError || !vapiCall) {
        // Update call status to failed
        await supabase
          .from('calls')
          .update({ status: 'failed' })
          .eq('id', call.id)
        
        return { call: null, error: vapiError || 'Failed to initiate call' }
      }

      // Update call with Vapi call ID and status
      const { data: updatedCall, error: updateError } = await supabase
        .from('calls')
        .update({ 
          vapi_call_id: vapiCall.id,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', call.id)
        .select()
        .single()

      if (updateError) {
        return { call: null, error: updateError.message }
      }

      return { call: updatedCall, error: null }
    } catch (error) {
      console.error('Error creating outbound call:', error)
      return { call: null, error: 'Failed to create call' }
    }
  }

  /**
   * Get calls for an organization
   */
  static async getOrganizationCalls(
    organizationId: string,
    filters?: {
      agentId?: string
      status?: string
      direction?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ calls: Call[]; total: number; error: string | null }> {
    try {
      let query = supabase
        .from('calls')
        .select(`
          *,
          agent:ai_agents(name, agent_type),
          contact:contacts(first_name, last_name, company)
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (filters?.agentId) {
        query = query.eq('agent_id', filters.agentId)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.direction) {
        query = query.eq('direction', filters.direction)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data: calls, error, count } = await query

      if (error) {
        return { calls: [], total: 0, error: error.message }
      }

      return { calls: calls || [], total: count || 0, error: null }
    } catch (error) {
      return { calls: [], total: 0, error: 'Failed to fetch calls' }
    }
  }

  /**
   * Get call by ID
   */
  static async getCall(callId: string): Promise<{ call: Call | null; error: string | null }> {
    try {
      const { data: call, error } = await supabase
        .from('calls')
        .select(`
          *,
          agent:ai_agents(name, agent_type),
          contact:contacts(first_name, last_name, company, email),
          organization:organizations(name)
        `)
        .eq('id', callId)
        .single()

      if (error) {
        return { call: null, error: error.message }
      }

      return { call, error: null }
    } catch (error) {
      return { call: null, error: 'Failed to fetch call' }
    }
  }

  /**
   * Update call status (usually called by webhooks)
   */
  static async updateCallStatus(
    callId: string,
    updates: {
      status?: Call['status']
      duration?: number
      cost?: number
      recording_url?: string
      transcript?: string
      summary?: string
      ended_at?: string
    }
  ): Promise<{ call: Call | null; error: string | null }> {
    try {
      const { data: call, error } = await supabase
        .from('calls')
        .update(updates)
        .eq('id', callId)
        .select()
        .single()

      if (error) {
        return { call: null, error: error.message }
      }

      return { call, error: null }
    } catch (error) {
      return { call: null, error: 'Failed to update call' }
    }
  }

  // ===== CAMPAIGNS =====

  /**
   * Create a call campaign
   */
  static async createCampaign(data: {
    organizationId: string
    agentId: string
    name: string
    description?: string
    contactListId: string
    scheduledAt?: string
  }): Promise<{ campaign: Campaign | null; error: string | null }> {
    try {
      // Get contact count
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('list_id', data.contactListId)

      if (contactError) {
        return { campaign: null, error: contactError.message }
      }

      const campaignData = {
        organization_id: data.organizationId,
        agent_id: data.agentId,
        name: data.name,
        description: data.description,
        status: 'draft' as const,
        total_contacts: contacts?.length || 0,
        completed_calls: 0,
        successful_calls: 0,
        scheduled_at: data.scheduledAt
      }

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single()

      if (error) {
        return { campaign: null, error: error.message }
      }

      return { campaign, error: null }
    } catch (error) {
      return { campaign: null, error: 'Failed to create campaign' }
    }
  }

  /**
   * Start a campaign (create calls for all contacts)
   */
  static async startCampaign(campaignId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // This would be implemented to create individual calls for each contact
      // For now, just update status
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'running' })
        .eq('id', campaignId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to start campaign' }
    }
  }

  // ===== ANALYTICS =====

  /**
   * Get call analytics for organization
   */
  static async getCallAnalytics(
    organizationId: string,
    timeframe: 'today' | 'week' | 'month' | 'quarter' = 'month'
  ): Promise<{
    analytics: {
      totalCalls: number
      successfulCalls: number
      averageDuration: number
      totalCost: number
      conversionRate: number
      callsByDay: Array<{ date: string; calls: number }>
      callsByAgent: Array<{ agentName: string; calls: number; successRate: number }>
    } | null
    error: string | null
  }> {
    try {
      // This would implement actual analytics queries
      // For now, return mock data
      const analytics = {
        totalCalls: 0,
        successfulCalls: 0,
        averageDuration: 0,
        totalCost: 0,
        conversionRate: 0,
        callsByDay: [],
        callsByAgent: []
      }

      return { analytics, error: null }
    } catch (error) {
      return { analytics: null, error: 'Failed to fetch analytics' }
    }
  }
}
