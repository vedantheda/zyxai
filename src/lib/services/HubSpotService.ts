import { Client } from '@hubspot/api-client'

// HubSpot API client initialization
const getHubSpotClient = (accessToken?: string) => {
  if (accessToken) {
    return new Client({ accessToken })
  }

  // For development/testing with developer API key
  const developerApiKey = process.env.HUBSPOT_DEVELOPER_API_KEY
  if (developerApiKey) {
    return new Client({ apiKey: developerApiKey })
  }

  throw new Error('HubSpot API credentials not configured')
}

export interface HubSpotContact {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    phone?: string
    company?: string
    jobtitle?: string
    lifecyclestage?: string
    lead_status?: string
    hs_lead_status?: string
    createdate?: string
    lastmodifieddate?: string
    // Custom properties for ZyxAI
    zyxai_contact_id?: string
    zyxai_last_call_date?: string
    zyxai_call_count?: string
    zyxai_lead_score?: string
  }
}

export interface HubSpotDeal {
  id: string
  properties: {
    dealname?: string
    amount?: string
    dealstage?: string
    pipeline?: string
    closedate?: string
    createdate?: string
    // Custom properties for ZyxAI
    zyxai_source?: string
    zyxai_call_outcome?: string
  }
}

export interface HubSpotActivity {
  id?: string
  properties: {
    hs_activity_type: string
    hs_timestamp: string
    hs_call_title?: string
    hs_call_body?: string
    hs_call_duration?: string
    hs_call_status?: string
    hs_call_direction?: string
    hs_call_recording_url?: string
    // Custom properties
    zyxai_call_id?: string
    zyxai_agent_name?: string
    zyxai_transcript?: string
  }
  associations?: {
    contacts?: string[]
    deals?: string[]
  }
}

export interface HubSpotIntegration {
  id: string
  organization_id: string
  access_token: string
  refresh_token: string
  hub_id: string
  hub_domain: string
  expires_at: string
  scopes: string[]
  is_active: boolean
  last_sync: string
  created_at: string
}

export class HubSpotService {
  // ===== AUTHENTICATION =====

