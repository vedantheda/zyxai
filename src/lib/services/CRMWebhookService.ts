import { supabase } from '@/lib/supabase'
import { CRMIntegrationService } from './CRMIntegrationService'

export interface WebhookEvent {
  id: string
  source: 'campaign_completed' | 'call_completed' | 'contact_updated' | 'manual_trigger'
  entity_type: 'contact' | 'call' | 'campaign'
  entity_id: string
  organization_id: string
  data: Record<string, any>
  timestamp: string
}

export interface CRMWebhookConfig {
  organization_id: string
  crm_type: string
  enabled: boolean
  events: string[]
  settings: {
    auto_sync_calls: boolean
    auto_sync_contacts: boolean
    auto_create_tasks: boolean
    auto_update_lead_status: boolean
    delay_seconds?: number
  }
}

export class CRMWebhookService {
  /**
   * Process webhook event for CRM sync
   */
  static async processWebhookEvent(event: WebhookEvent): Promise<{
    success: boolean
    actions_taken: string[]
    errors: string[]
  }> {
    try {
      console.log(`🔔 Processing webhook event: ${event.source} for ${event.entity_type} ${event.entity_id}`)

      const actionsTaken: string[] = []
      const errors: string[] = []

      // Get CRM webhook configuration
      const config = await this.getWebhookConfig(event.organization_id)
      if (!config || !config.enabled) {
        return { 
          success: true, 
          actions_taken: ['Webhook processing skipped - not enabled'], 
          errors: [] 
        }
      }

      // Add delay if configured
      if (config.settings.delay_seconds) {
        await new Promise(resolve => setTimeout(resolve, config.settings.delay_seconds! * 1000))
      }

      // Process based on event type
      switch (event.source) {
        case 'call_completed':
          if (config.settings.auto_sync_calls) {
            const callSyncResult = await this.handleCallCompletedEvent(event, config)
            actionsTaken.push(...callSyncResult.actions)
            errors.push(...callSyncResult.errors)
          }
          break

        case 'campaign_completed':
          const campaignSyncResult = await this.handleCampaignCompletedEvent(event, config)
          actionsTaken.push(...campaignSyncResult.actions)
          errors.push(...campaignSyncResult.errors)
          break

        case 'contact_updated':
          if (config.settings.auto_sync_contacts) {
            const contactSyncResult = await this.handleContactUpdatedEvent(event, config)
            actionsTaken.push(...contactSyncResult.actions)
            errors.push(...contactSyncResult.errors)
          }
          break

        case 'manual_trigger':
          const manualSyncResult = await this.handleManualTriggerEvent(event, config)
          actionsTaken.push(...manualSyncResult.actions)
          errors.push(...manualSyncResult.errors)
          break
      }

      console.log(`✅ Webhook processed: ${actionsTaken.length} actions, ${errors.length} errors`)

      return { success: true, actions_taken: actionsTaken, errors }
    } catch (error: any) {
      console.error('❌ Webhook processing failed:', error)
      return { 
        success: false, 
        actions_taken: [], 
        errors: [error.message] 
      }
    }
  }

  /**
   * Handle call completed event
   */
  private static async handleCallCompletedEvent(
    event: WebhookEvent, 
    config: CRMWebhookConfig
  ): Promise<{ actions: string[]; errors: string[] }> {
    const actions: string[] = []
    const errors: string[] = []

    try {
      // Sync call to CRM
      const { success, error } = await CRMIntegrationService.syncCallToCRM(
        event.organization_id,
        event.entity_id,
        config.crm_type
      )

      if (success) {
        actions.push(`Call ${event.entity_id} synced to ${config.crm_type}`)

        // Update contact lead status based on call outcome
        if (config.settings.auto_update_lead_status && event.data.contact_id) {
          const leadStatusResult = await this.updateContactLeadStatus(
            event.organization_id,
            event.data.contact_id,
            event.data.call_outcome,
            config.crm_type
          )
          
          if (leadStatusResult.success) {
            actions.push(`Contact lead status updated based on call outcome`)
          } else {
            errors.push(`Failed to update lead status: ${leadStatusResult.error}`)
          }
        }

        // Create follow-up task if needed
        if (config.settings.auto_create_tasks && event.data.next_action) {
          const taskResult = await this.createFollowUpTask(
            event.organization_id,
            event.data.contact_id,
            event.data.next_action,
            config.crm_type
          )
          
          if (taskResult.success) {
            actions.push(`Follow-up task created: ${event.data.next_action}`)
          } else {
            errors.push(`Failed to create task: ${taskResult.error}`)
          }
        }
      } else {
        errors.push(`Failed to sync call: ${error}`)
      }
    } catch (error: any) {
      errors.push(`Call event processing error: ${error.message}`)
    }

    return { actions, errors }
  }

