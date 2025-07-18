'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { OptimizedDashboardService } from '@/lib/services/OptimizedDashboardService'
import { useAuditLogger } from '@/hooks/useAuditLogger'
import { supabase } from '@/lib/supabase'

interface DashboardState {
  data: any | null
  loading: boolean
  error: string | null
  fromCache: boolean
  lastUpdated: Date | null
}

/**
 * Optimized dashboard hook with caching and performance monitoring
 */
export function useOptimizedDashboard(timeRange: '7d' | '30d' | '90d' = '30d') {
  const { user } = useAuth()
  const { logPageAccess, logFeatureUsage } = useAuditLogger()
  
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: true,
    error: null,
    fromCache: false,
    lastUpdated: null
  })

  const loadDashboard = useCallback(async (forceRefresh = false) => {
    if (!user?.organization_id) {
      setState(prev => ({ ...prev, loading: false, error: 'No organization found' }))
      return
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Clear cache if force refresh
      if (forceRefresh) {
        OptimizedDashboardService.clearCache(user.organization_id)
      }

      const startTime = performance.now()
      const { data, error, fromCache } = await OptimizedDashboardService.getDashboardData(
        user.organization_id,
        timeRange
      )
      const loadTime = performance.now() - startTime

      if (error) {
        setState(prev => ({ ...prev, loading: false, error }))
        return
      }

      setState({
        data,
        loading: false,
        error: null,
        fromCache,
        lastUpdated: new Date()
      })

      // Log performance metrics
      console.log(`📊 Dashboard loaded in ${loadTime.toFixed(2)}ms ${fromCache ? '(cached)' : '(fresh)'}`)

      // Log page access for audit
      await logPageAccess('/dashboard', {
        timeRange,
        loadTime: Math.round(loadTime),
        fromCache
      })

      // Log slow loading for monitoring
      if (loadTime > 2000 && !fromCache) {
        await logFeatureUsage('dashboard', 'slow_load', {
          loadTime: Math.round(loadTime),
          timeRange,
          organizationId: user.organization_id
        })
      }

    } catch (err: any) {
      console.error('Dashboard loading error:', err)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || 'Failed to load dashboard' 
      }))
    }
  }, [user?.organization_id, timeRange, logPageAccess, logFeatureUsage])

  // Load dashboard on mount and when dependencies change
  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // Preload dashboard data for better UX
  useEffect(() => {
    if (user?.organization_id) {
      OptimizedDashboardService.preloadDashboard(user.organization_id)
    }
  }, [user?.organization_id])

  const refresh = useCallback(() => {
    loadDashboard(true)
  }, [loadDashboard])

  return {
    ...state,
    refresh,
    isStale: state.lastUpdated && (Date.now() - state.lastUpdated.getTime()) > 5 * 60 * 1000 // 5 minutes
  }
}

/**
 * Hook for dashboard performance monitoring
 */
export function useDashboardPerformance() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    averageLoadTime: 0
  })

  const recordLoadTime = useCallback((time: number, fromCache: boolean) => {
    setMetrics(prev => ({
      ...prev,
      loadTime: time,
      cacheHitRate: fromCache ? prev.cacheHitRate + 1 : prev.cacheHitRate,
      averageLoadTime: (prev.averageLoadTime + time) / 2
    }))
  }, [])

  const recordError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      errorRate: prev.errorRate + 1
    }))
  }, [])

  return {
    metrics,
    recordLoadTime,
    recordError
  }
}

/**
 * Hook for dashboard real-time updates
 */
export function useDashboardRealtime(organizationId: string) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (!organizationId) return

    // Set up real-time subscription for dashboard updates
    const channel = supabase
      .channel(`dashboard_${organizationId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'calls',
          filter: `organization_id=eq.${organizationId}`
        }, 
        () => {
          setLastUpdate(new Date())
          // Clear cache to force refresh
          OptimizedDashboardService.clearCache(organizationId)
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ai_agents',
          filter: `organization_id=eq.${organizationId}`
        }, 
        () => {
          setLastUpdate(new Date())
          OptimizedDashboardService.clearCache(organizationId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  return { lastUpdate }
}
