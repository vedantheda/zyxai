import { hubspotIntegration } from './hubspot'
import { supabaseAdmin } from '@/lib/supabase'

interface AnalyticsData {
  calls: {
    total: number
    successful: number
    successRate: number
    averageDuration: number
    totalMinutes: number
  }
  leads: {
    total: number
    qualified: number
    conversionRate: number
    averageScore: number
    pipelineValue: number
  }
  revenue: {
    total: number
    monthlyRecurring: number
    averageDealSize: number
    forecastedRevenue: number
    growthRate: number
  }
  campaigns: {
    active: number
    totalSpend: number
    roi: number
    costPerLead: number
    responseRate: number
  }
}

interface HubSpotCustomProperty {
  name: string
  label: string
  type: 'string' | 'number' | 'date' | 'enumeration'
  fieldType: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'radio'
  groupName: string
  description: string
  options?: Array<{ label: string; value: string }>
}

class HubSpotAnalyticsIntegration {
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

  // Create custom properties for ZyxAI analytics data
  async createZyxAIProperties() {
    console.log('🔧 Creating ZyxAI custom properties in HubSpot...')

    const contactProperties: HubSpotCustomProperty[] = [
      {
        name: 'zyxai_call_count',
        label: 'ZyxAI Call Count',
        type: 'number',
        fieldType: 'number',
        groupName: 'zyxai_analytics',
        description: 'Total number of calls made through ZyxAI'
      },
      {
        name: 'zyxai_last_call_date',
        label: 'ZyxAI Last Call Date',
        type: 'date',
        fieldType: 'date',
        groupName: 'zyxai_analytics',
        description: 'Date of last call made through ZyxAI'
      },
      {
        name: 'zyxai_lead_score',
        label: 'ZyxAI Lead Score',
        type: 'number',
        fieldType: 'number',
        groupName: 'zyxai_analytics',
        description: 'AI-calculated lead score from ZyxAI'
      },
      {
        name: 'zyxai_call_success_rate',
        label: 'ZyxAI Call Success Rate',
        type: 'number',
        fieldType: 'number',
        groupName: 'zyxai_analytics',
        description: 'Success rate of calls made through ZyxAI'
      },
      {
        name: 'zyxai_total_call_duration',
        label: 'ZyxAI Total Call Duration',
        type: 'number',
        fieldType: 'number',
        groupName: 'zyxai_analytics',
        description: 'Total duration of all calls in minutes'
      },
      {
        name: 'zyxai_campaign_responses',
        label: 'ZyxAI Campaign Responses',
        type: 'number',
        fieldType: 'number',
        groupName: 'zyxai_analytics',
        description: 'Number of campaign responses'
      },
      {
        name: 'zyxai_engagement_level',
        label: 'ZyxAI Engagement Level',
        type: 'enumeration',
        fieldType: 'select',
        groupName: 'zyxai_analytics',
        description: 'Contact engagement level based on ZyxAI interactions',
        options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
          { label: 'Not Engaged', value: 'not_engaged' }
        ]
      },
      {
        name: 'zyxai_last_campaign',
        label: 'ZyxAI Last Campaign',
        type: 'string',
        fieldType: 'text',
        groupName: 'zyxai_analytics',
        description: 'Name of last ZyxAI campaign contact participated in'
      }
    ]

    const dealProperties: HubSpotCustomProperty[] = [
      {
        name: 'zyxai_source_campaign',
        label: 'ZyxAI Source Campaign',
        type: 'string',
        fieldType: 'text',
        groupName: 'zyxai_analytics',
        description: 'ZyxAI campaign that generated this deal'
      },
      {
        name: 'zyxai_call_to_close_time',
        label: 'ZyxAI Call to Close Time',
        type: 'number',
        fieldType: 'number',
        groupName: 'zyxai_analytics',
        description: 'Days from first ZyxAI call to deal close'
      },
      {
        name: 'zyxai_total_touchpoints',
        label: 'ZyxAI Total Touchpoints',
        type: 'number',
        fieldType: 'number',
        groupName: 'zyxai_analytics',
        description: 'Total number of ZyxAI touchpoints before close'
      }
    ]

    // Create contact properties
    for (const property of contactProperties) {
      try {
        await this.makeRequest('/crm/v3/properties/contacts', {
          method: 'POST',
          body: JSON.stringify(property)
        })
        console.log(`✅ Created contact property: ${property.name}`)
      } catch (error: any) {
        if (error.message.includes('409')) {
          console.log(`ℹ️ Contact property already exists: ${property.name}`)
        } else {
          console.error(`❌ Failed to create contact property ${property.name}:`, error.message)
        }
      }
    }

    // Create deal properties
    for (const property of dealProperties) {
      try {
        await this.makeRequest('/crm/v3/properties/deals', {
          method: 'POST',
          body: JSON.stringify(property)
        })
        console.log(`✅ Created deal property: ${property.name}`)
      } catch (error: any) {
        if (error.message.includes('409')) {
          console.log(`ℹ️ Deal property already exists: ${property.name}`)
        } else {
          console.error(`❌ Failed to create deal property ${property.name}:`, error.message)
        }
      }
    }

