import { supabase } from '@/lib/supabase'
import { DealsService } from './DealsService'
import { CreateDealRequest } from '@/types/deals'

export interface VoiceCallData {
  id: string
  status: string
  customer: {
    number: string
    name?: string
  }
  transcript?: string
  summary?: string
  duration?: number
  cost?: number
  recording_url?: string
  started_at?: string
  ended_at?: string
  assistant_id?: string
  metadata?: Record<string, any>
}

export interface CallOutcome {
  sentiment: 'positive' | 'neutral' | 'negative'
  intent: 'interested' | 'not_interested' | 'callback' | 'appointment' | 'information' | 'complaint'
  lead_quality: 'hot' | 'warm' | 'cold'
  follow_up_required: boolean
  follow_up_date?: string
  notes: string
  extracted_info: {
    name?: string
    email?: string
    company?: string
    budget?: number
    timeline?: string
    pain_points?: string[]
    interests?: string[]
  }
}

export class VoiceCRMIntegrationService {
  /**
   * Process completed voice call and integrate with CRM
   */
  static async processCallCompletion(
    organizationId: string,
    callData: VoiceCallData
  ): Promise<{
    contact?: any
    deal?: any
    success: boolean
    error?: string
  }> {
    try {
      console.log(`📞 Processing call completion for org ${organizationId}:`, callData.id)

      // 1. Extract call outcome using AI analysis
      const outcome = await this.extractCallOutcome(callData)
      
      // 2. Find or create contact
      let contact = await this.findOrCreateContact(organizationId, callData, outcome)
      
      // 3. Record the call in our system
      const call = await this.recordCall(organizationId, callData, contact.id, outcome)
      
      // 4. Create deal if lead is qualified
      let deal = null
      if (this.shouldCreateDeal(outcome)) {
        deal = await this.createDealFromCall(organizationId, contact.id, callData, outcome, call.id)
      }
      
      // 5. Create follow-up tasks if needed
      if (outcome.follow_up_required) {
        await this.createFollowUpTask(organizationId, contact.id, deal?.id, outcome)
      }
      
      // 6. Update contact with call insights
      await this.updateContactWithCallInsights(contact.id, outcome)

      console.log(`✅ Call processing complete - Contact: ${contact.id}, Deal: ${deal?.id || 'none'}`)
      
      return {
        contact,
        deal,
        success: true
      }
    } catch (error) {
      console.error('❌ Error processing call completion:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Extract call outcome using AI analysis of transcript
   */
  private static async extractCallOutcome(callData: VoiceCallData): Promise<CallOutcome> {
    // This is a simplified version - in production, you'd use OpenAI or similar
    // to analyze the transcript and extract meaningful insights
    
    const transcript = callData.transcript || ''
    const summary = callData.summary || ''
    
    // Basic keyword analysis (replace with proper AI analysis)
    const positiveKeywords = ['interested', 'yes', 'sounds good', 'tell me more', 'when can we', 'price']
    const negativeKeywords = ['not interested', 'no thanks', 'remove me', 'stop calling', 'busy']
    const appointmentKeywords = ['schedule', 'meeting', 'appointment', 'call back', 'next week']
    
    const text = (transcript + ' ' + summary).toLowerCase()
    
    let sentiment: CallOutcome['sentiment'] = 'neutral'
    let intent: CallOutcome['intent'] = 'information'
    let lead_quality: CallOutcome['lead_quality'] = 'cold'
    
    // Analyze sentiment
    if (positiveKeywords.some(keyword => text.includes(keyword))) {
      sentiment = 'positive'
      lead_quality = 'warm'
    } else if (negativeKeywords.some(keyword => text.includes(keyword))) {
      sentiment = 'negative'
      intent = 'not_interested'
    }
    
    // Analyze intent
    if (appointmentKeywords.some(keyword => text.includes(keyword))) {
      intent = 'appointment'
      lead_quality = 'hot'
    } else if (text.includes('interested') || text.includes('tell me more')) {
      intent = 'interested'
      lead_quality = 'warm'
    }
    
    // Extract basic info (simplified - use proper NLP in production)
    const extracted_info: CallOutcome['extracted_info'] = {}
    
    // Try to extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
    if (emailMatch) {
      extracted_info.email = emailMatch[0]
    }
    
    // Try to extract company
    const companyMatch = text.match(/(?:work at|from|company|business)\s+([A-Za-z\s]+)/)
    if (companyMatch) {
      extracted_info.company = companyMatch[1].trim()
    }

    return {
      sentiment,
      intent,
      lead_quality,
      follow_up_required: intent === 'callback' || intent === 'appointment' || (intent === 'interested' && sentiment === 'positive'),
      follow_up_date: intent === 'appointment' ? this.getNextBusinessDay() : undefined,
      notes: summary || `Call completed with ${sentiment} sentiment. Intent: ${intent}`,
      extracted_info
    }
  }

  /**
   * Find existing contact or create new one
   */
  private static async findOrCreateContact(
    organizationId: string,
    callData: VoiceCallData,
    outcome: CallOutcome
  ) {
    // Try to find existing contact by phone number
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('phone', callData.customer.number)
      .single()

    if (existingContact) {
      console.log(`📋 Found existing contact: ${existingContact.id}`)
      return existingContact
    }

    // Create new contact
    const contactData = {
      organization_id: organizationId,
      first_name: outcome.extracted_info.name || callData.customer.name || 'Unknown',
      last_name: '',
      phone: callData.customer.number,
      email: outcome.extracted_info.email,
      company: outcome.extracted_info.company,
      lead_score: this.calculateLeadScore(outcome),
      status: 'active',
      tags: [outcome.lead_quality, outcome.intent],
      custom_fields: {
        source: 'voice_call',
        first_call_sentiment: outcome.sentiment,
        first_call_intent: outcome.intent
      }
    }

    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create contact: ${error.message}`)
    }

    console.log(`👤 Created new contact: ${newContact.id}`)
    return newContact
  }

  /**
   * Record the call in our system
   */
  private static async recordCall(
    organizationId: string,
    callData: VoiceCallData,
    contactId: string,
    outcome: CallOutcome
  ) {
    const callRecord = {
      organization_id: organizationId,
      contact_id: contactId,
      external_call_id: callData.id,
      phone_number: callData.customer.number,
      status: 'completed',
      outcome: outcome.intent,
      duration_seconds: callData.duration,
      cost_cents: callData.cost ? Math.round(callData.cost * 100) : null,
      recording_url: callData.recording_url,
      transcript: callData.transcript ? { content: callData.transcript } : null,
      summary: outcome.notes,
      sentiment_score: outcome.sentiment === 'positive' ? 0.8 : outcome.sentiment === 'negative' ? 0.2 : 0.5,
      next_action: outcome.follow_up_required ? 'follow_up' : null,
      next_action_date: outcome.follow_up_date,
      metadata: {
        assistant_id: callData.assistant_id,
        lead_quality: outcome.lead_quality,
        extracted_info: outcome.extracted_info
      },
      started_at: callData.started_at,
      ended_at: callData.ended_at
    }

    const { data: call, error } = await supabase
      .from('calls')
      .insert(callRecord)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to record call: ${error.message}`)
    }

    console.log(`📞 Recorded call: ${call.id}`)
    return call
  }

  /**
   * Determine if a deal should be created based on call outcome
   */
  private static shouldCreateDeal(outcome: CallOutcome): boolean {
    return (
      outcome.intent === 'interested' ||
      outcome.intent === 'appointment' ||
      (outcome.sentiment === 'positive' && outcome.lead_quality !== 'cold')
    )
  }

  /**
   * Create a deal from a qualified call
   */
  private static async createDealFromCall(
    organizationId: string,
    contactId: string,
    callData: VoiceCallData,
    outcome: CallOutcome,
    callId: string
  ) {
    const dealData: CreateDealRequest = {
      title: `${outcome.extracted_info.company || 'Voice Lead'} - ${outcome.intent}`,
      description: `Deal created from voice call. ${outcome.notes}`,
      contact_id: contactId,
      value_cents: outcome.extracted_info.budget ? outcome.extracted_info.budget * 100 : 0,
      priority: outcome.lead_quality === 'hot' ? 'high' : outcome.lead_quality === 'warm' ? 'medium' : 'low',
      lead_source: 'voice_call',
      custom_fields: {
        created_from_call: true,
        call_id: callId,
        call_sentiment: outcome.sentiment,
        call_intent: outcome.intent,
        extracted_info: outcome.extracted_info
      },
      tags: ['voice-generated', outcome.lead_quality, outcome.intent]
    }

    const { deal, error } = await DealsService.createDeal(
      organizationId,
      dealData,
      'system' // System-generated deal
    )

    if (error) {
      console.error('Failed to create deal from call:', error)
      return null
    }

    console.log(`💰 Created deal from call: ${deal?.id}`)
    return deal
  }

  /**
   * Create follow-up task
   */
  private static async createFollowUpTask(
    organizationId: string,
    contactId: string,
    dealId: string | undefined,
    outcome: CallOutcome
  ) {
    const taskData = {
      contact_id: contactId,
      deal_id: dealId,
      title: `Follow up on ${outcome.intent} call`,
      description: outcome.notes,
      task_type: outcome.intent === 'appointment' ? 'meeting' : 'call',
      priority: outcome.lead_quality === 'hot' ? 'high' : 'medium',
      due_date: outcome.follow_up_date || this.getNextBusinessDay(),
      metadata: {
        created_from_call: true,
        original_intent: outcome.intent,
        lead_quality: outcome.lead_quality
      }
    }

    // This would integrate with your task management system
    console.log(`📋 Would create follow-up task:`, taskData)
  }

  /**
   * Update contact with call insights
   */
  private static async updateContactWithCallInsights(
    contactId: string,
    outcome: CallOutcome
  ) {
    const updates = {
      last_contacted_at: new Date().toISOString(),
      lead_score: this.calculateLeadScore(outcome),
      custom_fields: {
        last_call_sentiment: outcome.sentiment,
        last_call_intent: outcome.intent,
        total_calls: 1 // This should be incremented
      }
    }

    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contactId)

    if (error) {
      console.error('Failed to update contact insights:', error)
    }
  }

