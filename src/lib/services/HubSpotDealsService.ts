import { HubSpotService } from './HubSpotService'

export interface HubSpotDeal {
  id: string
  properties: {
    dealname: string
    amount?: string
    dealstage: string
    pipeline: string
    closedate?: string
    probability?: string
    dealtype?: string
    description?: string
    hs_priority?: string
    lead_source?: string
    hubspot_owner_id?: string
    createdate: string
    hs_lastmodifieddate: string
    [key: string]: any
  }
  associations?: {
    contacts?: { id: string }[]
    companies?: { id: string }[]
  }
}

export interface HubSpotPipeline {
  id: string
  label: string
  displayOrder: number
  stages: HubSpotStage[]
}

export interface HubSpotStage {
  id: string
  label: string
  displayOrder: number
  probability: number
  metadata: {
    isClosed: string
    probability: string
  }
}

export interface HubSpotDealFilters {
  pipeline?: string
  stage?: string
  owner?: string
  amount_gte?: number
  amount_lte?: number
  closedate_gte?: string
  closedate_lte?: string
  createdate_gte?: string
  createdate_lte?: string
  dealstage?: string
  search?: string
}

export class HubSpotDealsService {
  private static accessToken: string

  static setAccessToken(token: string) {
    this.accessToken = token
  }

  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `https://api.hubapi.com${endpoint}`

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
  /**
   * Get all deal pipelines
   */
  static async getPipelines(): Promise<HubSpotPipeline[]> {
    try {
      const response = await this.makeRequest('/crm/v3/pipelines/deals')
      return response.results || []
    } catch (error) {
      console.error('Failed to fetch HubSpot pipelines:', error)
      throw error
    }
  }

  /**
   * Get pipeline stages
   */
  static async getPipelineStages(pipelineId: string): Promise<HubSpotStage[]> {
    try {
      const response = await this.makeRequest(`/crm/v3/pipelines/deals/${pipelineId}`)
      return response.stages || []
    } catch (error) {
      console.error('Failed to fetch HubSpot pipeline stages:', error)
      throw error
    }
  }

  /**
   * Get deals with filters and pagination
   */
  static async getDeals(
    filters: HubSpotDealFilters = {},
    limit = 100,
    after?: string,
    properties?: string[]
  ): Promise<{
    results: HubSpotDeal[]
    paging?: { next?: { after: string } }
  }> {
    try {
      const defaultProperties = [
        'dealname',
        'amount',
        'dealstage',
        'pipeline',
        'closedate',
        'probability',
        'dealtype',
        'description',
        'hs_priority',
        'lead_source',
        'hubspot_owner_id',
        'createdate',
        'hs_lastmodifieddate'
      ]

      const params = new URLSearchParams({
        limit: limit.toString(),
        properties: (properties || defaultProperties).join(','),
        associations: 'contacts,companies'
      })

      if (after) {
        params.append('after', after)
      }

      // Add filters
      if (filters.pipeline) {
        params.append('pipeline', filters.pipeline)
      }

      const response = await this.makeRequest(`/crm/v3/objects/deals?${params.toString()}`)
      return {
        results: response.results || [],
        paging: response.paging
      }
    } catch (error) {
      console.error('Failed to fetch HubSpot deals:', error)
      throw error
    }
  }

