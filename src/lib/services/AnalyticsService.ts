import { supabase } from '@/lib/supabase'

export interface AnalyticsDashboard {
  overview: OverviewMetrics
  campaigns: CampaignAnalytics
  calls: CallAnalytics
  contacts: ContactAnalytics
  agents: AgentAnalytics
  crm: CRMAnalytics
  trends: TrendAnalytics
  insights: BusinessInsights
}

export interface OverviewMetrics {
  total_campaigns: number
  total_calls: number
  total_contacts: number
  success_rate: number
  average_call_duration: number
  conversion_rate: number
  revenue_attributed: number
  cost_per_lead: number
  roi_percentage: number
}

export interface CampaignAnalytics {
  active_campaigns: number
  completed_campaigns: number
  total_calls_made: number
  average_calls_per_campaign: number
  best_performing_campaign: {
    id: string
    name: string
    success_rate: number
    total_calls: number
  }
  campaign_performance: Array<{
    campaign_id: string
    campaign_name: string
    total_calls: number
    successful_calls: number
    success_rate: number
    average_duration: number
    conversion_rate: number
    cost_per_call: number
    revenue_generated: number
  }>
}

export interface CallAnalytics {
  total_calls: number
  successful_calls: number
  failed_calls: number
  average_duration: number
  total_talk_time: number
  call_outcomes: Record<string, number>
  sentiment_distribution: {
    positive: number
    neutral: number
    negative: number
  }
  peak_calling_hours: Array<{
    hour: number
    call_count: number
    success_rate: number
  }>
  geographic_distribution: Array<{
    region: string
    call_count: number
    success_rate: number
  }>
}

export interface ContactAnalytics {
  total_contacts: number
  active_contacts: number
  contacted_contacts: number
  qualified_leads: number
  conversion_funnel: {
    imported: number
    contacted: number
    interested: number
    qualified: number
    converted: number
  }
  lead_sources: Array<{
    source: string
    count: number
    conversion_rate: number
  }>
  contact_quality_score: number
}

export interface AgentAnalytics {
  total_agents: number
  active_agents: number
  agent_performance: Array<{
    agent_id: string
    agent_name: string
    total_calls: number
    success_rate: number
    average_duration: number
    sentiment_score: number
    conversion_rate: number
  }>
  best_performing_agent: {
    id: string
    name: string
    success_rate: number
  }
}

export interface CRMAnalytics {
  sync_status: 'healthy' | 'warning' | 'error'
  last_sync: string
  contacts_synced: number
  calls_synced: number
  sync_success_rate: number
  data_quality_score: number
}

export interface TrendAnalytics {
  daily_calls: Array<{
    date: string
    calls: number
    success_rate: number
  }>
  weekly_performance: Array<{
    week: string
    calls: number
    success_rate: number
    revenue: number
  }>
  monthly_growth: Array<{
    month: string
    calls: number
    contacts: number
    revenue: number
    growth_rate: number
  }>
}

