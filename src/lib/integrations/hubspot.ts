import { supabaseAdmin } from '@/lib/supabase'

interface HubSpotContact {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    phone?: string
    company?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    hs_lead_status?: string
    hubspotscore?: string
    createdate?: string
    lastmodifieddate?: string
    notes_last_contacted?: string
    notes_next_activity_date?: string
    total_revenue?: string
    lifecyclestage?: string
    lead_source?: string
  }
}

interface HubSpotDeal {
  id: string
  properties: {
    dealname?: string
    amount?: string
    dealstage?: string
    pipeline?: string
    closedate?: string
    createdate?: string
    hubspot_owner_id?: string
  }
}

class HubSpotIntegration {
  private accessToken: string
  private baseUrl = 'https://api.hubapi.com'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HubSpot API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Get all contacts from HubSpot
  async getContacts(limit = 100, after?: string): Promise<{ results: HubSpotContact[], paging?: any }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      properties: [
        'firstname', 'lastname', 'email', 'phone', 'company',
        'address', 'city', 'state', 'zip', 'hs_lead_status',
        'hubspotscore', 'createdate', 'lastmodifieddate',
        'notes_last_contacted', 'notes_next_activity_date',
        'total_revenue', 'lifecyclestage', 'lead_source'
      ].join(',')
    })

    if (after) {
      params.append('after', after)
    }

    return this.makeRequest(`/crm/v3/objects/contacts?${params}`)
  }

  // Get a specific contact by ID
  async getContact(contactId: string): Promise<HubSpotContact> {
    return this.makeRequest(`/crm/v3/objects/contacts/${contactId}`)
  }

  // Create a new contact in HubSpot
  async createContact(contactData: any): Promise<HubSpotContact> {
    return this.makeRequest('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          firstname: contactData.firstName,
          lastname: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          address: contactData.address,
          city: contactData.city,
          state: contactData.state,
          zip: contactData.zipCode,
          hs_lead_status: this.mapStatusToHubSpot(contactData.status),
          hubspotscore: contactData.leadScore?.toString(),
          total_revenue: contactData.estimatedValue?.toString(),
          lead_source: contactData.source,
          notes_last_contacted: contactData.lastContact,
          notes_next_activity_date: contactData.nextFollowUp
        }
      })
    })
  }

  // Update a contact in HubSpot
  async updateContact(contactId: string, contactData: any): Promise<HubSpotContact> {
    return this.makeRequest(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        properties: {
          firstname: contactData.firstName,
          lastname: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          address: contactData.address,
          city: contactData.city,
          state: contactData.state,
          zip: contactData.zipCode,
          hs_lead_status: this.mapStatusToHubSpot(contactData.status),
          hubspotscore: contactData.leadScore?.toString(),
          total_revenue: contactData.estimatedValue?.toString(),
          lead_source: contactData.source,
          notes_last_contacted: contactData.lastContact,
          notes_next_activity_date: contactData.nextFollowUp
        }
      })
    })
  }

  // Delete a contact from HubSpot
  async deleteContact(contactId: string): Promise<void> {
    await this.makeRequest(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'DELETE'
    })
  }

  // Get deals associated with a contact
  async getContactDeals(contactId: string): Promise<HubSpotDeal[]> {
    const response = await this.makeRequest(
      `/crm/v3/objects/contacts/${contactId}/associations/deals`
    )
    return response.results || []
  }

  // Create a deal for a contact
  async createDeal(dealData: any, contactId?: string): Promise<HubSpotDeal> {
    const deal = await this.makeRequest('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          dealname: dealData.name,
          amount: dealData.amount?.toString(),
          dealstage: dealData.stage,
          pipeline: dealData.pipeline || 'default',
          closedate: dealData.closeDate,
          hubspot_owner_id: dealData.ownerId
        }
      })
    })

    // Associate deal with contact if provided
    if (contactId) {
      await this.associateObjects('contacts', contactId, 'deals', deal.id)
    }

    return deal
  }

  // Associate two objects in HubSpot
  async associateObjects(fromObjectType: string, fromObjectId: string, toObjectType: string, toObjectId: string) {
    return this.makeRequest(
      `/crm/v3/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}/${toObjectId}/contact_to_deal`,
      { method: 'PUT' }
    )
  }

  // Map our internal status to HubSpot lead status
  private mapStatusToHubSpot(status: string): string {
    const statusMap: Record<string, string> = {
      'new': 'NEW',
      'contacted': 'OPEN_DEAL',
      'qualified': 'QUALIFIED_TO_BUY',
      'proposal': 'PRESENTATION_SCHEDULED',
      'negotiation': 'DECISION_MAKER_BOUGHT_IN',
      'closed_won': 'CONTRACT_SENT',
      'closed_lost': 'CLOSED_LOST'
    }
    return statusMap[status] || 'NEW'
  }

  // Map HubSpot status to our internal status
  private mapStatusFromHubSpot(hubspotStatus: string): string {
    const statusMap: Record<string, string> = {
      'NEW': 'new',
      'OPEN_DEAL': 'contacted',
      'QUALIFIED_TO_BUY': 'qualified',
      'PRESENTATION_SCHEDULED': 'proposal',
      'DECISION_MAKER_BOUGHT_IN': 'negotiation',
      'CONTRACT_SENT': 'closed_won',
      'CLOSED_LOST': 'closed_lost'
    }
    return statusMap[hubspotStatus] || 'new'
  }

  // Convert HubSpot contact to our internal format
  hubSpotContactToInternal(contact: HubSpotContact) {
    return {
      hubspot_id: contact.id,
      firstName: contact.properties.firstname || '',
      lastName: contact.properties.lastname || '',
      email: contact.properties.email || '',
      phone: contact.properties.phone || '',
      company: contact.properties.company || '',
      address: contact.properties.address || '',
      city: contact.properties.city || '',
      state: contact.properties.state || '',
      zipCode: contact.properties.zip || '',
      status: this.mapStatusFromHubSpot(contact.properties.hs_lead_status || 'NEW'),
      leadScore: parseInt(contact.properties.hubspotscore || '0'),
      source: contact.properties.lead_source || 'hubspot',
      estimatedValue: parseFloat(contact.properties.total_revenue || '0'),
      lastContact: contact.properties.notes_last_contacted,
      nextFollowUp: contact.properties.notes_next_activity_date,
      createdAt: contact.properties.createdate,
      updatedAt: contact.properties.lastmodifieddate
    }
  }

  // Sync all contacts from HubSpot to our database
  async syncContactsFromHubSpot(organizationId: string) {
    console.log('🔄 Starting HubSpot contact sync...')
    
    let after: string | undefined
    let totalSynced = 0
    
    do {
      try {
        const response = await this.getContacts(100, after)
        
        for (const contact of response.results) {
          const internalContact = this.hubSpotContactToInternal(contact)
          
          // Check if contact already exists
          const { data: existingContact } = await supabaseAdmin
            .from('contacts')
            .select('id')
            .eq('hubspot_id', contact.id)
            .eq('organization_id', organizationId)
            .single()

          if (existingContact) {
            // Update existing contact
            await supabaseAdmin
              .from('contacts')
              .update({
                ...internalContact,
                organization_id: organizationId,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingContact.id)
          } else {
            // Create new contact
            await supabaseAdmin
              .from('contacts')
              .insert({
                ...internalContact,
                organization_id: organizationId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
          }
          
          totalSynced++
        }
        
        after = response.paging?.next?.after
        console.log(`📋 Synced ${totalSynced} contacts so far...`)
        
      } catch (error) {
        console.error('❌ Error syncing contacts:', error)
        break
      }
    } while (after)
    
    console.log(`✅ HubSpot sync complete! Synced ${totalSynced} contacts.`)
    return totalSynced
  }

  // Sync a single contact to HubSpot
  async syncContactToHubSpot(contactData: any) {
    try {
      if (contactData.hubspot_id) {
        // Update existing contact
        return await this.updateContact(contactData.hubspot_id, contactData)
      } else {
        // Create new contact
        const hubspotContact = await this.createContact(contactData)
        
        // Update our database with the HubSpot ID
        await supabaseAdmin
          .from('contacts')
          .update({ hubspot_id: hubspotContact.id })
          .eq('id', contactData.id)
        
        return hubspotContact
      }
    } catch (error) {
      console.error('❌ Error syncing contact to HubSpot:', error)
      throw error
    }
  }
}

// Export singleton instance
export const hubspotIntegration = new HubSpotIntegration('process.env.CRM_ACCESS_TOKEN || ""')

// Export class for testing
export { HubSpotIntegration }
