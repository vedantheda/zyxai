import { supabase } from '@/lib/supabase'
import { CRMIntegrationService } from './CRMIntegrationService'
import { FieldMappingService } from './FieldMappingService'

export interface WebhookEvent {
  id: string
  organization_id: string
  crm_type: string
  event_type: string
  event_data: any
  processed: boolean
  processed_at?: string
  error_message?: string
  retry_count: number
  created_at: string
}

export interface WebhookSubscription {
  id: string
  organization_id: string
  crm_type: string
  webhook_url: string
  events: string[]
  is_active: boolean
  secret_key: string
  created_at: string
  updated_at: string
}

export class WebhookService {
  // ===== WEBHOOK SUBSCRIPTIONS =====

  /**
   * Create webhook subscription
   */
  static async createWebhookSubscription(
    organizationId: string,
    crmType: string,
    events: string[]
  ): Promise<{ subscription: WebhookSubscription | null; error: string | null }> {
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${crmType}`
      const secretKey = this.generateSecretKey()

      const { data: subscription, error } = await supabase
        .from('webhook_subscriptions')
        .insert({
          organization_id: organizationId,
          crm_type: crmType,
          webhook_url: webhookUrl,
          events,
          secret_key: secretKey,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        return { subscription: null, error: error.message }
      }

      return { subscription, error: null }
    } catch (error) {
      return { subscription: null, error: 'Failed to create webhook subscription' }
    }
  }

  /**
   * Get webhook subscriptions for organization
   */
  static async getWebhookSubscriptions(
    organizationId: string
  ): Promise<{ subscriptions: WebhookSubscription[]; error: string | null }> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        return { subscriptions: [], error: error.message }
      }

      return { subscriptions: subscriptions || [], error: null }
    } catch (error) {
      return { subscriptions: [], error: 'Failed to fetch webhook subscriptions' }
    }
  }

  /**
   * Update webhook subscription
   */
  static async updateWebhookSubscription(
    subscriptionId: string,
    updates: Partial<WebhookSubscription>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to update webhook subscription' }
    }
  }

  // ===== WEBHOOK EVENTS =====

  /**
   * Process incoming webhook event
   */
  static async processWebhookEvent(
    crmType: string,
    eventType: string,
    eventData: any,
    signature?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Verify webhook signature (implementation depends on CRM)
      if (!this.verifyWebhookSignature(crmType, eventData, signature)) {
        return { success: false, error: 'Invalid webhook signature' }
      }

      // Determine organization from event data
      const organizationId = await this.getOrganizationFromEvent(crmType, eventData)
      if (!organizationId) {
        return { success: false, error: 'Could not determine organization' }
      }

      // Store webhook event
      const { data: webhookEvent, error: storeError } = await supabase
        .from('webhook_events')
        .insert({
          organization_id: organizationId,
          crm_type: crmType,
          event_type: eventType,
          event_data: eventData,
          processed: false,
          retry_count: 0
        })
        .select()
        .single()

      if (storeError) {
        return { success: false, error: storeError.message }
      }

      // Process event asynchronously
      this.processEventAsync(webhookEvent.id)

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to process webhook event' }
    }
  }

  /**
   * Process webhook event asynchronously
   */
  private static async processEventAsync(eventId: string) {
    try {
      const { data: event, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error || !event) {
        return
      }

      let success = false
      let errorMessage = ''

      try {
        if (event.crm_type === 'hubspot') {
          success = await this.processHubSpotEvent(event)
        }
        // Add other CRM types here
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : 'Unknown error'
      }

      // Update event status
      await supabase
        .from('webhook_events')
        .update({
          processed: success,
          processed_at: success ? new Date().toISOString() : undefined,
          error_message: success ? null : errorMessage,
          retry_count: event.retry_count + 1
        })
        .eq('id', eventId)

    } catch (error) {
      console.error('Error processing webhook event:', error)
    }
  }

  /**
   * Process HubSpot webhook event
   */
  private static async processHubSpotEvent(event: WebhookEvent): Promise<boolean> {
    try {
      const { event_type, event_data, organization_id } = event

      // Get field mappings for this organization
      const { mappings } = await FieldMappingService.getFieldMappings(
        organization_id,
        'hubspot'
      )

      switch (event_type) {
        case 'contact.creation':
        case 'contact.propertyChange':
          return await this.syncHubSpotContactToZyxAI(
            organization_id,
            event_data,
            mappings.filter(m => m.entity_type === 'contact')
          )

        case 'contact.deletion':
          return await this.handleHubSpotContactDeletion(
            organization_id,
            event_data
          )

        case 'deal.creation':
        case 'deal.propertyChange':
          return await this.syncHubSpotDealToZyxAI(
            organization_id,
            event_data,
            mappings.filter(m => m.entity_type === 'deal')
          )

        default:
          console.log(`Unhandled HubSpot event type: ${event_type}`)
          return true // Mark as processed to avoid retries
      }
    } catch (error) {
      console.error('Error processing HubSpot event:', error)
      return false
    }
  }

  /**
   * Sync HubSpot contact to ZyxAI
   */
  private static async syncHubSpotContactToZyxAI(
    organizationId: string,
    eventData: any,
    mappings: any[]
  ): Promise<boolean> {
    try {
      const hubspotContactId = eventData.objectId || eventData.vid
      const hubspotProperties = eventData.properties || {}

      // Transform HubSpot data to ZyxAI format
      const zyxaiData = FieldMappingService.transformData(
        hubspotProperties,
        mappings,
        'from_crm'
      )

      // Check if contact already exists in ZyxAI
      const { data: existingMapping } = await supabase
        .from('contact_sync_mappings')
        .select('zyxai_contact_id')
        .eq('organization_id', organizationId)
        .eq('crm_type', 'hubspot')
        .eq('crm_contact_id', hubspotContactId)
        .single()

      if (existingMapping) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            ...zyxaiData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMapping.zyxai_contact_id)

        return !error
      } else {
        // Create new contact
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({
            organization_id: organizationId,
            ...zyxaiData
          })
          .select()
          .single()

        if (error || !newContact) {
          return false
        }

        // Create sync mapping
        await CRMIntegrationService.createContactSyncMapping(
          organizationId,
          newContact.id,
          'hubspot',
          hubspotContactId,
          'bidirectional'
        )

        return true
      }
    } catch (error) {
      console.error('Error syncing HubSpot contact to ZyxAI:', error)
      return false
    }
  }

  /**
   * Handle HubSpot contact deletion
   */
  private static async handleHubSpotContactDeletion(
    organizationId: string,
    eventData: any
  ): Promise<boolean> {
    try {
      const hubspotContactId = eventData.objectId || eventData.vid

      // Find corresponding ZyxAI contact
      const { data: mapping } = await supabase
        .from('contact_sync_mappings')
        .select('zyxai_contact_id')
        .eq('organization_id', organizationId)
        .eq('crm_type', 'hubspot')
        .eq('crm_contact_id', hubspotContactId)
        .single()

      if (mapping) {
        // Mark contact as inactive instead of deleting
        await supabase
          .from('contacts')
          .update({
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', mapping.zyxai_contact_id)

        // Remove sync mapping
        await supabase
          .from('contact_sync_mappings')
          .delete()
          .eq('zyxai_contact_id', mapping.zyxai_contact_id)
          .eq('crm_type', 'hubspot')
      }

      return true
    } catch (error) {
      console.error('Error handling HubSpot contact deletion:', error)
      return false
    }
  }

  /**
   * Sync HubSpot deal to ZyxAI
   */
  private static async syncHubSpotDealToZyxAI(
    organizationId: string,
    eventData: any,
    mappings: any[]
  ): Promise<boolean> {
    try {
      // Implementation for deal sync
      // This would create/update deals in ZyxAI based on HubSpot data
      console.log('Deal sync not implemented yet')
      return true
    } catch (error) {
      console.error('Error syncing HubSpot deal to ZyxAI:', error)
      return false
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Generate secret key for webhook verification
   */
  private static generateSecretKey(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Verify webhook signature
   */
  private static verifyWebhookSignature(
    crmType: string,
    eventData: any,
    signature?: string
  ): boolean {
    // Implementation depends on CRM webhook signature verification
    // For now, return true (implement proper verification in production)
    return true
  }

  /**
   * Get organization ID from webhook event data
   */
  private static async getOrganizationFromEvent(
    crmType: string,
    eventData: any
  ): Promise<string | null> {
    try {
      if (crmType === 'hubspot') {
        const portalId = eventData.portalId || eventData.hubId

        if (portalId) {
          const { data: integration } = await supabase
            .from('crm_integrations')
            .select('organization_id')
            .eq('crm_type', 'hubspot')
            .eq('hub_id', portalId.toString())
            .single()

          return integration?.organization_id || null
        }
      }

      return null
    } catch (error) {
      console.error('Error getting organization from event:', error)
      return null
    }
  }

  /**
   * Retry failed webhook events
   */
  static async retryFailedEvents(maxRetries = 3): Promise<void> {
    try {
      const { data: failedEvents } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('processed', false)
        .lt('retry_count', maxRetries)
        .order('created_at', { ascending: true })
        .limit(50)

      if (failedEvents) {
        for (const event of failedEvents) {
          await this.processEventAsync(event.id)
          // Small delay between retries
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } catch (error) {
      console.error('Error retrying failed webhook events:', error)
    }
  }
}

export default WebhookService
