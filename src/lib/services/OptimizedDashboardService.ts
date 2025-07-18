import { supabase } from '@/lib/supabase'
import { apiCache } from '@/lib/optimization/AdvancedCache'

interface OptimizedDashboardData {
  stats: {
    totalAgents: number
    activeAgents: number
    totalCalls: number
    successfulCalls: number
    successRate: number
    totalContacts: number
    activeContacts: number
    activeCampaigns: number
    completedCampaigns: number
    averageCallDuration: number
    totalCost: number
    conversionRate: number
  }
  recentActivity: Array<{
    id: string
    type: 'call' | 'agent_created' | 'campaign_started' | 'contact_added'
    description: string
    timestamp: string
    metadata?: Record<string, any>
  }>
  trends: {
    callsOverTime: Array<{ date: string; calls: number; successful: number }>
    agentPerformance: Array<{ agentId: string; name: string; successRate: number; totalCalls: number }>
  }
}

/**
 * Optimized Dashboard Service
 * Combines all dashboard data in minimal database queries with caching
 */
export class OptimizedDashboardService {
  private static readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes
  private static readonly CACHE_KEY_PREFIX = 'dashboard'

  /**
   * Get all dashboard data in a single optimized call
   */
  static async getDashboardData(
    organizationId: string,
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    data: OptimizedDashboardData | null
    error: string | null
    fromCache: boolean
  }> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}_${organizationId}_${timeRange}`
    
    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return { data: cached, error: null, fromCache: true }
    }

    try {
      console.log(`📊 Loading optimized dashboard for org ${organizationId} (${timeRange})`)
      const startTime = performance.now()

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      switch (timeRange) {
        case '7d': startDate.setDate(endDate.getDate() - 7); break
        case '30d': startDate.setDate(endDate.getDate() - 30); break
        case '90d': startDate.setDate(endDate.getDate() - 90); break
      }

      // Single query to get all counts and aggregations
      const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats', {
        org_id: organizationId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })

      if (statsError) {
        console.error('Dashboard stats error:', statsError)
        // Fallback to individual queries if RPC fails
        return await this.getFallbackDashboardData(organizationId, timeRange)
      }

      // Get recent activity with a single query
      const { data: activityData, error: activityError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          resource_type,
          details,
          created_at,
          users:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      // Get trends data with aggregated queries
      const { data: trendsData, error: trendsError } = await supabase.rpc('get_dashboard_trends', {
        org_id: organizationId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })

      const dashboardData: OptimizedDashboardData = {
        stats: statsData?.[0] || {
          totalAgents: 0,
          activeAgents: 0,
          totalCalls: 0,
          successfulCalls: 0,
          successRate: 0,
          totalContacts: 0,
          activeContacts: 0,
          activeCampaigns: 0,
          completedCampaigns: 0,
          averageCallDuration: 0,
          totalCost: 0,
          conversionRate: 0
        },
        recentActivity: this.formatRecentActivity(activityData || []),
        trends: {
          callsOverTime: trendsData?.calls_over_time || [],
          agentPerformance: trendsData?.agent_performance || []
        }
      }

      // Cache the result
      apiCache.set(cacheKey, dashboardData, this.CACHE_TTL)

      const duration = performance.now() - startTime
      console.log(`✅ Dashboard loaded in ${duration.toFixed(2)}ms`)

      return { data: dashboardData, error: null, fromCache: false }

    } catch (error: any) {
      console.error('Dashboard loading error:', error)
      return { data: null, error: error.message, fromCache: false }
    }
  }

  /**
   * Fallback method using individual queries if RPC functions don't exist
   */
  private static async getFallbackDashboardData(
    organizationId: string,
    timeRange: '7d' | '30d' | '90d'
  ): Promise<{
    data: OptimizedDashboardData | null
    error: string | null
    fromCache: boolean
  }> {
    try {
      console.log('📊 Using fallback dashboard queries')

      const endDate = new Date()
      const startDate = new Date()
      switch (timeRange) {
        case '7d': startDate.setDate(endDate.getDate() - 7); break
        case '30d': startDate.setDate(endDate.getDate() - 30); break
        case '90d': startDate.setDate(endDate.getDate() - 90); break
      }

      // Parallel queries for better performance
      const [agentsResult, callsResult, contactsResult, campaignsResult] = await Promise.all([
        // Agents count
        supabase
          .from('ai_agents')
          .select('id, is_active', { count: 'exact' })
          .eq('organization_id', organizationId),

        // Calls stats
        supabase
          .from('calls')
          .select('id, status, duration, cost, created_at', { count: 'exact' })
          .eq('organization_id', organizationId)
          .gte('created_at', startDate.toISOString()),

        // Contacts count
        supabase
          .from('contacts')
          .select('id, status', { count: 'exact' })
          .eq('organization_id', organizationId),

        // Campaigns count
        supabase
          .from('campaigns')
          .select('id, status', { count: 'exact' })
          .eq('organization_id', organizationId)
      ])

      // Process results
      const agents = agentsResult.data || []
      const calls = callsResult.data || []
      const contacts = contactsResult.data || []
      const campaigns = campaignsResult.data || []

      const successfulCalls = calls.filter(call => call.status === 'completed').length
      const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0)
      const totalCost = calls.reduce((sum, call) => sum + (call.cost || 0), 0)

      const dashboardData: OptimizedDashboardData = {
        stats: {
          totalAgents: agents.length,
          activeAgents: agents.filter(agent => agent.is_active).length,
          totalCalls: calls.length,
          successfulCalls,
          successRate: calls.length > 0 ? (successfulCalls / calls.length) * 100 : 0,
          totalContacts: contacts.length,
          activeContacts: contacts.filter(contact => contact.status === 'active').length,
          activeCampaigns: campaigns.filter(campaign => campaign.status === 'active').length,
          completedCampaigns: campaigns.filter(campaign => campaign.status === 'completed').length,
          averageCallDuration: calls.length > 0 ? totalDuration / calls.length : 0,
          totalCost,
          conversionRate: 0 // Would need additional logic
        },
        recentActivity: [],
        trends: {
          callsOverTime: [],
          agentPerformance: []
        }
      }

      return { data: dashboardData, error: null, fromCache: false }

    } catch (error: any) {
      console.error('Fallback dashboard error:', error)
      return { data: null, error: error.message, fromCache: false }
    }
  }

  /**
   * Format recent activity data
   */
  private static formatRecentActivity(activityData: any[]): OptimizedDashboardData['recentActivity'] {
    return activityData.map(activity => ({
      id: activity.id,
      type: this.mapActionToType(activity.action),
      description: this.formatActivityDescription(activity),
      timestamp: activity.created_at,
      metadata: activity.details
    }))
  }

  private static mapActionToType(action: string): 'call' | 'agent_created' | 'campaign_started' | 'contact_added' {
    if (action.includes('call')) return 'call'
    if (action.includes('agent')) return 'agent_created'
    if (action.includes('campaign')) return 'campaign_started'
    if (action.includes('contact')) return 'contact_added'
    return 'call' // default
  }

  private static formatActivityDescription(activity: any): string {
    const user = activity.users
    const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'System'
    
    switch (activity.action) {
      case 'auth.login': return `${userName} logged in`
      case 'data.create': return `${userName} created ${activity.resource_type}`
      case 'data.update': return `${userName} updated ${activity.resource_type}`
      case 'data.delete': return `${userName} deleted ${activity.resource_type}`
      default: return `${userName} performed ${activity.action}`
    }
  }

  /**
   * Clear dashboard cache for organization
   */
  static clearCache(organizationId: string): void {
    const patterns = ['7d', '30d', '90d']
    patterns.forEach(timeRange => {
      const cacheKey = `${this.CACHE_KEY_PREFIX}_${organizationId}_${timeRange}`
      apiCache.delete(cacheKey)
    })
  }

  /**
   * Preload dashboard data for better UX
   */
  static async preloadDashboard(organizationId: string): Promise<void> {
    // Preload the most common time range
    await this.getDashboardData(organizationId, '30d')
  }
}