    console.log('🎉 ZyxAI properties setup complete!')
  }

  // Sync analytics data to HubSpot contacts
  async syncAnalyticsToContacts(organizationId: string) {
    console.log('📊 Syncing analytics data to HubSpot contacts...')

    try {
      // Get all contacts with HubSpot IDs
      const { data: contacts, error } = await supabaseAdmin
        .from('contacts')
        .select(`
          id,
          hubspot_id,
          first_name,
          last_name,
          lead_score,
          created_at,
          updated_at
        `)
        .eq('organization_id', organizationId)
        .not('hubspot_id', 'is', null)

      if (error) throw error

      let updatedCount = 0

      for (const contact of contacts || []) {
        try {
          // Get call analytics for this contact
          const { data: calls } = await supabaseAdmin
            .from('calls')
            .select('*')
            .eq('contact_id', contact.id)

          const callCount = calls?.length || 0
          const successfulCalls = calls?.filter(c => c.status === 'completed').length || 0
          const successRate = callCount > 0 ? (successfulCalls / callCount) * 100 : 0
          const totalDuration = calls?.reduce((sum, call) => {
            if (call.ended_at && call.created_at) {
              const duration = new Date(call.ended_at).getTime() - new Date(call.created_at).getTime()
              return sum + (duration / 60000) // Convert to minutes
            }
            return sum
          }, 0) || 0

          const lastCallDate = calls?.length > 0 ? 
            Math.max(...calls.map(c => new Date(c.created_at).getTime())) : null

          // Get campaign participation
          const { data: campaignParticipation } = await supabaseAdmin
            .from('campaign_contacts')
            .select(`
              campaigns (name, created_at)
            `)
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const lastCampaign = campaignParticipation?.[0]?.campaigns?.name || ''

          // Determine engagement level
          let engagementLevel = 'not_engaged'
          if (successRate > 70) engagementLevel = 'high'
          else if (successRate > 40) engagementLevel = 'medium'
          else if (successRate > 0) engagementLevel = 'low'

          // Update HubSpot contact
          const updateData = {
            zyxai_call_count: callCount,
            zyxai_call_success_rate: Math.round(successRate),
            zyxai_total_call_duration: Math.round(totalDuration),
            zyxai_lead_score: contact.lead_score || 0,
            zyxai_engagement_level: engagementLevel,
            zyxai_last_campaign: lastCampaign
          }

          if (lastCallDate) {
            updateData.zyxai_last_call_date = new Date(lastCallDate).toISOString().split('T')[0]
          }

          await this.makeRequest(`/crm/v3/objects/contacts/${contact.hubspot_id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              properties: updateData
            })
          })

          updatedCount++
          console.log(`📊 Updated analytics for contact: ${contact.first_name} ${contact.last_name}`)

        } catch (error) {
          console.error(`❌ Failed to update contact ${contact.id}:`, error)
        }
      }

      console.log(`✅ Analytics sync complete! Updated ${updatedCount} contacts.`)
      return updatedCount

    } catch (error) {
      console.error('❌ Error syncing analytics to HubSpot:', error)
      throw error
    }
  }

  // Create HubSpot deals from qualified leads
  async createDealsFromQualifiedLeads(organizationId: string) {
    console.log('💰 Creating HubSpot deals from qualified leads...')

    try {
      // Get qualified leads without existing deals
      const { data: qualifiedLeads, error } = await supabaseAdmin
        .from('contacts')
        .select(`
          id,
          hubspot_id,
          first_name,
          last_name,
          company,
          estimated_value,
          lead_score,
          status,
          created_at
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'qualified')
        .not('hubspot_id', 'is', null)
        .gte('lead_score', 70) // Only high-scoring leads

      if (error) throw error

      let dealsCreated = 0

      for (const lead of qualifiedLeads || []) {
        try {
          // Check if deal already exists
          const existingDeals = await this.makeRequest(
            `/crm/v3/objects/deals/search`,
            {
              method: 'POST',
              body: JSON.stringify({
                filterGroups: [{
                  filters: [{
                    propertyName: 'zyxai_source_contact_id',
                    operator: 'EQ',
                    value: lead.id
                  }]
                }]
              })
            }
          )

          if (existingDeals.results?.length > 0) {
            console.log(`ℹ️ Deal already exists for lead: ${lead.first_name} ${lead.last_name}`)
            continue
          }

          // Get call data for deal context
          const { data: calls } = await supabaseAdmin
            .from('calls')
            .select('*')
            .eq('contact_id', lead.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const firstCallDate = calls?.[0]?.created_at
          const callToCloseTime = firstCallDate ? 
            Math.ceil((new Date().getTime() - new Date(firstCallDate).getTime()) / (1000 * 60 * 60 * 24)) : 0

          // Create deal in HubSpot
          const dealData = {
            properties: {
              dealname: `${lead.company || lead.first_name + ' ' + lead.last_name} - ZyxAI Generated`,
              amount: lead.estimated_value || 5000,
              dealstage: 'qualifiedtobuy',
              pipeline: 'default',
              closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              zyxai_source_campaign: 'Voice AI Qualification',
              zyxai_call_to_close_time: callToCloseTime,
              zyxai_total_touchpoints: calls?.length || 0,
              zyxai_source_contact_id: lead.id
            }
          }

          const deal = await this.makeRequest('/crm/v3/objects/deals', {
            method: 'POST',
            body: JSON.stringify(dealData)
          })

          // Associate deal with contact
          await this.makeRequest(
            `/crm/v3/objects/deals/${deal.id}/associations/contacts/${lead.hubspot_id}/deal_to_contact`,
            { method: 'PUT' }
          )

          dealsCreated++
          console.log(`💰 Created deal for: ${lead.first_name} ${lead.last_name} - $${lead.estimated_value}`)

        } catch (error) {
          console.error(`❌ Failed to create deal for lead ${lead.id}:`, error)
        }
      }

      console.log(`✅ Deal creation complete! Created ${dealsCreated} deals.`)
      return dealsCreated

    } catch (error) {
      console.error('❌ Error creating deals from qualified leads:', error)
      throw error
    }
  }

  // Get analytics data from our system
  async getAnalyticsData(organizationId: string): Promise<AnalyticsData> {
    try {
      // Get call analytics
      const { data: calls } = await supabaseAdmin
        .from('calls')
        .select('*')
        .eq('organization_id', organizationId)

      const totalCalls = calls?.length || 0
      const successfulCalls = calls?.filter(c => c.status === 'completed').length || 0
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0
      
      const totalMinutes = calls?.reduce((sum, call) => {
        if (call.ended_at && call.created_at) {
          const duration = new Date(call.ended_at).getTime() - new Date(call.created_at).getTime()
          return sum + (duration / 60000)
        }
        return sum
      }, 0) || 0

      const averageDuration = totalCalls > 0 ? totalMinutes / totalCalls : 0

      // Get lead analytics
      const { data: leads } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('organization_id', organizationId)

      const totalLeads = leads?.length || 0
      const qualifiedLeads = leads?.filter(l => l.status === 'qualified').length || 0
      const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0
      const averageScore = leads?.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / totalLeads || 0
      const pipelineValue = leads?.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0) || 0

      // Get campaign analytics
      const { data: campaigns } = await supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)

      const activeCampaigns = campaigns?.filter(c => c.status === 'running').length || 0

      return {
        calls: {
          total: totalCalls,
          successful: successfulCalls,
          successRate: Math.round(successRate),
          averageDuration: Math.round(averageDuration),
          totalMinutes: Math.round(totalMinutes)
        },
        leads: {
          total: totalLeads,
          qualified: qualifiedLeads,
          conversionRate: Math.round(conversionRate),
          averageScore: Math.round(averageScore),
          pipelineValue: Math.round(pipelineValue)
        },
        revenue: {
          total: Math.round(pipelineValue * 0.3), // Assume 30% close rate
          monthlyRecurring: 0, // Would need subscription data
          averageDealSize: qualifiedLeads > 0 ? Math.round(pipelineValue / qualifiedLeads) : 0,
          forecastedRevenue: Math.round(pipelineValue * 0.3),
          growthRate: 0 // Would need historical data
        },
        campaigns: {
          active: activeCampaigns,
          totalSpend: 0, // Would need cost data
          roi: 0, // Would need cost and revenue data
          costPerLead: 0, // Would need cost data
          responseRate: Math.round(successRate)
        }
      }

    } catch (error) {
      console.error('❌ Error getting analytics data:', error)
      throw error
    }
  }

  // Full analytics sync process
  async performFullAnalyticsSync(organizationId: string) {
    console.log('🚀 Starting full HubSpot analytics sync...')

    try {
      // 1. Create custom properties
      await this.createZyxAIProperties()

      // 2. Sync analytics to contacts
      const contactsUpdated = await this.syncAnalyticsToContacts(organizationId)

      // 3. Create deals from qualified leads
      const dealsCreated = await this.createDealsFromQualifiedLeads(organizationId)

      // 4. Get current analytics data
      const analyticsData = await this.getAnalyticsData(organizationId)

      console.log('🎉 Full analytics sync complete!')

      return {
        success: true,
        contactsUpdated,
        dealsCreated,
        analyticsData,
        message: `Successfully updated ${contactsUpdated} contacts and created ${dealsCreated} deals`
      }

    } catch (error) {
      console.error('❌ Full analytics sync failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const hubspotAnalyticsIntegration = new HubSpotAnalyticsIntegration('process.env.CRM_ACCESS_TOKEN || ""')

// Export class for testing
export { HubSpotAnalyticsIntegration }