  /**
   * Search deals with advanced filters
   */
  static async searchDeals(
    filters: HubSpotDealFilters = {},
    limit = 100,
    after?: string,
    properties?: string[]
  ): Promise<{
    results: HubSpotDeal[]
    total: number
    paging?: { next?: { after: string } }
  }> {
    try {
      const defaultProperties = [
        'dealname',
        'amount',
        'dealstage',
        'pipeline',
        'closedate',
        'probability',
        'dealtype',
        'description',
        'hs_priority',
        'lead_source',
        'hubspot_owner_id',
        'createdate',
        'hs_lastmodifieddate'
      ]

      // Build filter groups
      const filterGroups = []
      const filterGroup: any = { filters: [] }

      if (filters.pipeline) {
        filterGroup.filters.push({
          propertyName: 'pipeline',
          operator: 'EQ',
          value: filters.pipeline
        })
      }

      if (filters.stage) {
        filterGroup.filters.push({
          propertyName: 'dealstage',
          operator: 'EQ',
          value: filters.stage
        })
      }

      if (filters.owner) {
        filterGroup.filters.push({
          propertyName: 'hubspot_owner_id',
          operator: 'EQ',
          value: filters.owner
        })
      }

      if (filters.amount_gte) {
        filterGroup.filters.push({
          propertyName: 'amount',
          operator: 'GTE',
          value: filters.amount_gte.toString()
        })
      }

      if (filters.amount_lte) {
        filterGroup.filters.push({
          propertyName: 'amount',
          operator: 'LTE',
          value: filters.amount_lte.toString()
        })
      }

      if (filters.closedate_gte) {
        filterGroup.filters.push({
          propertyName: 'closedate',
          operator: 'GTE',
          value: filters.closedate_gte
        })
      }

      if (filters.closedate_lte) {
        filterGroup.filters.push({
          propertyName: 'closedate',
          operator: 'LTE',
          value: filters.closedate_lte
        })
      }

      if (filterGroup.filters.length > 0) {
        filterGroups.push(filterGroup)
      }

      const searchRequest = {
        filterGroups,
        sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
        properties: properties || defaultProperties,
        limit,
        after
      }

      const response = await this.makeRequest('/crm/v3/objects/deals/search', {
        method: 'POST',
        body: JSON.stringify(searchRequest)
      })

      return {
        results: response.results || [],
        total: response.total || 0,
        paging: response.paging
      }
    } catch (error) {
      console.error('Failed to search HubSpot deals:', error)
      throw error
    }
  }

  /**
   * Get a single deal by ID
   */
  static async getDeal(
    dealId: string,
    properties?: string[]
  ): Promise<HubSpotDeal | null> {
    try {
      const defaultProperties = [
        'dealname',
        'amount',
        'dealstage',
        'pipeline',
        'closedate',
        'probability',
        'dealtype',
        'description',
        'hs_priority',
        'lead_source',
        'hubspot_owner_id',
        'createdate',
        'hs_lastmodifieddate'
      ]

      const params = new URLSearchParams({
        properties: (properties || defaultProperties).join(','),
        associations: 'contacts,companies'
      })

      const response = await this.makeRequest(`/crm/v3/objects/deals/${dealId}?${params.toString()}`)
      return response
    } catch (error) {
      console.error('Failed to fetch HubSpot deal:', error)
      return null
    }
  }

  /**
   * Create a new deal
   */
  static async createDeal(dealData: {
    dealname: string
    amount?: number
    dealstage?: string
    pipeline?: string
    closedate?: string
    probability?: number
    dealtype?: string
    description?: string
    hs_priority?: string
    lead_source?: string
    hubspot_owner_id?: string
    [key: string]: any
  }): Promise<HubSpotDeal | null> {
    try {
      const properties: any = {
        dealname: dealData.dealname
      }

      // Add optional properties
      if (dealData.amount !== undefined) properties.amount = dealData.amount.toString()
      if (dealData.dealstage) properties.dealstage = dealData.dealstage
      if (dealData.pipeline) properties.pipeline = dealData.pipeline
      if (dealData.closedate) properties.closedate = dealData.closedate
      if (dealData.probability !== undefined) properties.probability = dealData.probability.toString()
      if (dealData.dealtype) properties.dealtype = dealData.dealtype
      if (dealData.description) properties.description = dealData.description
      if (dealData.hs_priority) properties.hs_priority = dealData.hs_priority
      if (dealData.lead_source) properties.lead_source = dealData.lead_source
      if (dealData.hubspot_owner_id) properties.hubspot_owner_id = dealData.hubspot_owner_id

      // Add any additional custom properties
      Object.keys(dealData).forEach(key => {
        if (!properties[key] && dealData[key] !== undefined) {
          properties[key] = dealData[key]
        }
      })

      const response = await this.makeRequest('/crm/v3/objects/deals', {
        method: 'POST',
        body: JSON.stringify({ properties })
      })

      return response
    } catch (error) {
      console.error('Failed to create HubSpot deal:', error)
      throw error
    }
  }

