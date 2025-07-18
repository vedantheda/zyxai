/**
 * Advanced Data Fetching Service
 * Optimized data fetching with batching, caching, and parallel requests
 */

import { supabase } from '@/lib/supabase'
import { OptimizedDatabaseService } from './OptimizedDatabaseService'

// Request batching and deduplication
class RequestBatcher {
  private static instance: RequestBatcher
  private pendingRequests = new Map<string, Promise<any>>()
  private batchQueue = new Map<string, Array<{ resolve: Function; reject: Function; params: any }>>()
  private batchTimeout: NodeJS.Timeout | null = null

  static getInstance(): RequestBatcher {
    if (!RequestBatcher.instance) {
      RequestBatcher.instance = new RequestBatcher()
    }
    return RequestBatcher.instance
  }

  // Deduplicate identical requests
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  // Batch similar requests together
  async batch<T>(
    batchKey: string,
    params: any,
    batchFn: (allParams: any[]) => Promise<T[]>,
    delay = 50
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, [])
      }

      this.batchQueue.get(batchKey)!.push({ resolve, reject, params })

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout)
      }

      this.batchTimeout = setTimeout(async () => {
        const batch = this.batchQueue.get(batchKey) || []
        this.batchQueue.delete(batchKey)

        if (batch.length === 0) return

        try {
          const allParams = batch.map(item => item.params)
          const results = await batchFn(allParams)
          
          batch.forEach((item, index) => {
            item.resolve(results[index])
          })
        } catch (error) {
          batch.forEach(item => {
            item.reject(error)
          })
        }
      }, delay)
    })
  }
}

// Advanced caching with TTL and invalidation
class AdvancedCache {
  private static instance: AdvancedCache
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private subscribers = new Map<string, Set<Function>>()

  static getInstance(): AdvancedCache {
    if (!AdvancedCache.instance) {
      AdvancedCache.instance = new AdvancedCache()
    }
    return AdvancedCache.instance
  }

  set(key: string, data: any, ttl = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // Notify subscribers
    const subs = this.subscribers.get(key)
    if (subs) {
      subs.forEach(callback => callback(data))
    }
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  subscribe(key: string, callback: Function): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(callback)

    return () => {
      this.subscribers.get(key)?.delete(callback)
    }
  }
}

export class AdvancedDataService {
  private static batcher = RequestBatcher.getInstance()
  private static cache = AdvancedCache.getInstance()

  /**
   * Get dashboard data with aggressive optimization
   */
  static async getDashboardData(organizationId: string) {
    const cacheKey = `dashboard_${organizationId}`
    
    return this.batcher.deduplicate(cacheKey, async () => {
      // Check cache first
      const cached = this.cache.get(cacheKey)
      if (cached) return cached

      // Parallel data fetching for all dashboard components
      const [
        agentsData,
        callsData,
        contactsData,
        campaignsData,
        analyticsData
      ] = await Promise.allSettled([
        this.getAgentsOptimized(organizationId),
        this.getRecentCallsOptimized(organizationId),
        this.getContactsStatsOptimized(organizationId),
        this.getCampaignsStatsOptimized(organizationId),
        this.getAnalyticsOptimized(organizationId)
      ])

      const result = {
        agents: agentsData.status === 'fulfilled' ? agentsData.value : [],
        calls: callsData.status === 'fulfilled' ? callsData.value : [],
        contacts: contactsData.status === 'fulfilled' ? contactsData.value : {},
        campaigns: campaignsData.status === 'fulfilled' ? campaignsData.value : {},
        analytics: analyticsData.status === 'fulfilled' ? analyticsData.value : {},
        timestamp: Date.now()
      }

      // Cache for 2 minutes
      this.cache.set(cacheKey, result, 2 * 60 * 1000)
      return result
    })
  }