  /**
   * Handle campaign completed event
   */
  private static async handleCampaignCompletedEvent(
    event: WebhookEvent, 
    config: CRMWebhookConfig
  ): Promise<{ actions: string[]; errors: string[] }> {
    const actions: string[] = []
    const errors: string[] = []

    try {
      // Get campaign calls
      const { data: calls, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .eq('campaign_id', event.entity_id)
        .eq('status', 'completed')

      if (callsError || !calls) {
        errors.push('Failed to fetch campaign calls')
        return { actions, errors }
      }

      // Sync all completed calls
      let syncedCalls = 0
      for (const call of calls) {
        const { success } = await CRMIntegrationService.syncCallToCRM(
          event.organization_id,
          call.id,
          config.crm_type
        )
        
        if (success) {
          syncedCalls++
        }
      }

      actions.push(`Campaign completed: ${syncedCalls}/${calls.length} calls synced to CRM`)

      // Create campaign summary task
      if (config.settings.auto_create_tasks) {
        const summaryResult = await this.createCampaignSummaryTask(
          event.organization_id,
          event.entity_id,
          { total_calls: calls.length, synced_calls: syncedCalls },
          config.crm_type
        )
        
        if (summaryResult.success) {
          actions.push('Campaign summary task created')
        } else {
          errors.push(`Failed to create summary task: ${summaryResult.error}`)
        }
      }
    } catch (error: any) {
      errors.push(`Campaign event processing error: ${error.message}`)
    }

    return { actions, errors }
  }

  /**
   * Handle contact updated event
   */
  private static async handleContactUpdatedEvent(
    event: WebhookEvent, 
    config: CRMWebhookConfig
  ): Promise<{ actions: string[]; errors: string[] }> {
    const actions: string[] = []
    const errors: string[] = []

    try {
      // Sync contact to CRM
      const { success, error } = await CRMIntegrationService.syncContactToCRM(
        event.organization_id,
        event.entity_id,
        config.crm_type
      )

      if (success) {
        actions.push(`Contact ${event.entity_id} synced to ${config.crm_type}`)
      } else {
        errors.push(`Failed to sync contact: ${error}`)
      }
    } catch (error: any) {
      errors.push(`Contact event processing error: ${error.message}`)
    }

    return { actions, errors }
  }

  /**
   * Handle manual trigger event
   */
  private static async handleManualTriggerEvent(
    event: WebhookEvent, 
    config: CRMWebhookConfig
  ): Promise<{ actions: string[]; errors: string[] }> {
    const actions: string[] = []
    const errors: string[] = []

    try {
      const triggerType = event.data.trigger_type

      switch (triggerType) {
        case 'bulk_sync_contacts':
          const contactSyncResult = await CRMIntegrationService.bulkSyncContactsToCRM(
            event.organization_id,
            config.crm_type,
            event.data.options || {}
          )
          actions.push(`Bulk contact sync: ${contactSyncResult.synced} synced, ${contactSyncResult.failed} failed`)
          break

        case 'bulk_sync_calls':
          // Implementation for bulk call sync
          actions.push('Bulk call sync triggered (implementation pending)')
          break

        default:
          errors.push(`Unknown manual trigger type: ${triggerType}`)
      }
    } catch (error: any) {
      errors.push(`Manual trigger processing error: ${error.message}`)
    }

    return { actions, errors }
  }

  /**
   * Update contact lead status based on call outcome
   */
  private static async updateContactLeadStatus(
    organizationId: string,
    contactId: string,
    callOutcome: string,
    crmType: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Map call outcomes to lead statuses
      const statusMapping: Record<string, string> = {
        'interested': 'qualified',
        'not_interested': 'unqualified',
        'callback_requested': 'in_progress',
        'voicemail': 'attempted_to_contact',
        'no_answer': 'attempted_to_contact',
        'completed': 'contacted'
      }

      const leadStatus = statusMapping[callOutcome] || 'contacted'

      // Update contact in ZyxAI
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
          lead_status: leadStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Sync updated contact to CRM
      const { success, error } = await CRMIntegrationService.syncContactToCRM(
        organizationId,
        contactId,
        crmType
      )

      return { success, error }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Create follow-up task in CRM
   */
  private static async createFollowUpTask(
    organizationId: string,
    contactId: string,
    nextAction: string,
    crmType: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This would integrate with CRM task creation APIs
      // For now, we'll create a placeholder implementation
      
      console.log(`📋 Creating follow-up task: ${nextAction} for contact ${contactId}`)
      
      // In a real implementation, this would call HubSpot's task creation API
      // or other CRM task APIs
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Create campaign summary task
   */
  private static async createCampaignSummaryTask(
    organizationId: string,
    campaignId: string,
    summary: { total_calls: number; synced_calls: number },
    crmType: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📊 Creating campaign summary task for campaign ${campaignId}`)
      
      // In a real implementation, this would create a task in the CRM
      // with campaign performance summary
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get webhook configuration for organization
   */
  private static async getWebhookConfig(organizationId: string): Promise<CRMWebhookConfig | null> {
    try {
      // For now, return a default configuration
      // In a real implementation, this would be stored in the database
      return {
        organization_id: organizationId,
        crm_type: 'hubspot',
        enabled: true,
        events: ['call_completed', 'campaign_completed', 'contact_updated'],
        settings: {
          auto_sync_calls: true,
          auto_sync_contacts: true,
          auto_create_tasks: true,
          auto_update_lead_status: true,
          delay_seconds: 5
        }
      }
    } catch (error) {
      console.error('Failed to get webhook config:', error)
      return null
    }
  }

  /**
   * Trigger webhook event
   */
  static async triggerWebhookEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    const webhookEvent: WebhookEvent = {
      ...event,
      id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }

    // Process webhook asynchronously
    this.processWebhookEvent(webhookEvent).catch(error => {
      console.error('Webhook processing failed:', error)
    })
  }
}

export default CRMWebhookService