  /**
   * Update a deal
   */
  static async updateDeal(
    dealId: string,
    updates: Partial<HubSpotDeal['properties']>
  ): Promise<HubSpotDeal | null> {
    try {
      const response = await this.makeRequest(`/crm/v3/objects/deals/${dealId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties: updates })
      })

      return response
    } catch (error) {
      console.error('Failed to update HubSpot deal:', error)
      throw error
    }
  }

  /**
   * Get deals for opportunities system with enhanced data
   */
  static async getDealsForOpportunities(
    filters: HubSpotDealFilters = {},
    limit = 100,
    after?: string
  ): Promise<{
    results: HubSpotDeal[]
    paging?: { next?: { after: string } }
    total?: number
  }> {
    try {
      const properties = [
        'dealname',
        'amount',
        'dealstage',
        'pipeline',
        'closedate',
        'probability',
        'dealtype',
        'description',
        'hs_priority',
        'lead_source',
        'hubspot_owner_id',
        'createdate',
        'hs_lastmodifieddate',
        'hs_deal_stage_probability',
        'amount_in_home_currency',
        'hs_forecast_amount',
        'hs_forecast_probability'
      ]

      // Use search API for better filtering
      const searchRequest = {
        filterGroups: this.buildFilterGroups(filters),
        sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
        properties,
        limit,
        after
      }

      const response = await this.makeRequest('/crm/v3/objects/deals/search', {
        method: 'POST',
        body: JSON.stringify(searchRequest)
      })

      // Fetch associated contacts and companies for each deal
      const dealsWithAssociations = await Promise.all(
        (response.results || []).map(async (deal: HubSpotDeal) => {
          try {
            // Get associated contacts
            const contactsResponse = await this.makeRequest(
              `/crm/v3/objects/deals/${deal.id}/associations/contacts`
            )

            // Get associated companies
            const companiesResponse = await this.makeRequest(
              `/crm/v3/objects/deals/${deal.id}/associations/companies`
            )

            return {
              ...deal,
              associations: {
                contacts: contactsResponse.results || [],
                companies: companiesResponse.results || []
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch associations for deal ${deal.id}:`, error)
            return deal
          }
        })
      )

      return {
        results: dealsWithAssociations,
        paging: response.paging,
        total: response.total
      }
    } catch (error) {
      console.error('Failed to fetch deals for opportunities:', error)
      throw error
    }
  }

  /**
   * Build filter groups for HubSpot search API
   */
  private static buildFilterGroups(filters: HubSpotDealFilters): any[] {
    const filterGroups = []
    const filterGroup: any = { filters: [] }

    if (filters.pipeline) {
      filterGroup.filters.push({
        propertyName: 'pipeline',
        operator: 'EQ',
        value: filters.pipeline
      })
    }

    if (filters.stage || filters.dealstage) {
      filterGroup.filters.push({
        propertyName: 'dealstage',
        operator: 'EQ',
        value: filters.stage || filters.dealstage
      })
    }

    if (filters.owner) {
      filterGroup.filters.push({
        propertyName: 'hubspot_owner_id',
        operator: 'EQ',
        value: filters.owner
      })
    }

    if (filters.amount_gte) {
      filterGroup.filters.push({
        propertyName: 'amount',
        operator: 'GTE',
        value: filters.amount_gte.toString()
      })
    }

    if (filters.amount_lte) {
      filterGroup.filters.push({
        propertyName: 'amount',
        operator: 'LTE',
        value: filters.amount_lte.toString()
      })
    }

    if (filters.closedate_gte) {
      filterGroup.filters.push({
        propertyName: 'closedate',
        operator: 'GTE',
        value: filters.closedate_gte
      })
    }

    if (filters.closedate_lte) {
      filterGroup.filters.push({
        propertyName: 'closedate',
        operator: 'LTE',
        value: filters.closedate_lte
      })
    }

    if (filters.createdate_gte) {
      filterGroup.filters.push({
        propertyName: 'createdate',
        operator: 'GTE',
        value: filters.createdate_gte
      })
    }

    if (filters.createdate_lte) {
      filterGroup.filters.push({
        propertyName: 'createdate',
        operator: 'LTE',
        value: filters.createdate_lte
      })
    }

    if (filters.search) {
      filterGroup.filters.push({
        propertyName: 'dealname',
        operator: 'CONTAINS_TOKEN',
        value: filters.search
      })
    }

    if (filterGroup.filters.length > 0) {
      filterGroups.push(filterGroup)
    }

    return filterGroups
  }

  /**
   * Move deal to different stage
   */
  static async moveDealToStage(
    dealId: string,
    stageId: string
  ): Promise<HubSpotDeal | null> {
    try {
      return await this.updateDeal(dealId, {
        dealstage: stageId
      })
    } catch (error) {
      console.error('Failed to move HubSpot deal to stage:', error)
      throw error
    }
  }

  /**
   * Delete a deal
   */
  static async deleteDeal(dealId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/crm/v3/objects/deals/${dealId}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('Failed to delete HubSpot deal:', error)
      return false
    }
  }

  /**
   * Associate deal with contact
   */
  static async associateDealWithContact(
    dealId: string,
    contactId: string
  ): Promise<boolean> {
    try {
      await this.makeRequest(`/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/3`, {
        method: 'PUT'
      })
      return true
    } catch (error) {
      console.error('Failed to associate deal with contact:', error)
      return false
    }
  }

  /**
   * Associate deal with company
   */
  static async associateDealWithCompany(
    dealId: string,
    companyId: string
  ): Promise<boolean> {
    try {
      await this.makeRequest(`/crm/v3/objects/deals/${dealId}/associations/companies/${companyId}/5`, {
        method: 'PUT'
      })
      return true
    } catch (error) {
      console.error('Failed to associate deal with company:', error)
      return false
    }
  }

  /**
   * Get contact details for deals
   */
  static async getContactsForDeals(contactIds: string[]): Promise<Record<string, any>> {
    if (contactIds.length === 0) return {}

    try {
      const contacts: Record<string, any> = {}

      // Batch fetch contacts (HubSpot allows up to 100 per request)
      const batchSize = 100
      for (let i = 0; i < contactIds.length; i += batchSize) {
        const batch = contactIds.slice(i, i + batchSize)

        const response = await this.makeRequest('/crm/v3/objects/contacts/batch/read', {
          method: 'POST',
          body: JSON.stringify({
            inputs: batch.map(id => ({ id })),
            properties: [
              'firstname',
              'lastname',
              'email',
              'phone',
              'company',
              'jobtitle'
            ]
          })
        })

        if (response.results) {
          response.results.forEach((contact: any) => {
            contacts[contact.id] = {
              id: contact.id,
              name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || 'Unknown Contact',
              email: contact.properties.email || '',
              phone: contact.properties.phone || '',
              company: contact.properties.company || '',
              jobTitle: contact.properties.jobtitle || ''
            }
          })
        }
      }

      return contacts
    } catch (error) {
      console.error('Failed to fetch contacts for deals:', error)
      return {}
    }
  }

  /**
   * Get owner details for deals
   */
  static async getOwnersForDeals(ownerIds: string[]): Promise<Record<string, any>> {
    if (ownerIds.length === 0) return {}

    try {
      const owners: Record<string, any> = {}

      // Fetch owners from HubSpot
      const response = await this.makeRequest('/crm/v3/owners')

      if (response.results) {
        response.results.forEach((owner: any) => {
          if (ownerIds.includes(owner.id)) {
            owners[owner.id] = {
              id: owner.id,
              name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Unknown Owner',
              email: owner.email || ''
            }
          }
        })
      }

      return owners
    } catch (error) {
      console.error('Failed to fetch owners for deals:', error)
      return {}
    }
  }
}
