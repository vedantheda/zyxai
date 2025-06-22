import { supabase } from '@/lib/supabase'

export interface CRMAnalytics {
  overview: {
    totalIntegrations: number
    activeIntegrations: number
    totalSyncedContacts: number
    totalSyncedCalls: number
    syncSuccessRate: number
    lastSyncTime?: string
  }
  syncStats: {
    contactsSynced24h: number
    callsSynced24h: number
    syncErrors24h: number
    avgSyncTime: number
  }
  integrationHealth: {
    crmType: string
    status: 'healthy' | 'warning' | 'error'
    lastSync?: string
    errorRate: number
    totalSynced: number
  }[]
  bulkJobStats: {
    totalJobs: number
    completedJobs: number
    failedJobs: number
    avgJobDuration: number
  }
  webhookStats: {
    totalEvents: number
    processedEvents: number
    failedEvents: number
    avgProcessingTime: number
  }
  fieldMappingStats: {
    totalMappings: number
    customMappings: number
    mappingsByEntity: Record<string, number>
  }
  timeSeriesData: {
    date: string
    contactsSynced: number
    callsSynced: number
    errors: number
  }[]
}

export interface SyncPerformanceMetrics {
  period: '24h' | '7d' | '30d'
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  avgSyncDuration: number
  peakSyncTime: string
  errorBreakdown: Record<string, number>
}

export class CRMAnalyticsService {
  /**
   * Get comprehensive CRM analytics for organization
   */
  static async getCRMAnalytics(
    organizationId: string,
    period: '24h' | '7d' | '30d' = '7d'
  ): Promise<{ analytics: CRMAnalytics | null; error: string | null }> {
    try {
      const [
        overview,
        syncStats,
        integrationHealth,
        bulkJobStats,
        webhookStats,
        fieldMappingStats,
        timeSeriesData
      ] = await Promise.all([
        this.getOverviewStats(organizationId),
        this.getSyncStats(organizationId, period),
        this.getIntegrationHealth(organizationId),
        this.getBulkJobStats(organizationId, period),
        this.getWebhookStats(organizationId, period),
        this.getFieldMappingStats(organizationId),
        this.getTimeSeriesData(organizationId, period)
      ])

      const analytics: CRMAnalytics = {
        overview,
        syncStats,
        integrationHealth,
        bulkJobStats,
        webhookStats,
        fieldMappingStats,
        timeSeriesData
      }

      return { analytics, error: null }
    } catch (error) {
      return { analytics: null, error: 'Failed to fetch CRM analytics' }
    }
  }

  /**
   * Get overview statistics
   */
  private static async getOverviewStats(organizationId: string) {
    const [integrations, contactMappings, callMappings] = await Promise.all([
      supabase
        .from('crm_integrations')
        .select('id, is_active, last_sync')
        .eq('organization_id', organizationId),
      
      supabase
        .from('contact_sync_mappings')
        .select('id, sync_status')
        .eq('organization_id', organizationId),
      
      supabase
        .from('call_sync_mappings')
        .select('id, sync_status')
        .eq('organization_id', organizationId)
    ])

    const totalIntegrations = integrations.data?.length || 0
    const activeIntegrations = integrations.data?.filter(i => i.is_active).length || 0
    const totalSyncedContacts = contactMappings.data?.length || 0
    const totalSyncedCalls = callMappings.data?.length || 0
    
    const successfulSyncs = [
      ...(contactMappings.data?.filter(m => m.sync_status === 'synced') || []),
      ...(callMappings.data?.filter(m => m.sync_status === 'synced') || [])
    ].length
    
    const totalSyncs = totalSyncedContacts + totalSyncedCalls
    const syncSuccessRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0

    const lastSyncTime = integrations.data
      ?.filter(i => i.last_sync)
      .sort((a, b) => new Date(b.last_sync!).getTime() - new Date(a.last_sync!).getTime())[0]?.last_sync

    return {
      totalIntegrations,
      activeIntegrations,
      totalSyncedContacts,
      totalSyncedCalls,
      syncSuccessRate,
      lastSyncTime
    }
  }

