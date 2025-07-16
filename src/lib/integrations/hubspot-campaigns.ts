import { hubspotIntegration } from './hubspot'
import { supabaseAdmin } from '@/lib/supabase'

interface HubSpotCampaign {
  id?: string
  name: string
  type: 'EMAIL' | 'SOCIAL' | 'PAID_SEARCH' | 'ORGANIC_SEARCH' | 'OTHER'
  subType?: string
  status: 'SCHEDULED' | 'EXECUTING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  startDate?: string
  endDate?: string
  budget?: number
  actualCost?: number
  expectedResponseCount?: number
  actualResponseCount?: number
  description?: string
  properties?: Record<string, any>
}

interface CampaignResult {
  campaignId: string
  totalContacts: number
  callsAttempted: number
  callsCompleted: number
  successRate: number
  leadsGenerated: number
  qualifiedLeads: number
  estimatedRevenue: number
  costPerLead: number
  roi: number
}

class HubSpotCampaignIntegration {
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

  // Create a HubSpot campaign from ZyxAI campaign
  async createHubSpotCampaign(zyxaiCampaignId: string) {
    console.log(`📢 Creating HubSpot campaign for ZyxAI campaign: ${zyxaiCampaignId}`)

    try {
      // Get ZyxAI campaign details
      const { data: campaign, error } = await supabaseAdmin
        .from('campaigns')
        .select(`
          *,
          assistants (name, description)
        `)
        .eq('id', zyxaiCampaignId)
        .single()

      if (error || !campaign) {
        throw new Error('ZyxAI campaign not found')
      }

      // Get campaign contact count
      const { count: contactCount } = await supabaseAdmin
        .from('campaign_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', zyxaiCampaignId)

      // Create HubSpot campaign
      const hubspotCampaignData: HubSpotCampaign = {
        name: `${campaign.name} (ZyxAI Voice Campaign)`,
        type: 'OTHER',
        subType: 'VOICE_AI_OUTBOUND',
        status: this.mapCampaignStatus(campaign.status),
        startDate: campaign.scheduled_at || campaign.created_at,
        description: `Voice AI campaign: ${campaign.description || 'Automated voice outreach campaign'}. Assistant: ${campaign.assistants?.name || 'Unknown'}. Target contacts: ${contactCount || 0}`,
        expectedResponseCount: Math.round((contactCount || 0) * 0.15), // Assume 15% response rate
        properties: {
          zyxai_campaign_id: zyxaiCampaignId,
          zyxai_assistant_name: campaign.assistants?.name || '',
          zyxai_campaign_type: campaign.type,
          zyxai_target_contacts: contactCount || 0
        }
      }

      // Create campaign in HubSpot
      const hubspotCampaign = await this.makeRequest('/marketing/v3/campaigns', {
        method: 'POST',
        body: JSON.stringify(hubspotCampaignData)
      })

      // Update ZyxAI campaign with HubSpot ID
      await supabaseAdmin
        .from('campaigns')
        .update({ 
          hubspot_campaign_id: hubspotCampaign.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', zyxaiCampaignId)

      console.log(`✅ Created HubSpot campaign: ${hubspotCampaign.id}`)
      return hubspotCampaign

    } catch (error) {
      console.error('❌ Error creating HubSpot campaign:', error)
      throw error
    }
  }

  // Update HubSpot campaign with results
  async updateCampaignResults(zyxaiCampaignId: string) {
    console.log(`📊 Updating HubSpot campaign results for: ${zyxaiCampaignId}`)

    try {
      // Get campaign with HubSpot ID
      const { data: campaign, error } = await supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('id', zyxaiCampaignId)
        .single()

      if (error || !campaign || !campaign.hubspot_campaign_id) {
        throw new Error('Campaign or HubSpot campaign ID not found')
      }

      // Calculate campaign results
      const results = await this.calculateCampaignResults(zyxaiCampaignId)

      // Update HubSpot campaign
      const updateData = {
        status: this.mapCampaignStatus(campaign.status),
        actualResponseCount: results.callsCompleted,
        actualCost: results.costPerLead * results.totalContacts,
        endDate: campaign.status === 'completed' ? new Date().toISOString() : undefined,
        properties: {
          ...campaign.properties,
          zyxai_calls_attempted: results.callsAttempted,
          zyxai_calls_completed: results.callsCompleted,
          zyxai_success_rate: results.successRate,
          zyxai_leads_generated: results.leadsGenerated,
          zyxai_qualified_leads: results.qualifiedLeads,
          zyxai_estimated_revenue: results.estimatedRevenue,
          zyxai_cost_per_lead: results.costPerLead,
          zyxai_roi: results.roi
        }
      }

      await this.makeRequest(`/marketing/v3/campaigns/${campaign.hubspot_campaign_id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      })

      console.log(`✅ Updated HubSpot campaign results: ${results.successRate}% success rate`)
      return results

    } catch (error) {
      console.error('❌ Error updating campaign results:', error)
      throw error
    }
  }

  // Calculate campaign performance metrics
  private async calculateCampaignResults(campaignId: string): Promise<CampaignResult> {
    try {
      // Get campaign calls
      const { data: calls } = await supabaseAdmin
        .from('calls')
        .select(`
          *,
          contacts (lead_score, estimated_value, status)
        `)
        .eq('campaign_id', campaignId)

      const totalContacts = calls?.length || 0
      const callsAttempted = calls?.length || 0
      const callsCompleted = calls?.filter(c => c.status === 'completed').length || 0
      const successRate = callsAttempted > 0 ? (callsCompleted / callsAttempted) * 100 : 0

      // Count leads generated (contacts with improved status)
      const leadsGenerated = calls?.filter(c => 
        c.contacts && ['contacted', 'qualified', 'proposal', 'negotiation'].includes(c.contacts.status)
      ).length || 0

      const qualifiedLeads = calls?.filter(c => 
        c.contacts && ['qualified', 'proposal', 'negotiation'].includes(c.contacts.status)
      ).length || 0

      // Calculate estimated revenue
      const estimatedRevenue = calls?.reduce((sum, call) => {
        return sum + (call.contacts?.estimated_value || 0)
      }, 0) || 0

      // Estimate cost per lead (assuming $2 per call attempt)
      const costPerLead = leadsGenerated > 0 ? (callsAttempted * 2) / leadsGenerated : 0

      // Calculate ROI
      const totalCost = callsAttempted * 2
      const roi = totalCost > 0 ? ((estimatedRevenue * 0.3 - totalCost) / totalCost) * 100 : 0

      return {
        campaignId,
        totalContacts,
        callsAttempted,
        callsCompleted,
        successRate: Math.round(successRate),
        leadsGenerated,
        qualifiedLeads,
        estimatedRevenue: Math.round(estimatedRevenue),
        costPerLead: Math.round(costPerLead),
        roi: Math.round(roi)
      }

    } catch (error) {
      console.error('❌ Error calculating campaign results:', error)
      throw error
    }
  }

  // Create contact lists in HubSpot for campaign targeting
  async createContactListFromCampaign(zyxaiCampaignId: string) {
    console.log(`📋 Creating HubSpot contact list for campaign: ${zyxaiCampaignId}`)

    try {
      // Get campaign details
      const { data: campaign } = await supabaseAdmin
        .from('campaigns')
        .select('name, description')
        .eq('id', zyxaiCampaignId)
        .single()

      // Get campaign contacts with HubSpot IDs
      const { data: campaignContacts } = await supabaseAdmin
        .from('campaign_contacts')
        .select(`
          contacts (
            hubspot_id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('campaign_id', zyxaiCampaignId)

      const hubspotContactIds = campaignContacts
        ?.map(cc => cc.contacts?.hubspot_id)
        .filter(id => id) || []

      if (hubspotContactIds.length === 0) {
        throw new Error('No contacts with HubSpot IDs found for this campaign')
      }

      // Create static list in HubSpot
      const listData = {
        name: `${campaign?.name || 'ZyxAI Campaign'} - Contact List`,
        dynamic: false,
        filters: [],
        objectTypeId: 'contacts'
      }

      const list = await this.makeRequest('/crm/v3/lists', {
        method: 'POST',
        body: JSON.stringify(listData)
      })

      // Add contacts to the list
      const addContactsData = {
        objectIds: hubspotContactIds
      }

      await this.makeRequest(`/crm/v3/lists/${list.listId}/memberships/add`, {
        method: 'POST',
        body: JSON.stringify(addContactsData)
      })

      console.log(`✅ Created HubSpot list: ${list.listId} with ${hubspotContactIds.length} contacts`)
      return list

    } catch (error) {
      console.error('❌ Error creating HubSpot contact list:', error)
      throw error
    }
  }

  // Sync all campaigns to HubSpot
  async syncAllCampaigns(organizationId: string) {
    console.log('🔄 Syncing all campaigns to HubSpot...')

    try {
      // Get all campaigns without HubSpot IDs
      const { data: campaigns, error } = await supabaseAdmin
        .from('campaigns')
        .select('id, name, status')
        .eq('organization_id', organizationId)
        .is('hubspot_campaign_id', null)

      if (error) throw error

      let syncedCount = 0

      for (const campaign of campaigns || []) {
        try {
          await this.createHubSpotCampaign(campaign.id)
          syncedCount++
        } catch (error) {
          console.error(`❌ Failed to sync campaign ${campaign.id}:`, error)
        }
      }

      // Update results for existing campaigns
      const { data: existingCampaigns } = await supabaseAdmin
        .from('campaigns')
        .select('id, hubspot_campaign_id')
        .eq('organization_id', organizationId)
        .not('hubspot_campaign_id', 'is', null)

      let updatedCount = 0

      for (const campaign of existingCampaigns || []) {
        try {
          await this.updateCampaignResults(campaign.id)
          updatedCount++
        } catch (error) {
          console.error(`❌ Failed to update campaign ${campaign.id}:`, error)
        }
      }

      console.log(`✅ Campaign sync complete! Created ${syncedCount}, updated ${updatedCount}`)
      return { syncedCount, updatedCount }

    } catch (error) {
      console.error('❌ Error syncing campaigns:', error)
      throw error
    }
  }

  // Map ZyxAI campaign status to HubSpot status
  private mapCampaignStatus(zyxaiStatus: string): HubSpotCampaign['status'] {
    const statusMap: Record<string, HubSpotCampaign['status']> = {
      'draft': 'SCHEDULED',
      'scheduled': 'SCHEDULED',
      'running': 'EXECUTING',
      'paused': 'PAUSED',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED'
    }
    return statusMap[zyxaiStatus] || 'SCHEDULED'
  }

  // Create campaign performance report
  async generateCampaignReport(organizationId: string) {
    console.log('📊 Generating campaign performance report...')

    try {
      const { data: campaigns } = await supabaseAdmin
        .from('campaigns')
        .select(`
          id,
          name,
          status,
          created_at,
          hubspot_campaign_id
        `)
        .eq('organization_id', organizationId)

      const report = []

      for (const campaign of campaigns || []) {
        const results = await this.calculateCampaignResults(campaign.id)
        report.push({
          campaignName: campaign.name,
          status: campaign.status,
          createdAt: campaign.created_at,
          hubspotCampaignId: campaign.hubspot_campaign_id,
          ...results
        })
      }

      // Sort by ROI descending
      report.sort((a, b) => b.roi - a.roi)

      console.log('✅ Campaign report generated')
      return report

    } catch (error) {
      console.error('❌ Error generating campaign report:', error)
      throw error
    }
  }

  // Auto-sync campaign when it completes
  async handleCampaignCompletion(campaignId: string) {
    console.log(`🎯 Handling campaign completion: ${campaignId}`)

    try {
      // Create HubSpot campaign if it doesn't exist
      const { data: campaign } = await supabaseAdmin
        .from('campaigns')
        .select('hubspot_campaign_id')
        .eq('id', campaignId)
        .single()

      if (!campaign?.hubspot_campaign_id) {
        await this.createHubSpotCampaign(campaignId)
      }

      // Update campaign results
      await this.updateCampaignResults(campaignId)

      // Create contact list for future targeting
      await this.createContactListFromCampaign(campaignId)

      console.log('✅ Campaign completion handling complete')

    } catch (error) {
      console.error('❌ Error handling campaign completion:', error)
      throw error
    }
  }
}

// Export singleton instance
export const hubspotCampaignIntegration = new HubSpotCampaignIntegration(process.env.CRM_ACCESS_TOKEN || '')

// Export class for testing
export { HubSpotCampaignIntegration }
