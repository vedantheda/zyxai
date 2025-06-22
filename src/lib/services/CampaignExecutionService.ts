import { supabase } from '@/lib/supabase'
import VapiService from './VapiService'
import { CallService } from './CallService'
import { ContactService } from './ContactService'
import CRMWebhookService from './CRMWebhookService'

export interface CampaignExecution {
  campaignId: string
  status: 'preparing' | 'running' | 'paused' | 'completed' | 'failed'
  totalCalls: number
  completedCalls: number
  successfulCalls: number
  failedCalls: number
  currentBatch: number
  estimatedCompletion?: Date
  errors: string[]
}

export interface CallQueueItem {
  id: string
  campaignId: string
  contactId: string
  agentId: string
  scheduledAt: Date
  priority: number
  attempts: number
  maxAttempts: number
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'retry'
  lastAttemptAt?: Date
  nextRetryAt?: Date
}

export class CampaignExecutionService {
  private static activeExecutions = new Map<string, CampaignExecution>()
  private static callQueue = new Map<string, CallQueueItem[]>()

  /**
   * Start campaign execution
   */
  static async startCampaign(campaignId: string): Promise<{
    execution: CampaignExecution | null
    error: string | null
  }> {
    try {
      console.log(`🚀 Starting campaign execution: ${campaignId}`)

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('call_campaigns')
        .select(`
          *,
          agent:ai_agents(*),
          organization:organizations(*)
        `)
        .eq('id', campaignId)
        .single()

      if (campaignError || !campaign) {
        return { execution: null, error: 'Campaign not found' }
      }

      // Get campaign contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('list_id', campaign.contact_list_id)
        .eq('status', 'active')

      if (contactsError) {
        return { execution: null, error: 'Failed to load contacts' }
      }

      if (!contacts || contacts.length === 0) {
        return { execution: null, error: 'No active contacts found in campaign' }
      }

      // Create execution tracking
      const execution: CampaignExecution = {
        campaignId,
        status: 'preparing',
        totalCalls: contacts.length,
        completedCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        currentBatch: 1,
        errors: []
      }

      this.activeExecutions.set(campaignId, execution)

      // Update campaign status
      await supabase
        .from('call_campaigns')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      // Create call queue
      const callQueue = await this.createCallQueue(campaignId, contacts, campaign.agent_id)
      this.callQueue.set(campaignId, callQueue)

      // Start processing calls
      execution.status = 'running'
      this.processCallQueue(campaignId)

      console.log(`✅ Campaign started: ${contacts.length} calls queued`)
      return { execution, error: null }

    } catch (error: any) {
      console.error('❌ Failed to start campaign:', error)
      return { execution: null, error: error.message || 'Failed to start campaign' }
    }
  }

  /**
   * Create call queue from contacts
   */
  private static async createCallQueue(
    campaignId: string,
    contacts: any[],
    agentId: string
  ): Promise<CallQueueItem[]> {
    const queue: CallQueueItem[] = []
    const now = new Date()

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      // Schedule calls with 30-second intervals to avoid overwhelming
      const scheduledAt = new Date(now.getTime() + (i * 30 * 1000))

      const queueItem: CallQueueItem = {
        id: `${campaignId}-${contact.id}`,
        campaignId,
        contactId: contact.id,
        agentId,
        scheduledAt,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        status: 'pending'
      }

      queue.push(queueItem)
    }