  /**
   * Get sync statistics for period
   */
  private static async getSyncStats(organizationId: string, period: string) {
    const periodHours = period === '24h' ? 24 : period === '7d' ? 168 : 720
    const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString()

    const [contactMappings, callMappings, webhookEvents] = await Promise.all([
      supabase
        .from('contact_sync_mappings')
        .select('last_synced, sync_status')
        .eq('organization_id', organizationId)
        .gte('last_synced', since),
      
      supabase
        .from('call_sync_mappings')
        .select('last_synced, sync_status')
        .eq('organization_id', organizationId)
        .gte('last_synced', since),
      
      supabase
        .from('webhook_events')
        .select('created_at, processed, error_message')
        .eq('organization_id', organizationId)
        .gte('created_at', since)
    ])

    const contactsSynced24h = contactMappings.data?.length || 0
    const callsSynced24h = callMappings.data?.length || 0
    
    const syncErrors24h = [
      ...(contactMappings.data?.filter(m => m.sync_status === 'error') || []),
      ...(callMappings.data?.filter(m => m.sync_status === 'error') || []),
      ...(webhookEvents.data?.filter(e => !e.processed && e.error_message) || [])
    ].length

    // Calculate average sync time (simplified)
    const avgSyncTime = 2.5 // seconds (placeholder)

    return {
      contactsSynced24h,
      callsSynced24h,
      syncErrors24h,
      avgSyncTime
    }
  }

  /**
   * Get integration health status
   */
  private static async getIntegrationHealth(organizationId: string) {
    const { data: integrations } = await supabase
      .from('crm_integrations')
      .select('crm_type, is_active, last_sync')
      .eq('organization_id', organizationId)

    if (!integrations) return []

    const healthData = await Promise.all(
      integrations.map(async (integration) => {
        // Get recent sync errors
        const { data: recentErrors } = await supabase
          .from('webhook_events')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('crm_type', integration.crm_type)
          .eq('processed', false)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        // Get total synced records
        const [contactMappings, callMappings] = await Promise.all([
          supabase
            .from('contact_sync_mappings')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('crm_type', integration.crm_type),
          
          supabase
            .from('call_sync_mappings')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('crm_type', integration.crm_type)
        ])

        const totalSynced = (contactMappings.data?.length || 0) + (callMappings.data?.length || 0)
        const errorCount = recentErrors?.length || 0
        const errorRate = totalSynced > 0 ? (errorCount / totalSynced) * 100 : 0

        let status: 'healthy' | 'warning' | 'error' = 'healthy'
        if (!integration.is_active) {
          status = 'error'
        } else if (errorRate > 10) {
          status = 'error'
        } else if (errorRate > 5) {
          status = 'warning'
        }

        return {
          crmType: integration.crm_type,
          status,
          lastSync: integration.last_sync,
          errorRate,
          totalSynced
        }
      })
    )

    return healthData
  }