  /**
   * Calculate lead score based on call outcome
   */
  private static calculateLeadScore(outcome: CallOutcome): number {
    let score = 50 // Base score

    // Sentiment scoring
    if (outcome.sentiment === 'positive') score += 30
    else if (outcome.sentiment === 'negative') score -= 20

    // Intent scoring
    switch (outcome.intent) {
      case 'interested': score += 25; break
      case 'appointment': score += 40; break
      case 'callback': score += 15; break
      case 'not_interested': score -= 30; break
    }

    // Lead quality scoring
    switch (outcome.lead_quality) {
      case 'hot': score += 20; break
      case 'warm': score += 10; break
      case 'cold': score -= 10; break
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Get next business day for follow-up
   */
  private static getNextBusinessDay(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // If tomorrow is weekend, move to Monday
    if (tomorrow.getDay() === 0) { // Sunday
      tomorrow.setDate(tomorrow.getDate() + 1)
    } else if (tomorrow.getDay() === 6) { // Saturday
      tomorrow.setDate(tomorrow.getDate() + 2)
    }
    
    return tomorrow.toISOString()
  }

  /**
   * Sync recent calls from VAPI
   */
  static async syncRecentCalls(organizationId: string, hours = 24): Promise<{
    processed: number
    errors: string[]
  }> {
    console.log(`🔄 Syncing calls from last ${hours} hours for org ${organizationId}`)
    
    let processed = 0
    const errors: string[] = []

    try {
      // This would integrate with your VAPI service to get recent calls
      // For now, we'll simulate the process
      console.log(`✅ Processed ${processed} calls with ${errors.length} errors`)
      
      return { processed, errors }
    } catch (error) {
      console.error('❌ Error syncing recent calls:', error)
      return { processed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] }
    }
  }
}