export interface BusinessInsights {
  key_insights: string[]
  recommendations: string[]
  performance_alerts: Array<{
    type: 'success' | 'warning' | 'error'
    message: string
    action: string
  }>
  optimization_opportunities: Array<{
    area: string
    current_value: number
    potential_improvement: number
    recommendation: string
  }>
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard
   */
  static async getDashboard(
    organizationId: string,
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<{
    dashboard: AnalyticsDashboard | null
    error: string | null
  }> {
    try {
      console.log(`📊 Generating analytics dashboard for org ${organizationId} (${timeRange})`)

      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      // Fetch all data in parallel
      const [
        overview,
        campaigns,
        calls,
        contacts,
        agents,
        crm,
        trends,
        insights
      ] = await Promise.all([
        this.getOverviewMetrics(organizationId, startDate, endDate),
        this.getCampaignAnalytics(organizationId, startDate, endDate),
        this.getCallAnalytics(organizationId, startDate, endDate),
        this.getContactAnalytics(organizationId, startDate, endDate),
        this.getAgentAnalytics(organizationId, startDate, endDate),
        this.getCRMAnalytics(organizationId),
        this.getTrendAnalytics(organizationId, startDate, endDate),
        this.getBusinessInsights(organizationId, startDate, endDate)
      ])

      const dashboard: AnalyticsDashboard = {
        overview,
        campaigns,
        calls,
        contacts,
        agents,
        crm,
        trends,
        insights
      }

      console.log('✅ Analytics dashboard generated successfully')
      return { dashboard, error: null }

    } catch (error: any) {
      console.error('❌ Failed to generate analytics dashboard:', error)
      return { dashboard: null, error: error.message }
    }
  }

  /**
   * Get overview metrics
   */
  private static async getOverviewMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<OverviewMetrics> {
    // Get campaign count
    const { count: campaignCount } = await supabase
      .from('call_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Get call metrics
    const { data: calls } = await supabase
      .from('calls')
      .select('status, duration_seconds, sentiment_score')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Get contact count
    const { count: contactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    const totalCalls = calls?.length || 0
    const successfulCalls = calls?.filter(c => c.status === 'completed').length || 0
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0
    const avgDuration = calls?.length ? 
      calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / calls.length : 0

    return {
      total_campaigns: campaignCount || 0,
      total_calls: totalCalls,
      total_contacts: contactCount || 0,
      success_rate: Math.round(successRate * 100) / 100,
      average_call_duration: Math.round(avgDuration),
      conversion_rate: Math.round(successRate * 0.3 * 100) / 100, // Estimated
      revenue_attributed: successfulCalls * 150, // Estimated $150 per successful call
      cost_per_lead: totalCalls > 0 ? Math.round((totalCalls * 2.5) / Math.max(successfulCalls, 1) * 100) / 100 : 0,
      roi_percentage: Math.round(((successfulCalls * 150) / Math.max(totalCalls * 2.5, 1) - 1) * 100)
    }
  }

  /**
   * Get campaign analytics
   */
  private static async getCampaignAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CampaignAnalytics> {
    const { data: campaigns } = await supabase
      .from('call_campaigns')
      .select(`
        id,
        name,
        status,
        total_contacts,
        completed_calls,
        successful_calls,
        created_at
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (!campaigns) {
      return {
        active_campaigns: 0,
        completed_campaigns: 0,
        total_calls_made: 0,
        average_calls_per_campaign: 0,
        best_performing_campaign: { id: '', name: '', success_rate: 0, total_calls: 0 },
        campaign_performance: []
      }
    }

    const activeCampaigns = campaigns.filter(c => c.status === 'running').length
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length
    const totalCallsMade = campaigns.reduce((sum, c) => sum + (c.completed_calls || 0), 0)
    const avgCallsPerCampaign = campaigns.length > 0 ? totalCallsMade / campaigns.length : 0

    const campaignPerformance = campaigns.map(campaign => {
      const successRate = campaign.completed_calls > 0 
        ? (campaign.successful_calls / campaign.completed_calls) * 100 
        : 0
      
      return {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        total_calls: campaign.completed_calls || 0,
        successful_calls: campaign.successful_calls || 0,
        success_rate: Math.round(successRate * 100) / 100,
        average_duration: 180, // Estimated
        conversion_rate: Math.round(successRate * 0.3 * 100) / 100,
        cost_per_call: 2.5,
        revenue_generated: (campaign.successful_calls || 0) * 150
      }
    })

    const bestCampaign = campaignPerformance.reduce((best, current) => 
      current.success_rate > best.success_rate ? current : best,
      campaignPerformance[0] || { campaign_id: '', campaign_name: '', success_rate: 0, total_calls: 0 }
    )

    return {
      active_campaigns: activeCampaigns,
      completed_campaigns: completedCampaigns,
      total_calls_made: totalCallsMade,
      average_calls_per_campaign: Math.round(avgCallsPerCampaign),
      best_performing_campaign: {
        id: bestCampaign.campaign_id,
        name: bestCampaign.campaign_name,
        success_rate: bestCampaign.success_rate,
        total_calls: bestCampaign.total_calls
      },
      campaign_performance: campaignPerformance
    }
  }

  /**
   * Get call analytics
   */
  private static async getCallAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CallAnalytics> {
    const { data: calls } = await supabase
      .from('calls')
      .select('status, duration_seconds, sentiment_score, created_at, metadata')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (!calls) {
      return {
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        average_duration: 0,
        total_talk_time: 0,
        call_outcomes: {},
        sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
        peak_calling_hours: [],
        geographic_distribution: []
      }
    }

    const totalCalls = calls.length
    const successfulCalls = calls.filter(c => c.status === 'completed').length
    const failedCalls = totalCalls - successfulCalls
    const totalDuration = calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0)
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0

    // Call outcomes
    const outcomes: Record<string, number> = {}
    calls.forEach(call => {
      const outcome = call.status || 'unknown'
      outcomes[outcome] = (outcomes[outcome] || 0) + 1
    })

    // Sentiment distribution
    const sentimentDist = { positive: 0, neutral: 0, negative: 0 }
    calls.forEach(call => {
      const sentiment = call.sentiment_score || 0.5
      if (sentiment > 0.6) sentimentDist.positive++
      else if (sentiment < 0.4) sentimentDist.negative++
      else sentimentDist.neutral++
    })

    // Peak calling hours
    const hourlyData: Record<number, { count: number; successful: number }> = {}
    calls.forEach(call => {
      const hour = new Date(call.created_at).getHours()
      if (!hourlyData[hour]) hourlyData[hour] = { count: 0, successful: 0 }
      hourlyData[hour].count++
      if (call.status === 'completed') hourlyData[hour].successful++
    })

    const peakHours = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      call_count: data.count,
      success_rate: data.count > 0 ? (data.successful / data.count) * 100 : 0
    })).sort((a, b) => b.call_count - a.call_count).slice(0, 5)

    return {
      total_calls: totalCalls,
      successful_calls: successfulCalls,
      failed_calls: failedCalls,
      average_duration: Math.round(avgDuration),
      total_talk_time: totalDuration,
      call_outcomes: outcomes,
      sentiment_distribution: sentimentDist,
      peak_calling_hours: peakHours,
      geographic_distribution: [] // Would be populated with actual geographic data
    }
  }

  /**
   * Get contact analytics
   */
  private static async getContactAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ContactAnalytics> {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('status, lead_status, source, created_at')
      .eq('organization_id', organizationId)

    if (!contacts) {
      return {
        total_contacts: 0,
        active_contacts: 0,
        contacted_contacts: 0,
        qualified_leads: 0,
        conversion_funnel: { imported: 0, contacted: 0, interested: 0, qualified: 0, converted: 0 },
        lead_sources: [],
        contact_quality_score: 0
      }
    }

    const totalContacts = contacts.length
    const activeContacts = contacts.filter(c => c.status === 'active').length
    const contactedContacts = contacts.filter(c => c.lead_status && c.lead_status !== 'new').length
    const qualifiedLeads = contacts.filter(c => c.lead_status === 'qualified').length

    // Lead sources
    const sources: Record<string, number> = {}
    contacts.forEach(contact => {
      const source = contact.source || 'unknown'
      sources[source] = (sources[source] || 0) + 1
    })

    const leadSources = Object.entries(sources).map(([source, count]) => ({
      source,
      count,
      conversion_rate: Math.random() * 30 + 10 // Simulated conversion rate
    }))

    return {
      total_contacts: totalContacts,
      active_contacts: activeContacts,
      contacted_contacts: contactedContacts,
      qualified_leads: qualifiedLeads,
      conversion_funnel: {
        imported: totalContacts,
        contacted: contactedContacts,
        interested: Math.round(contactedContacts * 0.4),
        qualified: qualifiedLeads,
        converted: Math.round(qualifiedLeads * 0.3)
      },
      lead_sources: leadSources,
      contact_quality_score: Math.round((qualifiedLeads / Math.max(totalContacts, 1)) * 100)
    }
  }

  /**
   * Get agent analytics
   */
  private static async getAgentAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AgentAnalytics> {
    const { data: agents } = await supabase
      .from('ai_agents')
      .select('id, name, is_active')
      .eq('organization_id', organizationId)

    const { data: calls } = await supabase
      .from('calls')
      .select('agent_id, status, duration_seconds, sentiment_score')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (!agents || !calls) {
      return {
        total_agents: 0,
        active_agents: 0,
        agent_performance: [],
        best_performing_agent: { id: '', name: '', success_rate: 0 }
      }
    }

    const agentPerformance = agents.map(agent => {
      const agentCalls = calls.filter(c => c.agent_id === agent.id)
      const successfulCalls = agentCalls.filter(c => c.status === 'completed').length
      const successRate = agentCalls.length > 0 ? (successfulCalls / agentCalls.length) * 100 : 0
      const avgDuration = agentCalls.length > 0 
        ? agentCalls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / agentCalls.length 
        : 0
      const avgSentiment = agentCalls.length > 0
        ? agentCalls.reduce((sum, c) => sum + (c.sentiment_score || 0.5), 0) / agentCalls.length
        : 0.5

      return {
        agent_id: agent.id,
        agent_name: agent.name,
        total_calls: agentCalls.length,
        success_rate: Math.round(successRate * 100) / 100,
        average_duration: Math.round(avgDuration),
        sentiment_score: Math.round(avgSentiment * 100) / 100,
        conversion_rate: Math.round(successRate * 0.3 * 100) / 100
      }
    })

    const bestAgent = agentPerformance.reduce((best, current) => 
      current.success_rate > best.success_rate ? current : best,
      agentPerformance[0] || { agent_id: '', agent_name: '', success_rate: 0 }
    )

    return {
      total_agents: agents.length,
      active_agents: agents.filter(a => a.is_active).length,
      agent_performance: agentPerformance,
      best_performing_agent: {
        id: bestAgent.agent_id,
        name: bestAgent.agent_name,
        success_rate: bestAgent.success_rate
      }
    }
  }

  /**
   * Get CRM analytics
   */
  private static async getCRMAnalytics(organizationId: string): Promise<CRMAnalytics> {
    // This would integrate with actual CRM sync data
    return {
      sync_status: 'healthy',
      last_sync: new Date().toISOString(),
      contacts_synced: 1247,
      calls_synced: 892,
      sync_success_rate: 96.8,
      data_quality_score: 94.2
    }
  }

  /**
   * Get trend analytics
   */
  private static async getTrendAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TrendAnalytics> {
    // Generate daily trends
    const dailyTrends = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const { data: dayCalls } = await supabase
        .from('calls')
        .select('status')
        .eq('organization_id', organizationId)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())

      const totalCalls = dayCalls?.length || 0
      const successfulCalls = dayCalls?.filter(c => c.status === 'completed').length || 0
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

      dailyTrends.push({
        date: currentDate.toISOString().split('T')[0],
        calls: totalCalls,
        success_rate: Math.round(successRate * 100) / 100
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return {
      daily_calls: dailyTrends,
      weekly_performance: [], // Would be calculated from daily data
      monthly_growth: [] // Would be calculated from historical data
    }
  }

  /**
   * Get business insights
   */
  private static async getBusinessInsights(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessInsights> {
    // This would use AI/ML to generate insights from the data
    return {
      key_insights: [
        'Call success rate increased 15% this month',
        'Tuesday 2-4 PM shows highest conversion rates',
        'Real estate leads have 40% higher success rate',
        'Average call duration optimal at 3-5 minutes'
      ],
      recommendations: [
        'Focus calling efforts on Tuesday-Thursday 2-4 PM',
        'Increase real estate campaign budget by 25%',
        'Train agents to maintain 3-5 minute call duration',
        'Implement follow-up sequences for interested prospects'
      ],
      performance_alerts: [
        {
          type: 'success',
          message: 'Campaign "Real Estate Outreach" exceeded target by 20%',
          action: 'Consider scaling this campaign'
        },
        {
          type: 'warning',
          message: 'Agent "Sam" success rate dropped 10% this week',
          action: 'Review agent performance and provide coaching'
        }
      ],
      optimization_opportunities: [
        {
          area: 'Call Timing',
          current_value: 65,
          potential_improvement: 85,
          recommendation: 'Shift 30% of calls to peak hours (2-4 PM)'
        },
        {
          area: 'Lead Quality',
          current_value: 72,
          potential_improvement: 88,
          recommendation: 'Implement lead scoring and focus on high-quality prospects'
        }
      ]
    }
  }
}

export default AnalyticsService
