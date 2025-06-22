import { supabase } from '@/lib/supabase'
import { HubSpotService } from './HubSpotService'

export interface CRMIntegration {
  id: string
  organization_id: string
  crm_type: 'hubspot' | 'salesforce' | 'pipedrive'
  access_token: string
  refresh_token?: string
  hub_id?: string
  hub_domain?: string
  instance_url?: string
  expires_at?: string
  scopes: string[]
  is_active: boolean
  last_sync?: string
  sync_settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ContactSyncMapping {
  id: string
  organization_id: string
  zyxai_contact_id: string
  crm_type: string
  crm_contact_id: string
  last_synced: string
  sync_status: 'synced' | 'pending' | 'error'
  sync_direction: 'to_crm' | 'from_crm' | 'bidirectional'
  error_message?: string
  created_at: string
  updated_at: string
}

export interface CallSyncMapping {
  id: string
  organization_id: string
  zyxai_call_id: string
  crm_type: string
  crm_activity_id: string
  last_synced: string
  sync_status: 'synced' | 'pending' | 'error'
  error_message?: string
  created_at: string
  updated_at: string
}

export class CRMIntegrationService {
  // ===== CRM INTEGRATIONS =====

  /**
   * Get all CRM integrations for an organization
   */
  static async getIntegrations(organizationId: string): Promise<{
    integrations: CRMIntegration[]
    error: string | null
  }> {
    try {
      const { data: integrations, error } = await supabase
        .from('crm_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        return { integrations: [], error: error.message }
      }

      return { integrations: integrations || [], error: null }
    } catch (error) {
      return { integrations: [], error: 'Failed to fetch CRM integrations' }
    }
  }

  /**
   * Get specific CRM integration
   */
  static async getIntegration(
    organizationId: string,
    crmType: string
  ): Promise<{ integration: CRMIntegration | null; error: string | null }> {
    try {
      const { data: integration, error } = await supabase
        .from('crm_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('crm_type', crmType)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        return { integration: null, error: error.message }
      }

      return { integration: integration || null, error: null }
    } catch (error) {
      return { integration: null, error: 'Failed to fetch CRM integration' }
    }
  }

  /**
   * Create or update CRM integration
   */
  static async upsertIntegration(
    organizationId: string,
    crmType: string,
    integrationData: Partial<CRMIntegration>
  ): Promise<{ integration: CRMIntegration | null; error: string | null }> {
    try {
      const { data: integration, error } = await supabase
        .from('crm_integrations')
        .upsert({
          organization_id: organizationId,
          crm_type: crmType,
          ...integrationData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id,crm_type'
        })
        .select()
        .single()

      if (error) {
        return { integration: null, error: error.message }
      }

      return { integration, error: null }
    } catch (error) {
      return { integration: null, error: 'Failed to save CRM integration' }
    }
  }

  /**
   * Delete CRM integration
   */
  static async deleteIntegration(
    organizationId: string,
    crmType: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('crm_integrations')
        .delete()
        .eq('organization_id', organizationId)
        .eq('crm_type', crmType)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to delete CRM integration' }
    }
  }

  // ===== HUBSPOT SPECIFIC =====