    return queue.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
  }

  /**
   * Process call queue
   */
  private static async processCallQueue(campaignId: string) {
    const execution = this.activeExecutions.get(campaignId)
    const queue = this.callQueue.get(campaignId)

    if (!execution || !queue) {
      console.error('❌ No execution or queue found for campaign:', campaignId)
      return
    }

    console.log(`📞 Processing call queue for campaign ${campaignId}: ${queue.length} calls`)

    // Process calls in batches to avoid overwhelming the system
    const batchSize = 5
    const now = new Date()

    for (let i = 0; i < queue.length; i += batchSize) {
      if (execution.status !== 'running') {
        console.log(`⏸️ Campaign ${campaignId} paused or stopped`)
        break
      }

      const batch = queue.slice(i, i + batchSize)
      const readyCalls = batch.filter(call =>
        call.status === 'pending' &&
        call.scheduledAt <= now
      )

      if (readyCalls.length > 0) {
        console.log(`📞 Processing batch ${Math.floor(i / batchSize) + 1}: ${readyCalls.length} calls`)

        // Process calls in parallel within batch
        const callPromises = readyCalls.map(call => this.executeCall(call))
        await Promise.allSettled(callPromises)

        // Update execution progress
        execution.completedCalls += readyCalls.length
        execution.currentBatch = Math.floor(i / batchSize) + 1

        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Mark campaign as completed
    execution.status = 'completed'
    await supabase
      .from('call_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_calls: execution.completedCalls,
        successful_calls: execution.successfulCalls
      })
      .eq('id', campaignId)

    // Trigger CRM webhook for campaign completion
    CRMWebhookService.triggerWebhookEvent({
      source: 'campaign_completed',
      entity_type: 'campaign',
      entity_id: campaignId,
      organization_id: execution.campaignId.split('-')[0], // Extract org ID from campaign ID
      data: {
        total_calls: execution.totalCalls,
        completed_calls: execution.completedCalls,
        successful_calls: execution.successfulCalls,
        failed_calls: execution.failedCalls,
        success_rate: execution.completedCalls > 0
          ? Math.round((execution.successfulCalls / execution.completedCalls) * 100)
          : 0
      }
    })

    console.log(`✅ Campaign ${campaignId} completed: ${execution.completedCalls}/${execution.totalCalls} calls`)
  }

  /**
   * Execute individual call
   */
  private static async executeCall(queueItem: CallQueueItem): Promise<void> {
    try {
      console.log(`📞 Executing call: ${queueItem.id}`)

      queueItem.status = 'calling'
      queueItem.attempts++
      queueItem.lastAttemptAt = new Date()

      // Get contact details
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', queueItem.contactId)
        .single()

      if (contactError || !contact) {
        throw new Error('Contact not found')
      }

      // Get agent details
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', queueItem.agentId)
        .single()

      if (agentError || !agent) {
        throw new Error('Agent not found')
      }

      // Create call record
      const { data: callRecord, error: callError } = await supabase
        .from('calls')
        .insert({
          campaign_id: queueItem.campaignId,
          agent_id: queueItem.agentId,
          contact_id: queueItem.contactId,
          phone_number: contact.phone,
          status: 'initiated',
          scheduled_at: queueItem.scheduledAt.toISOString(),
          metadata: {
            contact_name: `${contact.first_name} ${contact.last_name}`.trim(),
            campaign_batch: Math.floor(Date.now() / 1000), // Simple batch identifier
            attempt_number: queueItem.attempts
          }
        })
        .select()
        .single()

      if (callError || !callRecord) {
        throw new Error('Failed to create call record')
      }

      // Execute call via VAPI (in production)
      // For now, simulate call execution
      const callResult = await this.simulateCall(callRecord, contact, agent)

      // Update call record with results
      await supabase
        .from('calls')
        .update({
          status: callResult.status,
          duration_seconds: callResult.duration,
          transcript: callResult.transcript,
          summary: callResult.summary,
          sentiment_score: callResult.sentiment,
          next_action: callResult.nextAction,
          ended_at: new Date().toISOString()
        })
        .eq('id', callRecord.id)

      // Update queue item
      queueItem.status = callResult.status === 'completed' ? 'completed' : 'failed'

      // Update execution stats
      const execution = this.activeExecutions.get(queueItem.campaignId)
      if (execution) {
        if (callResult.status === 'completed') {
          execution.successfulCalls++
        } else {
          execution.failedCalls++
        }
      }

      // Trigger CRM webhook for call completion
      CRMWebhookService.triggerWebhookEvent({
        source: 'call_completed',
        entity_type: 'call',
        entity_id: callRecord.id,
        organization_id: callRecord.organization_id || queueItem.campaignId.split('-')[0], // Fallback
        data: {
          contact_id: queueItem.contactId,
          call_outcome: callResult.status,
          next_action: callResult.nextAction,
          sentiment_score: callResult.sentiment,
          duration: callResult.duration,
          summary: callResult.summary
        }
      })

      console.log(`✅ Call completed: ${queueItem.id} - ${callResult.status}`)

    } catch (error: any) {
      console.error(`❌ Call failed: ${queueItem.id}`, error)

      queueItem.status = 'failed'

      // Schedule retry if attempts remaining
      if (queueItem.attempts < queueItem.maxAttempts) {
        queueItem.status = 'retry'
        queueItem.nextRetryAt = new Date(Date.now() + (queueItem.attempts * 5 * 60 * 1000)) // Exponential backoff
      }

      const execution = this.activeExecutions.get(queueItem.campaignId)
      if (execution) {
        execution.failedCalls++
        execution.errors.push(`Call ${queueItem.id}: ${error.message}`)
      }
    }
  }

  /**
   * Simulate call execution (replace with actual VAPI integration)
   */
  private static async simulateCall(callRecord: any, contact: any, agent: any): Promise<{
    status: string
    duration: number
    transcript: any
    summary: string
    sentiment: number
    nextAction: string
  }> {
    // Simulate call duration (2-8 minutes)
    const duration = Math.floor(Math.random() * 360) + 120

    // Simulate call outcome
    const outcomes = ['completed', 'no_answer', 'busy', 'voicemail', 'failed']
    const weights = [0.6, 0.15, 0.1, 0.1, 0.05] // 60% success rate
    const status = this.weightedRandom(outcomes, weights)

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      status,
      duration,
      transcript: {
        messages: [
          { role: 'assistant', content: `Hello ${contact.first_name}, this is ${agent.name}...` },
          { role: 'user', content: 'Hello, who is this?' },
          { role: 'assistant', content: 'I\'m calling from our real estate team...' }
        ]
      },
      summary: `Call with ${contact.first_name} ${contact.last_name} - ${status}`,
      sentiment: Math.random() * 0.4 + 0.3, // 0.3 to 0.7
      nextAction: status === 'completed' ? 'schedule_followup' : 'retry_later'
    }
  }

  /**
   * Weighted random selection
   */
  private static weightedRandom(items: string[], weights: number[]): string {
    const random = Math.random()
    let weightSum = 0

    for (let i = 0; i < items.length; i++) {
      weightSum += weights[i]
      if (random <= weightSum) {
        return items[i]
      }
    }

    return items[items.length - 1]
  }

  /**
   * Get campaign execution status
   */
  static getCampaignExecution(campaignId: string): CampaignExecution | null {
    return this.activeExecutions.get(campaignId) || null
  }

  /**
   * Pause campaign execution
   */
  static async pauseCampaign(campaignId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const execution = this.activeExecutions.get(campaignId)
      if (!execution) {
        return { success: false, error: 'Campaign execution not found' }
      }

      execution.status = 'paused'

      await supabase
        .from('call_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId)

      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Stop campaign execution
   */
  static async stopCampaign(campaignId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const execution = this.activeExecutions.get(campaignId)
      if (execution) {
        execution.status = 'completed'
      }

      this.activeExecutions.delete(campaignId)
      this.callQueue.delete(campaignId)

      await supabase
        .from('call_campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get all active executions
   */
  static getActiveExecutions(): Map<string, CampaignExecution> {
    return this.activeExecutions
  }
}
