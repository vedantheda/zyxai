import { supabaseAdmin } from '@/lib/supabase'
import { hubspotIntegration } from './hubspot'

interface VAPICallData {
  id: string
  assistantId: string
  phoneNumber: string
  customer: {
    number: string
    name?: string
    email?: string
  }
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  endedReason?: string
  cost?: number
  costBreakdown?: any
  messages?: any[]
  recordingUrl?: string
  transcript?: string
  summary?: string
  analysis?: any
  createdAt: string
  updatedAt: string
  endedAt?: string
}

interface CallOutcome {
  leadQuality: 'hot' | 'warm' | 'cold' | 'not_interested'
  leadScore: number
  interestedInServices: string[]
  followUpRequired: boolean
  followUpDate?: string
  notes: string
  estimatedValue?: number
  nextSteps: string[]
}

class VAPICRMIntegration {
  private vapiApiKey: string
  private vapiBaseUrl = 'https://api.vapi.ai'

  constructor(vapiApiKey: string) {
    this.vapiApiKey = vapiApiKey
  }

  private async makeVAPIRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.vapiBaseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.vapiApiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`VAPI API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Process call completion and update CRM
  async processCallCompletion(callData: VAPICallData) {
    console.log(`📞 Processing call completion: ${callData.id}`)

    try {
      // Extract call outcome from transcript/analysis
      const outcome = await this.extractCallOutcome(callData)
      
      // Find or create contact based on phone number
      let contact = await this.findContactByPhone(callData.customer.number)
      
      if (!contact) {
        // Create new lead from call
        contact = await this.createLeadFromCall(callData, outcome)
      } else {
        // Update existing contact with call outcome
        await this.updateContactFromCall(contact.id, callData, outcome)
      }

      // Record the call in our system
      await this.recordCall(callData, contact.id, outcome)

      // Sync to HubSpot if enabled
      await this.syncToHubSpot(contact, callData, outcome)

      // Create follow-up tasks if needed
      if (outcome.followUpRequired) {
        await this.createFollowUpTask(contact.id, outcome)
      }

      console.log(`✅ Call processing complete for contact: ${contact.id}`)
      return { contact, outcome }

    } catch (error) {
      console.error('❌ Error processing call completion:', error)
      throw error
    }
  }

  // Extract call outcome from VAPI call data
  private async extractCallOutcome(callData: VAPICallData): Promise<CallOutcome> {
    // Default outcome
    let outcome: CallOutcome = {
      leadQuality: 'cold',
      leadScore: 30,
      interestedInServices: [],
      followUpRequired: false,
      notes: '',
      nextSteps: []
    }

    // Analyze transcript if available
    if (callData.transcript) {
      outcome = await this.analyzeTranscript(callData.transcript)
    }

    // Use VAPI analysis if available
    if (callData.analysis) {
      outcome = { ...outcome, ...this.parseVAPIAnalysis(callData.analysis) }
    }

    // Use summary if available
    if (callData.summary) {
      outcome.notes = callData.summary
    }

    // Determine lead score based on call outcome
    outcome.leadScore = this.calculateLeadScore(outcome, callData)

    return outcome
  }

  // Analyze transcript to extract insights
  private async analyzeTranscript(transcript: string): Promise<CallOutcome> {
    // Simple keyword-based analysis (can be enhanced with AI)
    const lowerTranscript = transcript.toLowerCase()
    
    const outcome: CallOutcome = {
      leadQuality: 'cold',
      leadScore: 30,
      interestedInServices: [],
      followUpRequired: false,
      notes: transcript.substring(0, 500) + '...',
      nextSteps: []
    }

    // Detect interest level
    if (lowerTranscript.includes('interested') || lowerTranscript.includes('yes') || lowerTranscript.includes('tell me more')) {
      outcome.leadQuality = 'warm'
      outcome.leadScore = 60
    }

    if (lowerTranscript.includes('very interested') || lowerTranscript.includes('when can we start') || lowerTranscript.includes('pricing')) {
      outcome.leadQuality = 'hot'
      outcome.leadScore = 85
    }

    if (lowerTranscript.includes('not interested') || lowerTranscript.includes('no thanks') || lowerTranscript.includes('remove me')) {
      outcome.leadQuality = 'not_interested'
      outcome.leadScore = 10
    }

    // Detect services mentioned
    const services = ['voice ai', 'automation', 'crm', 'analytics', 'billing']
    outcome.interestedInServices = services.filter(service => 
      lowerTranscript.includes(service)
    )

    // Determine follow-up
    if (outcome.leadQuality === 'warm' || outcome.leadQuality === 'hot') {
      outcome.followUpRequired = true
      outcome.followUpDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    }

    // Extract next steps
    if (lowerTranscript.includes('call back')) {
      outcome.nextSteps.push('Schedule follow-up call')
    }
    if (lowerTranscript.includes('email')) {
      outcome.nextSteps.push('Send email with information')
    }
    if (lowerTranscript.includes('demo')) {
      outcome.nextSteps.push('Schedule product demo')
    }

    return outcome
  }

  // Parse VAPI analysis data
  private parseVAPIAnalysis(analysis: any): Partial<CallOutcome> {
    const outcome: Partial<CallOutcome> = {}

    // Extract sentiment and intent from VAPI analysis
    if (analysis.sentiment) {
      if (analysis.sentiment === 'positive') {
        outcome.leadQuality = 'warm'
        outcome.leadScore = 70
      } else if (analysis.sentiment === 'negative') {
        outcome.leadQuality = 'not_interested'
        outcome.leadScore = 20
      }
    }

    // Extract estimated value if mentioned
    if (analysis.budget || analysis.estimatedValue) {
      outcome.estimatedValue = parseFloat(analysis.budget || analysis.estimatedValue)
    }

    return outcome
  }

  // Calculate lead score based on various factors
  private calculateLeadScore(outcome: CallOutcome, callData: VAPICallData): number {
    let score = outcome.leadScore

    // Adjust based on call duration
    const callDuration = callData.endedAt && callData.createdAt 
      ? new Date(callData.endedAt).getTime() - new Date(callData.createdAt).getTime()
      : 0

    if (callDuration > 300000) { // 5+ minutes
      score += 20
    } else if (callDuration > 120000) { // 2+ minutes
      score += 10
    }

    // Adjust based on services interested in
    score += outcome.interestedInServices.length * 5

    // Adjust based on estimated value
    if (outcome.estimatedValue) {
      if (outcome.estimatedValue > 50000) score += 20
      else if (outcome.estimatedValue > 10000) score += 10
      else if (outcome.estimatedValue > 1000) score += 5
    }

    return Math.min(100, Math.max(0, score))
  }

  // Find contact by phone number
  private async findContactByPhone(phoneNumber: string) {
    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('phone', phoneNumber)
      .single()

    return contact
  }

  // Create new lead from call
  private async createLeadFromCall(callData: VAPICallData, outcome: CallOutcome) {
    const contactData = {
      organization_id: 'demo-org-123', // Replace with actual org ID
      first_name: callData.customer.name?.split(' ')[0] || 'Unknown',
      last_name: callData.customer.name?.split(' ').slice(1).join(' ') || 'Contact',
      email: callData.customer.email || '',
      phone: callData.customer.number,
      status: this.mapLeadQualityToStatus(outcome.leadQuality),
      lead_score: outcome.leadScore,
      source: 'voice_call',
      estimated_value: outcome.estimatedValue || 0,
      notes: outcome.notes,
      last_contact: new Date().toISOString(),
      next_follow_up: outcome.followUpDate,
      tags: ['voice-call', ...outcome.interestedInServices],
      custom_fields: {
        call_id: callData.id,
        call_outcome: outcome,
        assistant_id: callData.assistantId
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert(contactData)
      .select()
      .single()

    if (error) throw error

    console.log(`📋 Created new lead from call: ${contact.id}`)
    return contact
  }

  // Update existing contact from call
  private async updateContactFromCall(contactId: string, callData: VAPICallData, outcome: CallOutcome) {
    const updates = {
      status: this.mapLeadQualityToStatus(outcome.leadQuality),
      lead_score: outcome.leadScore,
      last_contact: new Date().toISOString(),
      next_follow_up: outcome.followUpDate,
      notes: outcome.notes,
      estimated_value: outcome.estimatedValue || 0,
      updated_at: new Date().toISOString(),
      custom_fields: {
        last_call_id: callData.id,
        last_call_outcome: outcome,
        assistant_id: callData.assistantId
      }
    }

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .update(updates)
      .eq('id', contactId)
      .select()
      .single()

    if (error) throw error

    console.log(`📋 Updated contact from call: ${contactId}`)
    return contact
  }

  // Record call in database
  private async recordCall(callData: VAPICallData, contactId: string, outcome: CallOutcome) {
    const callRecord = {
      vapi_call_id: callData.id,
      contact_id: contactId,
      assistant_id: callData.assistantId,
      phone_number: callData.phoneNumber,
      status: callData.status,
      ended_reason: callData.endedReason,
      cost: callData.cost || 0,
      recording_url: callData.recordingUrl,
      transcript: callData.transcript,
      summary: callData.summary,
      outcome: outcome,
      created_at: callData.createdAt,
      updated_at: callData.updatedAt,
      ended_at: callData.endedAt
    }

    const { error } = await supabaseAdmin
      .from('calls')
      .insert(callRecord)

    if (error) {
      console.error('❌ Error recording call:', error)
    } else {
      console.log(`📞 Recorded call: ${callData.id}`)
    }
  }

  // Sync to HubSpot
  private async syncToHubSpot(contact: any, callData: VAPICallData, outcome: CallOutcome) {
    try {
      await hubspotIntegration.syncContactToHubSpot({
        ...contact,
        firstName: contact.first_name,
        lastName: contact.last_name,
        zipCode: contact.zip_code,
        leadScore: contact.lead_score,
        estimatedValue: contact.estimated_value,
        lastContact: contact.last_contact,
        nextFollowUp: contact.next_follow_up
      })

      console.log(`🔄 Synced contact to HubSpot: ${contact.id}`)
    } catch (error) {
      console.error('❌ Error syncing to HubSpot:', error)
    }
  }

  // Create follow-up task
  private async createFollowUpTask(contactId: string, outcome: CallOutcome) {
    const task = {
      contact_id: contactId,
      title: 'Follow up on voice call',
      description: `Follow up based on call outcome: ${outcome.leadQuality}`,
      due_date: outcome.followUpDate,
      priority: outcome.leadQuality === 'hot' ? 'high' : 'medium',
      status: 'pending',
      created_at: new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .insert(task)

    if (error) {
      console.error('❌ Error creating follow-up task:', error)
    } else {
      console.log(`📋 Created follow-up task for contact: ${contactId}`)
    }
  }

  // Map lead quality to CRM status
  private mapLeadQualityToStatus(leadQuality: string): string {
    const statusMap: Record<string, string> = {
      'hot': 'qualified',
      'warm': 'contacted',
      'cold': 'new',
      'not_interested': 'closed_lost'
    }
    return statusMap[leadQuality] || 'new'
  }

  // Make outbound call through VAPI
  async makeOutboundCall(contactId: string, assistantId: string, phoneNumber: string) {
    try {
      const callData = {
        assistantId,
        phoneNumber,
        customer: {
          number: phoneNumber
        }
      }

      const call = await this.makeVAPIRequest('/call', {
        method: 'POST',
        body: JSON.stringify(callData)
      })

      // Record the call initiation
      await supabaseAdmin
        .from('calls')
        .insert({
          vapi_call_id: call.id,
          contact_id: contactId,
          assistant_id: assistantId,
          phone_number: phoneNumber,
          status: 'queued',
          created_at: new Date().toISOString()
        })

      console.log(`📞 Initiated outbound call: ${call.id}`)
      return call

    } catch (error) {
      console.error('❌ Error making outbound call:', error)
      throw error
    }
  }

  // Get call details from VAPI
  async getCallDetails(callId: string): Promise<VAPICallData> {
    return this.makeVAPIRequest(`/call/${callId}`)
  }

  // Bulk sync recent calls
  async syncRecentCalls(hours = 24) {
    console.log(`🔄 Syncing calls from last ${hours} hours...`)
    
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      
      const calls = await this.makeVAPIRequest(`/call?createdAtGte=${since}`)
      
      let processedCount = 0
      
      for (const call of calls.data || []) {
        if (call.status === 'ended') {
          await this.processCallCompletion(call)
          processedCount++
        }
      }
      
      console.log(`✅ Processed ${processedCount} calls`)
      return processedCount
      
    } catch (error) {
      console.error('❌ Error syncing recent calls:', error)
      throw error
    }
  }
}

// Export singleton instance (replace with actual VAPI API key)
export const vapiCRMIntegration = new VAPICRMIntegration(process.env.VOICE_AI_API_KEY || 'your-voice-ai-api-key')

// Export class for testing
export { VAPICRMIntegration }
