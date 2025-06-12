'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { KPIDashboardService, KPIDashboard } from '@/lib/analytics/KPIDashboardService'

export interface UseKPIDashboardOptions {
  timeframe?: 'month' | 'quarter' | 'year'
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useKPIDashboard(options: UseKPIDashboardOptions = {}) {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<KPIDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>(options.timeframe || 'month')

  const kpiService = user ? new KPIDashboardService(user.id) : null

  // Load dashboard data
  const loadDashboardData = useCallback(async (selectedTimeframe?: 'month' | 'quarter' | 'year') => {
    if (!kpiService) return

    setLoading(true)
    setError(null)

    try {
      const data = await kpiService.getDashboardData(selectedTimeframe || timeframe)
      setDashboardData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load KPI data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [kpiService, timeframe])

  // Change timeframe
  const changeTimeframe = useCallback(async (newTimeframe: 'month' | 'quarter' | 'year') => {
    setTimeframe(newTimeframe)
    await loadDashboardData(newTimeframe)
  }, [loadDashboardData])

  // Get revenue analytics
  const getRevenueAnalytics = useCallback(async (selectedTimeframe?: string) => {
    if (!kpiService) return null

    try {
      return await kpiService.getRevenueAnalytics(selectedTimeframe || timeframe)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get revenue analytics'
      setError(errorMessage)
      return null
    }
  }, [kpiService, timeframe])

  // Get client metrics
  const getClientMetrics = useCallback(async (selectedTimeframe?: string) => {
    if (!kpiService) return []

    try {
      return await kpiService.getClientMetrics(selectedTimeframe || timeframe)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get client metrics'
      setError(errorMessage)
      return []
    }
  }, [kpiService, timeframe])

  // Get partner metrics
  const getPartnerMetrics = useCallback(async (selectedTimeframe?: string) => {
    if (!kpiService) return []

    try {
      return await kpiService.getPartnerMetrics(selectedTimeframe || timeframe)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get partner metrics'
      setError(errorMessage)
      return []
    }
  }, [kpiService, timeframe])

  // Get workload metrics
  const getWorkloadMetrics = useCallback(async (selectedTimeframe?: string) => {
    if (!kpiService) return null

    try {
      return await kpiService.getWorkloadMetrics(selectedTimeframe || timeframe)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get workload metrics'
      setError(errorMessage)
      return null
    }
  }, [kpiService, timeframe])

  // Get profitability analysis
  const getProfitabilityAnalysis = useCallback(async (selectedTimeframe?: string) => {
    if (!kpiService) return null

    try {
      return await kpiService.getProfitabilityAnalysis(selectedTimeframe || timeframe)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get profitability analysis'
      setError(errorMessage)
      return null
    }
  }, [kpiService, timeframe])

  // Auto-refresh setup
  useEffect(() => {
    if (user && options.autoRefresh !== false) {
      loadDashboardData()
    }
  }, [user, loadDashboardData, options.autoRefresh])

  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(() => loadDashboardData(), options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [loadDashboardData, options.autoRefresh, options.refreshInterval])

  // Computed values
  const summary = dashboardData ? {
    totalRevenue: dashboardData.overview.totalRevenue,
    totalClients: dashboardData.overview.totalClients,
    averageRevenuePerClient: dashboardData.overview.averageRevenuePerClient,
    profitMargin: dashboardData.overview.profitMargin,
    clientSatisfaction: dashboardData.overview.clientSatisfaction,
    utilizationRate: dashboardData.overview.utilizationRate,
    revenueGrowth: dashboardData.trends.revenueGrowth,
    clientGrowth: dashboardData.trends.clientGrowth
  } : null

  const alerts = dashboardData?.alerts || []
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical')

  return {
    // State
    dashboardData,
    loading,
    error,
    timeframe,
    summary,
    alerts,
    criticalAlerts,

    // Actions
    loadDashboardData,
    changeTimeframe,
    getRevenueAnalytics,
    getClientMetrics,
    getPartnerMetrics,
    getWorkloadMetrics,
    getProfitabilityAnalysis,

    // Utilities
    clearError: () => setError(null),
    refreshData: loadDashboardData,

    // Service access
    kpiService
  }
}