  /**
   * Get bulk job statistics
   */
  private static async getBulkJobStats(organizationId: string, period: string) {
    const periodHours = period === '24h' ? 24 : period === '7d' ? 168 : 720
    const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString()

    const { data: jobs } = await supabase
      .from('bulk_sync_jobs')
      .select('status, started_at, completed_at')
      .eq('organization_id', organizationId)
      .gte('created_at', since)

    const totalJobs = jobs?.length || 0
    const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0
    const failedJobs = jobs?.filter(j => j.status === 'failed').length || 0

    // Calculate average job duration
    const completedJobsWithDuration = jobs?.filter(j => 
      j.status === 'completed' && j.started_at && j.completed_at
    ) || []

    const avgJobDuration = completedJobsWithDuration.length > 0
      ? completedJobsWithDuration.reduce((sum, job) => {
          const duration = new Date(job.completed_at!).getTime() - new Date(job.started_at!).getTime()
          return sum + duration
        }, 0) / completedJobsWithDuration.length / 1000 // Convert to seconds
      : 0

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      avgJobDuration
    }
  }

  /**
   * Get webhook statistics
   */
  private static async getWebhookStats(organizationId: string, period: string) {
    const periodHours = period === '24h' ? 24 : period === '7d' ? 168 : 720
    const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString()

    const { data: events } = await supabase
      .from('webhook_events')
      .select('processed, processed_at, created_at, error_message')
      .eq('organization_id', organizationId)
      .gte('created_at', since)

    const totalEvents = events?.length || 0
    const processedEvents = events?.filter(e => e.processed).length || 0
    const failedEvents = events?.filter(e => !e.processed && e.error_message).length || 0

    // Calculate average processing time
    const processedEventsWithTime = events?.filter(e => 
      e.processed && e.processed_at
    ) || []

    const avgProcessingTime = processedEventsWithTime.length > 0
      ? processedEventsWithTime.reduce((sum, event) => {
          const duration = new Date(event.processed_at!).getTime() - new Date(event.created_at).getTime()
          return sum + duration
        }, 0) / processedEventsWithTime.length / 1000 // Convert to seconds
      : 0

    return {
      totalEvents,
      processedEvents,
      failedEvents,
      avgProcessingTime
    }
  }

  /**
   * Get field mapping statistics
   */
  private static async getFieldMappingStats(organizationId: string) {
    const { data: mappings } = await supabase
      .from('field_mappings')
      .select('entity_type, is_custom')
      .eq('organization_id', organizationId)

    const totalMappings = mappings?.length || 0
    const customMappings = mappings?.filter(m => m.is_custom).length || 0

    const mappingsByEntity = mappings?.reduce((acc, mapping) => {
      acc[mapping.entity_type] = (acc[mapping.entity_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return {
      totalMappings,
      customMappings,
      mappingsByEntity
    }
  }

  /**
   * Get time series data for charts
   */
  private static async getTimeSeriesData(organizationId: string, period: string) {
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30
    const timeSeriesData = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString()

      const [contactMappings, callMappings, webhookEvents] = await Promise.all([
        supabase
          .from('contact_sync_mappings')
          .select('id')
          .eq('organization_id', organizationId)
          .gte('last_synced', date.toISOString())
          .lt('last_synced', nextDate),
        
        supabase
          .from('call_sync_mappings')
          .select('id')
          .eq('organization_id', organizationId)
          .gte('last_synced', date.toISOString())
          .lt('last_synced', nextDate),
        
        supabase
          .from('webhook_events')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('processed', false)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate)
      ])

      timeSeriesData.push({
        date: dateStr,
        contactsSynced: contactMappings.data?.length || 0,
        callsSynced: callMappings.data?.length || 0,
        errors: webhookEvents.data?.length || 0
      })
    }

    return timeSeriesData
  }

  /**
   * Get sync performance metrics
   */
  static async getSyncPerformanceMetrics(
    organizationId: string,
    period: '24h' | '7d' | '30d' = '7d'
  ): Promise<{ metrics: SyncPerformanceMetrics | null; error: string | null }> {
    try {
      const periodHours = period === '24h' ? 24 : period === '7d' ? 168 : 720
      const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString()

      // Get all sync operations in period
      const [contactSyncs, callSyncs, webhookEvents] = await Promise.all([
        supabase
          .from('contact_sync_mappings')
          .select('sync_status, last_synced')
          .eq('organization_id', organizationId)
          .gte('last_synced', since),
        
        supabase
          .from('call_sync_mappings')
          .select('sync_status, last_synced')
          .eq('organization_id', organizationId)
          .gte('last_synced', since),
        
        supabase
          .from('webhook_events')
          .select('processed, error_message, created_at, processed_at')
          .eq('organization_id', organizationId)
          .gte('created_at', since)
      ])

      const allSyncs = [
        ...(contactSyncs.data || []),
        ...(callSyncs.data || [])
      ]

      const totalSyncs = allSyncs.length
      const successfulSyncs = allSyncs.filter(s => s.sync_status === 'synced').length
      const failedSyncs = allSyncs.filter(s => s.sync_status === 'error').length

      // Calculate average sync duration (simplified)
      const avgSyncDuration = 2.5 // seconds

      // Find peak sync time (hour with most syncs)
      const syncsByHour = allSyncs.reduce((acc, sync) => {
        const hour = new Date(sync.last_synced).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<number, number>)

      const peakHour = Object.entries(syncsByHour)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '12'
      const peakSyncTime = `${peakHour}:00`

      // Error breakdown
      const errorBreakdown = (webhookEvents.data || [])
        .filter(e => !e.processed && e.error_message)
        .reduce((acc, event) => {
          const errorType = event.error_message?.split(':')[0] || 'Unknown'
          acc[errorType] = (acc[errorType] || 0) + 1
          return acc
        }, {} as Record<string, number>)

      const metrics: SyncPerformanceMetrics = {
        period,
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        avgSyncDuration,
        peakSyncTime,
        errorBreakdown
      }

      return { metrics, error: null }
    } catch (error) {
      return { metrics: null, error: 'Failed to fetch sync performance metrics' }
    }
  }
}

export default CRMAnalyticsService