  /**
   * Get OAuth authorization URL
   */
  static getAuthUrl(organizationId: string): string {
    const clientId = process.env.HUBSPOT_CLIENT_ID
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI
    const scopes = [
      'contacts',
      'content',
      'reports',
      'social',
      'automation',
      'timeline',
      'business-intelligence',
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write'
    ].join(' ')

    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri!,
      scope: scopes,
      state: organizationId // Pass organization ID as state
    })

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    hubId: string
    hubDomain: string
  }> {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
        code
      })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      hubId: data.hub_id,
      hubDomain: data.hub_domain
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh access token')
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    }
  }

  // ===== CONTACTS =====

  /**
   * Get all contacts with pagination support
   */
  static async getAllContacts(
    accessToken: string,
    options: {
      limit?: number
      lastModifiedDate?: string
      properties?: string[]
    } = {}
  ): Promise<HubSpotContact[]> {
    try {
      const hubspotClient = getHubSpotClient(accessToken)
      const allContacts: HubSpotContact[] = []

      const properties = options.properties || [
        'firstname',
        'lastname',
        'email',
        'phone',
        'company',
        'jobtitle',
        'createdate',
        'lastmodifieddate',
        'hs_lead_status',
        'lifecyclestage'
      ]

      let after: string | undefined
      const limit = Math.min(options.limit || 1000, 100) // HubSpot max is 100 per request

      do {
        const searchRequest = {
          properties,
          limit,
          after,
          ...(options.lastModifiedDate && {
            filterGroups: [{
              filters: [{
                propertyName: 'lastmodifieddate',
                operator: 'GTE',
                value: new Date(options.lastModifiedDate).getTime().toString()
              }]
            }]
          })
        }

        const response = await hubspotClient.crm.contacts.searchApi.doSearch(searchRequest)

        if (response.results) {
          allContacts.push(...response.results.map(contact => ({
            id: contact.id!,
            properties: contact.properties || {},
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt
          })))
        }

        after = response.paging?.next?.after

        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } while (after && allContacts.length < (options.limit || 1000))

      console.log(`📥 Retrieved ${allContacts.length} contacts from HubSpot`)
      return allContacts
    } catch (error) {
      console.error('Error fetching all contacts from HubSpot:', error)
      throw error
    }
  }

  /**
   * Bulk create or update contacts
   */
  static async bulkUpsertContacts(
    accessToken: string,
    contacts: Array<{
      id?: string
      properties: Record<string, string>
    }>
  ): Promise<{
    created: number
    updated: number
    failed: number
    errors: string[]
  }> {
    try {
      const hubspotClient = getHubSpotClient(accessToken)
      let created = 0
      let updated = 0
      let failed = 0
      const errors: string[] = []

      // Process in batches of 10 (HubSpot batch limit)
      const batchSize = 10
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize)

        try {
          const batchInputs = batch.map(contact => ({
            id: contact.id,
            properties: contact.properties
          }))

          if (batch.every(c => c.id)) {
            // Update existing contacts
            const response = await hubspotClient.crm.contacts.batchApi.update({
              inputs: batchInputs
            })
            updated += response.results?.length || 0
          } else {
            // Create new contacts
            const response = await hubspotClient.crm.contacts.batchApi.create({
              inputs: batchInputs.map(input => ({ properties: input.properties }))
            })
            created += response.results?.length || 0
          }
        } catch (error: any) {
          failed += batch.length
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      return { created, updated, failed, errors }
    } catch (error) {
      console.error('Error in bulk upsert contacts:', error)
      throw error
    }
  }

  /**
   * Get all contacts from HubSpot
   */
  static async getContacts(accessToken: string, limit = 100): Promise<{
    contacts: HubSpotContact[]
    hasMore: boolean
    after?: string
  }> {
    try {
      const hubspotClient = getHubSpotClient(accessToken)

      const response = await hubspotClient.crm.contacts.basicApi.getPage(
        limit,
        undefined, // after
        [
          'firstname',
          'lastname',
          'email',
          'phone',
          'company',
          'jobtitle',
          'lifecyclestage',
          'hs_lead_status',
          'createdate',
          'lastmodifieddate',
          'zyxai_contact_id',
          'zyxai_last_call_date',
          'zyxai_call_count',
          'zyxai_lead_score'
        ]
      )

      return {
        contacts: response.results as HubSpotContact[],
        hasMore: !!response.paging?.next,
        after: response.paging?.next?.after
      }
    } catch (error) {
      console.error('Error fetching HubSpot contacts:', error)
      throw new Error('Failed to fetch contacts from HubSpot')
    }
  }

  /**
   * Create or update contact in HubSpot
   */
  static async upsertContact(
    accessToken: string,
    contactData: Partial<HubSpotContact['properties']>,
    hubspotId?: string
  ): Promise<HubSpotContact> {
    try {
      const hubspotClient = getHubSpotClient(accessToken)

      if (hubspotId) {
        // Update existing contact
        const response = await hubspotClient.crm.contacts.basicApi.update(
          hubspotId,
          { properties: contactData }
        )
        return response as HubSpotContact
      } else {
        // Create new contact
        const response = await hubspotClient.crm.contacts.basicApi.create({
          properties: contactData
        })
        return response as HubSpotContact
      }
    } catch (error) {
      console.error('Error upserting HubSpot contact:', error)
      throw new Error('Failed to upsert contact in HubSpot')
    }
  }

  /**
   * Search for contact by email
   */
  static async searchContactByEmail(accessToken: string, email: string): Promise<HubSpotContact | null> {
    try {
      const hubspotClient = getHubSpotClient(accessToken)

      const response = await hubspotClient.crm.contacts.searchApi.doSearch({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }],
        properties: [
          'firstname',
          'lastname',
          'email',
          'phone',
          'company',
          'jobtitle',
          'zyxai_contact_id'
        ]
      })

      return response.results.length > 0 ? response.results[0] as HubSpotContact : null
    } catch (error) {
      console.error('Error searching HubSpot contact:', error)
      return null
    }
  }

  // ===== ACTIVITIES =====

  /**
   * Log a call activity in HubSpot
   */
  static async logCallActivity(
    accessToken: string,
    activity: HubSpotActivity
  ): Promise<HubSpotActivity> {
    try {
      const hubspotClient = getHubSpotClient(accessToken)

      const response = await hubspotClient.crm.objects.calls.basicApi.create({
        properties: activity.properties,
        associations: activity.associations ? [
          ...(activity.associations.contacts?.map(contactId => ({
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 194 }]
          })) || []),
          ...(activity.associations.deals?.map(dealId => ({
            to: { id: dealId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 206 }]
          })) || [])
        ] : undefined
      })

      return response as HubSpotActivity
    } catch (error) {
      console.error('Error logging call activity in HubSpot:', error)
      throw new Error('Failed to log call activity in HubSpot')
    }
  }

  // ===== DEALS =====

  /**
   * Create deal in HubSpot
   */
  static async createDeal(
    accessToken: string,
    dealData: Partial<HubSpotDeal['properties']>,
    contactId?: string
  ): Promise<HubSpotDeal> {
    try {
      const hubspotClient = getHubSpotClient(accessToken)

      const response = await hubspotClient.crm.deals.basicApi.create({
        properties: dealData,
        associations: contactId ? [{
          to: { id: contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
        }] : undefined
      })

      return response as HubSpotDeal
    } catch (error) {
      console.error('Error creating HubSpot deal:', error)
      throw new Error('Failed to create deal in HubSpot')
    }
  }

  // ===== SYNC UTILITIES =====

  /**
   * Test connection to HubSpot
   */
  static async testConnection(accessToken: string): Promise<{
    success: boolean
    hubId?: string
    hubDomain?: string
    error?: string
  }> {
    try {
      const hubspotClient = getHubSpotClient(accessToken)

      // Try to get account info
      const response = await hubspotClient.oauth.accessTokensApi.get(accessToken)

      return {
        success: true,
        hubId: response.hubId?.toString(),
        hubDomain: response.hubDomain
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default HubSpotService