  /**
   * Get agents with optimized query
   */
  static async getAgentsOptimized(organizationId: string) {
    const cacheKey = `agents_${organizationId}`
    
    return this.batcher.deduplicate(cacheKey, async () => {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached

      const { data, error } = await supabase
        .from('ai_agents')
        .select(`
          id,
          name,
          agent_type,
          is_active,
          created_at,
          updated_at,
          vapi_agent_id,
          configuration,
          calls!ai_agents_calls_agent_id_fkey(
            id,
            status,
            duration,
            cost,
            created_at
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Process data to include call statistics
      const processedData = (data || []).map(agent => ({
        ...agent,
        stats: {
          totalCalls: agent.calls?.length || 0,
          successfulCalls: agent.calls?.filter(call => call.status === 'completed').length || 0,
          totalDuration: agent.calls?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0,
          totalCost: agent.calls?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0,
          callsToday: agent.calls?.filter(call => 
            new Date(call.created_at).toDateString() === new Date().toDateString()
          ).length || 0
        }
      }))

      this.cache.set(cacheKey, processedData, 3 * 60 * 1000) // 3 minutes
      return processedData
    })
  }

  /**
   * Get recent calls with optimized query
   */
  static async getRecentCallsOptimized(organizationId: string, limit = 10) {
    const cacheKey = `recent_calls_${organizationId}_${limit}`
    
    return this.batcher.deduplicate(cacheKey, async () => {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached

      const { data, error } = await supabase
        .from('calls')
        .select(`
          id,
          status,
          direction,
          duration,
          cost,
          started_at,
          ended_at,
          agent:ai_agents(id, name),
          contact:contacts(id, first_name, last_name, company, phone)
        `)
        .eq('organization_id', organizationId)
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      this.cache.set(cacheKey, data || [], 1 * 60 * 1000) // 1 minute
      return data || []
    })
  }

  /**
   * Get contact statistics optimized
   */
  static async getContactsStatsOptimized(organizationId: string) {
    const cacheKey = `contacts_stats_${organizationId}`
    
    return this.batcher.deduplicate(cacheKey, async () => {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached

      // Single query with aggregations
      const { data, error } = await supabase
        .rpc('get_contact_stats', { org_id: organizationId })

      if (error) {
        // Fallback to manual query if RPC doesn't exist
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, status, created_at')
          .eq('organization_id', organizationId)

        if (contactsError) throw contactsError

        const stats = {
          total: contacts?.length || 0,
          active: contacts?.filter(c => c.status === 'active').length || 0,
          inactive: contacts?.filter(c => c.status === 'inactive').length || 0,
          new_this_month: contacts?.filter(c => 
            new Date(c.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          ).length || 0
        }

        this.cache.set(cacheKey, stats, 5 * 60 * 1000) // 5 minutes
        return stats
      }

      this.cache.set(cacheKey, data, 5 * 60 * 1000)
      return data
    })
  }

  /**
   * Get campaign statistics optimized
   */
  static async getCampaignsStatsOptimized(organizationId: string) {
    const cacheKey = `campaigns_stats_${organizationId}`
    
    return this.batcher.deduplicate(cacheKey, async () => {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached

      const { data, error } = await supabase
        .from('call_campaigns')
        .select(`
          id,
          status,
          total_contacts,
          completed_calls,
          successful_calls,
          created_at
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        active: data?.filter(c => c.status === 'active').length || 0,
        completed: data?.filter(c => c.status === 'completed').length || 0,
        total_calls: data?.reduce((sum, c) => sum + (c.completed_calls || 0), 0) || 0,
        success_rate: data?.length > 0 
          ? (data.reduce((sum, c) => sum + (c.successful_calls || 0), 0) / 
             data.reduce((sum, c) => sum + (c.completed_calls || 0), 0)) * 100 
          : 0
      }

      this.cache.set(cacheKey, stats, 5 * 60 * 1000)
      return stats
    })
  }

  /**
   * Get analytics data optimized
   */
  static async getAnalyticsOptimized(organizationId: string, days = 30) {
    const cacheKey = `analytics_${organizationId}_${days}`
    
    return this.batcher.deduplicate(cacheKey, async () => {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('daily_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error

      this.cache.set(cacheKey, data || [], 10 * 60 * 1000) // 10 minutes
      return data || []
    })
  }

  /**
   * Prefetch critical data for faster navigation
   */
  static async prefetchCriticalData(organizationId: string) {
    // Prefetch in background without blocking
    Promise.allSettled([
      this.getAgentsOptimized(organizationId),
      this.getContactsStatsOptimized(organizationId),
      this.getCampaignsStatsOptimized(organizationId),
      this.getRecentCallsOptimized(organizationId, 5)
    ]).catch(console.warn)
  }

  /**
   * Invalidate cache for organization
   */
  static invalidateOrganizationCache(organizationId: string) {
    this.cache.invalidate(`.*_${organizationId}.*`)
  }

  /**
   * Subscribe to data changes
   */
  static subscribeToData(key: string, callback: Function) {
    return this.cache.subscribe(key, callback)
  }

  /**
   * Background data refresh
   */
  static startBackgroundRefresh(organizationId: string, interval = 60000) {
    const refreshData = async () => {
      try {
        // Refresh critical data in background
        await Promise.allSettled([
          this.getRecentCallsOptimized(organizationId, 5),
          this.getContactsStatsOptimized(organizationId)
        ])
      } catch (error) {
        console.warn('Background refresh failed:', error)
      }
    }

    // Initial refresh
    refreshData()

    // Set up interval
    const intervalId = setInterval(refreshData, interval)

    // Return cleanup function
    return () => clearInterval(intervalId)
  }
}