  /**
   * Initialize HubSpot integration
   */
  static async initializeHubSpotIntegration(
    organizationId: string,
    authCode: string
  ): Promise<{ integration: CRMIntegration | null; error: string | null }> {
    try {
      // Exchange code for tokens
      const tokenData = await HubSpotService.exchangeCodeForToken(authCode)

      // Test the connection
      const connectionTest = await HubSpotService.testConnection(tokenData.accessToken)
      if (!connectionTest.success) {
        return { integration: null, error: connectionTest.error || 'Failed to connect to HubSpot' }
      }

      // Save integration
      const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000).toISOString()

      const { integration, error } = await this.upsertIntegration(organizationId, 'hubspot', {
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        hub_id: tokenData.hubId,
        hub_domain: tokenData.hubDomain,
        expires_at: expiresAt,
        scopes: ['contacts', 'content', 'reports'], // Default scopes
        is_active: true,
        sync_settings: {
          auto_sync_contacts: true,
          auto_sync_calls: true,
          sync_frequency: 'real_time'
        }
      })

      return { integration, error }
    } catch (error) {
      return { integration: null, error: 'Failed to initialize HubSpot integration' }
    }
  }

  /**
   * Refresh HubSpot access token
   */
  static async refreshHubSpotToken(
    organizationId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { integration, error: getError } = await this.getIntegration(organizationId, 'hubspot')
      if (getError || !integration) {
        return { success: false, error: 'HubSpot integration not found' }
      }

      if (!integration.refresh_token) {
        return { success: false, error: 'No refresh token available' }
      }

      // Refresh the token
      const tokenData = await HubSpotService.refreshAccessToken(integration.refresh_token)

      // Update integration
      const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000).toISOString()

      const { error: updateError } = await this.upsertIntegration(organizationId, 'hubspot', {
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })

      if (updateError) {
        return { success: false, error: updateError }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to refresh HubSpot token' }
    }
  }

  // ===== BULK SYNC OPERATIONS =====

  /**
   * Bulk sync contacts from CRM to ZyxAI
   */
  static async bulkSyncContactsFromCRM(
    organizationId: string,
    crmType: string = 'hubspot',
    options: {
      limit?: number
      lastSyncDate?: string
      contactListId?: string
    } = {}
  ): Promise<{
    synced: number
    failed: number
    errors: string[]
    jobId: string
  }> {
    try {
      console.log(`🔄 Starting bulk contact sync from ${crmType} for org ${organizationId}`)

      // Get CRM integration
      const { integration, error: integrationError } = await this.getIntegration(organizationId, crmType)
      if (integrationError || !integration) {
        throw new Error('CRM integration not found')
      }

      // Create bulk sync job
      const jobId = `bulk-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      let synced = 0
      let failed = 0
      const errors: string[] = []

      if (crmType === 'hubspot') {
        // Get contacts from HubSpot
        const hubspotContacts = await HubSpotService.getAllContacts(
          integration.access_token,
          {
            limit: options.limit || 1000,
            lastModifiedDate: options.lastSyncDate
          }
        )

        console.log(`📥 Retrieved ${hubspotContacts.length} contacts from HubSpot`)

        // Process contacts in batches
        const batchSize = 50
        for (let i = 0; i < hubspotContacts.length; i += batchSize) {
          const batch = hubspotContacts.slice(i, i + batchSize)

          for (const hubspotContact of batch) {
            try {
              // Check if contact already exists
              const existingMapping = await this.getContactSyncMapping(
                organizationId,
                'hubspot',
                hubspotContact.id
              )

              const contactData = {
                organization_id: organizationId,
                list_id: options.contactListId,
                first_name: hubspotContact.properties.firstname || '',
                last_name: hubspotContact.properties.lastname || '',
                email: hubspotContact.properties.email || '',
                phone: hubspotContact.properties.phone || '',
                company: hubspotContact.properties.company || '',
                job_title: hubspotContact.properties.jobtitle || '',
                status: 'active',
                source: 'hubspot_sync',
                metadata: {
                  hubspot_id: hubspotContact.id,
                  hubspot_created_at: hubspotContact.createdAt,
                  hubspot_updated_at: hubspotContact.updatedAt,
                  sync_job_id: jobId
                }
              }

              if (existingMapping) {
                // Update existing contact
                const { error } = await supabase
                  .from('contacts')
                  .update({
                    ...contactData,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingMapping.zyxai_contact_id)

                if (error) {
                  failed++
                  errors.push(`Failed to update contact ${hubspotContact.id}: ${error.message}`)
                } else {
                  synced++
                }
              } else {
                // Create new contact
                const { data: newContact, error } = await supabase
                  .from('contacts')
                  .insert(contactData)
                  .select()
                  .single()

                if (error || !newContact) {
                  failed++
                  errors.push(`Failed to create contact ${hubspotContact.id}: ${error?.message}`)
                } else {
                  // Create sync mapping
                  await this.createContactSyncMapping(
                    organizationId,
                    newContact.id,
                    'hubspot',
                    hubspotContact.id,
                    'bidirectional'
                  )
                  synced++
                }
              }
            } catch (error: any) {
              failed++
              errors.push(`Error processing contact ${hubspotContact.id}: ${error.message}`)
            }
          }

          // Brief pause between batches
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Update integration last sync time
      await this.upsertIntegration(organizationId, crmType, {
        last_sync: new Date().toISOString()
      })

      console.log(`✅ Bulk sync completed: ${synced} synced, ${failed} failed`)

      return { synced, failed, errors, jobId }
    } catch (error: any) {
      console.error('❌ Bulk sync failed:', error)
      return {
        synced: 0,
        failed: 0,
        errors: [error.message],
        jobId: 'failed'
      }
    }
  }

  /**
   * Bulk sync contacts from ZyxAI to CRM
   */
  static async bulkSyncContactsToCRM(
    organizationId: string,
    crmType: string = 'hubspot',
    options: {
      contactListId?: string
      lastSyncDate?: string
      limit?: number
    } = {}
  ): Promise<{
    synced: number
    failed: number
    errors: string[]
    jobId: string
  }> {
    try {
      console.log(`🔄 Starting bulk contact sync to ${crmType} for org ${organizationId}`)

      // Get CRM integration
      const { integration, error: integrationError } = await this.getIntegration(organizationId, crmType)
      if (integrationError || !integration) {
        throw new Error('CRM integration not found')
      }

      // Create bulk sync job
      const jobId = `bulk-sync-to-crm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      let synced = 0
      let failed = 0
      const errors: string[] = []

      // Get ZyxAI contacts
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      if (options.contactListId) {
        query = query.eq('list_id', options.contactListId)
      }

      if (options.lastSyncDate) {
        query = query.gte('updated_at', options.lastSyncDate)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data: contacts, error: contactsError } = await query

      if (contactsError || !contacts) {
        throw new Error('Failed to fetch contacts')
      }

      console.log(`📤 Syncing ${contacts.length} contacts to ${crmType}`)

      // Process contacts in batches
      const batchSize = 25 // Smaller batches for API rate limits
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize)

        for (const contact of batch) {
          try {
            const { success, error } = await this.syncContactToCRM(
              organizationId,
              contact.id,
              crmType
            )

            if (success) {
              synced++
            } else {
              failed++
              errors.push(`Failed to sync contact ${contact.id}: ${error}`)
            }
          } catch (error: any) {
            failed++
            errors.push(`Error syncing contact ${contact.id}: ${error.message}`)
          }
        }

        // Pause between batches to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log(`✅ Bulk sync to CRM completed: ${synced} synced, ${failed} failed`)

      return { synced, failed, errors, jobId }
    } catch (error: any) {
      console.error('❌ Bulk sync to CRM failed:', error)
      return {
        synced: 0,
        failed: 0,
        errors: [error.message],
        jobId: 'failed'
      }
    }
  }

  // ===== CONTACT SYNC =====

  /**
   * Create contact sync mapping
   */
  static async createContactSyncMapping(
    organizationId: string,
    zyxaiContactId: string,
    crmType: string,
    crmContactId: string,
    syncDirection: 'to_crm' | 'from_crm' | 'bidirectional' = 'bidirectional'
  ): Promise<{ mapping: ContactSyncMapping | null; error: string | null }> {
    try {
      const { data: mapping, error } = await supabase
        .from('contact_sync_mappings')
        .upsert({
          organization_id: organizationId,
          zyxai_contact_id: zyxaiContactId,
          crm_type: crmType,
          crm_contact_id: crmContactId,
          sync_direction: syncDirection,
          sync_status: 'synced',
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'zyxai_contact_id,crm_type'
        })
        .select()
        .single()

      if (error) {
        return { mapping: null, error: error.message }
      }

      return { mapping, error: null }
    } catch (error) {
      return { mapping: null, error: 'Failed to create contact sync mapping' }
    }
  }

  /**
   * Get contact sync mapping
   */
  static async getContactSyncMapping(
    zyxaiContactId: string,
    crmType: string
  ): Promise<{ mapping: ContactSyncMapping | null; error: string | null }> {
    try {
      const { data: mapping, error } = await supabase
        .from('contact_sync_mappings')
        .select('*')
        .eq('zyxai_contact_id', zyxaiContactId)
        .eq('crm_type', crmType)
        .single()

      if (error && error.code !== 'PGRST116') {
        return { mapping: null, error: error.message }
      }

      return { mapping: mapping || null, error: null }
    } catch (error) {
      return { mapping: null, error: 'Failed to fetch contact sync mapping' }
    }
  }

  // ===== CALL SYNC =====

  /**
   * Create call sync mapping
   */
  static async createCallSyncMapping(
    organizationId: string,
    zyxaiCallId: string,
    crmType: string,
    crmActivityId: string
  ): Promise<{ mapping: CallSyncMapping | null; error: string | null }> {
    try {
      const { data: mapping, error } = await supabase
        .from('call_sync_mappings')
        .insert({
          organization_id: organizationId,
          zyxai_call_id: zyxaiCallId,
          crm_type: crmType,
          crm_activity_id: crmActivityId,
          sync_status: 'synced',
          last_synced: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        return { mapping: null, error: error.message }
      }

      return { mapping, error: null }
    } catch (error) {
      return { mapping: null, error: 'Failed to create call sync mapping' }
    }
  }

  // ===== SYNC OPERATIONS =====

  /**
   * Sync contact to CRM
   */
  static async syncContactToCRM(
    organizationId: string,
    contactId: string,
    crmType: string = 'hubspot'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get CRM integration
      const { integration, error: integrationError } = await this.getIntegration(organizationId, crmType)
      if (integrationError || !integration) {
        return { success: false, error: 'CRM integration not found' }
      }

      // Get ZyxAI contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single()

      if (contactError || !contact) {
        return { success: false, error: 'Contact not found' }
      }

      if (crmType === 'hubspot') {
        // Check if contact already exists in HubSpot
        let hubspotContact = null
        if (contact.email) {
          hubspotContact = await HubSpotService.searchContactByEmail(integration.access_token, contact.email)
        }

        // Prepare contact data for HubSpot
        const hubspotData = {
          firstname: contact.first_name,
          lastname: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          jobtitle: contact.job_title,
          zyxai_contact_id: contact.id
        }

        // Create or update in HubSpot
        const updatedContact = await HubSpotService.upsertContact(
          integration.access_token,
          hubspotData,
          hubspotContact?.id
        )

        // Create sync mapping
        await this.createContactSyncMapping(
          organizationId,
          contactId,
          crmType,
          updatedContact.id,
          'bidirectional'
        )

        return { success: true, error: null }
      }

      return { success: false, error: 'Unsupported CRM type' }
    } catch (error) {
      return { success: false, error: 'Failed to sync contact to CRM' }
    }
  }

  /**
   * Sync call to CRM
   */
  static async syncCallToCRM(
    organizationId: string,
    callId: string,
    crmType: string = 'hubspot'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get CRM integration
      const { integration, error: integrationError } = await this.getIntegration(organizationId, crmType)
      if (integrationError || !integration) {
        return { success: false, error: 'CRM integration not found' }
      }

      // Get call details
      const { data: call, error: callError } = await supabase
        .from('calls')
        .select(`
          *,
          agent:ai_agents(name),
          contact:contacts(*)
        `)
        .eq('id', callId)
        .single()

      if (callError || !call) {
        return { success: false, error: 'Call not found' }
      }

      if (crmType === 'hubspot') {
        // Find HubSpot contact ID
        let hubspotContactId = null
        if (call.contact) {
          const { mapping } = await this.getContactSyncMapping(call.contact.id, 'hubspot')
          hubspotContactId = mapping?.crm_contact_id
        }

        // Prepare activity data
        const activityData = {
          properties: {
            hs_activity_type: 'CALL',
            hs_timestamp: new Date(call.started_at || call.created_at).getTime().toString(),
            hs_call_title: `Call with ${call.customer_name || 'Unknown'}`,
            hs_call_body: call.summary || call.transcript || 'Voice call via ZyxAI',
            hs_call_duration: call.duration?.toString(),
            hs_call_status: call.status === 'completed' ? 'COMPLETED' : 'NO_ANSWER',
            hs_call_direction: call.direction === 'outbound' ? 'OUTBOUND' : 'INBOUND',
            hs_call_recording_url: call.recording_url,
            zyxai_call_id: call.id,
            zyxai_agent_name: call.agent?.name
          },
          associations: hubspotContactId ? {
            contacts: [hubspotContactId]
          } : undefined
        }

        // Log activity in HubSpot
        const hubspotActivity = await HubSpotService.logCallActivity(
          integration.access_token,
          activityData
        )

        // Create sync mapping
        await this.createCallSyncMapping(
          organizationId,
          callId,
          crmType,
          hubspotActivity.id!
        )

        return { success: true, error: null }
      }

      return { success: false, error: 'Unsupported CRM type' }
    } catch (error) {
      return { success: false, error: 'Failed to sync call to CRM' }
    }
  }
}

export default CRMIntegrationService
