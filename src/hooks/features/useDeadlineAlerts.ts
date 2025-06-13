'use client'
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { DeadlineAlertService, AlertDashboard, TaxDeadline, EscalationWorkflow } from '@/lib/alerts/DeadlineAlertService'
export interface UseDeadlineAlertsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}
export function useDeadlineAlerts(options: UseDeadlineAlertsOptions = {}) {
  const { user } = useAuth()
  const [alertData, setAlertData] = useState<AlertDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alertService = user ? new DeadlineAlertService(user.id) : null
  // Load alert data
  const loadAlertData = useCallback(async () => {
    if (!alertService) return
    setLoading(true)
    setError(null)
    try {
      const data = await alertService.getAlertDashboard()
      setAlertData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alert data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [alertService])
  // Create tax deadline
  const createTaxDeadline = useCallback(async (deadline: Omit<TaxDeadline, 'id' | 'reminderSchedule'>) => {
    if (!alertService) return { success: false, error: 'Service not available' }
    try {
      const newDeadline = await alertService.createTaxDeadline(deadline)
      await loadAlertData() // Refresh data
      return { success: true, data: newDeadline }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tax deadline'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [alertService, loadAlertData])
  // Monitor client inactivity
  const monitorClientInactivity = useCallback(async () => {
    if (!alertService) return { success: false, error: 'Service not available' }
    try {
      const inactiveClients = await alertService.monitorClientInactivity()
      await loadAlertData() // Refresh data
      return { success: true, data: inactiveClients }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to monitor client inactivity'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [alertService, loadAlertData])
  // Run compliance checks
  const runComplianceChecks = useCallback(async () => {
    if (!alertService) return { success: false, error: 'Service not available' }
    try {
      await alertService.runComplianceChecks()
      await loadAlertData() // Refresh data
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run compliance checks'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [alertService, loadAlertData])
  // Create escalation workflow
  const createEscalationWorkflow = useCallback(async (workflow: Omit<EscalationWorkflow, 'id'>) => {
    if (!alertService) return { success: false, error: 'Service not available' }
    try {
      const newWorkflow = await alertService.createEscalationWorkflow(workflow)
      return { success: true, data: newWorkflow }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create escalation workflow'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [alertService])
  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (!alertService) return { success: false, error: 'Service not available' }
    try {
      await alertService.acknowledgeAlert(alertId)
      await loadAlertData() // Refresh data
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge alert'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [alertService, loadAlertData])
  // Resolve alert
  const resolveAlert = useCallback(async (alertId: string, resolution?: string) => {
    if (!alertService) return { success: false, error: 'Service not available' }
    try {
      await alertService.resolveAlert(alertId, resolution)
      await loadAlertData() // Refresh data
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve alert'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [alertService, loadAlertData])
  // Auto-refresh setup
  useEffect(() => {
    if (user && options.autoRefresh !== false) {
      loadAlertData()
    }
  }, [user, loadAlertData, options.autoRefresh])
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(loadAlertData, options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [loadAlertData, options.autoRefresh, options.refreshInterval])
  // Computed values
  const summary = alertData?.summary || {
    totalAlerts: 0,
    criticalAlerts: 0,
    overdueDeadlines: 0,
    inactiveClients: 0,
    complianceIssues: 0
  }
  const upcomingDeadlines = alertData?.upcomingDeadlines || []
  const overdueItems = alertData?.overdueItems || []
  const recentAlerts = alertData?.recentAlerts || []
  const escalatedItems = alertData?.escalatedItems || []
  const inactiveClients = alertData?.inactiveClients || []
  // Filter functions
  const getAlertsByType = useCallback((type: string) => {
    return recentAlerts.filter(alert => alert.type === type)
  }, [recentAlerts])
  const getAlertsBySeverity = useCallback((severity: string) => {
    return recentAlerts.filter(alert => alert.severity === severity)
  }, [recentAlerts])
  const getDeadlinesByPriority = useCallback((priority: string) => {
    return [...upcomingDeadlines, ...overdueItems].filter(deadline => deadline.priority === priority)
  }, [upcomingDeadlines, overdueItems])
  const getDeadlinesByStatus = useCallback((status: string) => {
    return [...upcomingDeadlines, ...overdueItems].filter(deadline => deadline.status === status)
  }, [upcomingDeadlines, overdueItems])
  // Alert statistics
  const alertStats = {
    totalAlerts: summary.totalAlerts,
    criticalAlerts: summary.criticalAlerts,
    acknowledgedAlerts: recentAlerts.filter(alert => alert.isAcknowledged).length,
    resolvedAlerts: recentAlerts.filter(alert => alert.isResolved).length,
    escalatedAlerts: escalatedItems.length
  }
  // Deadline statistics
  const deadlineStats = {
    totalDeadlines: upcomingDeadlines.length + overdueItems.length,
    upcomingDeadlines: upcomingDeadlines.length,
    overdueDeadlines: overdueItems.length,
    criticalDeadlines: getDeadlinesByPriority('critical').length,
    completedDeadlines: getDeadlinesByStatus('completed').length
  }
  return {
    // State
    alertData,
    loading,
    error,
    // Computed values
    summary,
    upcomingDeadlines,
    overdueItems,
    recentAlerts,
    escalatedItems,
    inactiveClients,
    alertStats,
    deadlineStats,
    // Actions
    loadAlertData,
    createTaxDeadline,
    monitorClientInactivity,
    runComplianceChecks,
    createEscalationWorkflow,
    acknowledgeAlert,
    resolveAlert,
    // Filter functions
    getAlertsByType,
    getAlertsBySeverity,
    getDeadlinesByPriority,
    getDeadlinesByStatus,
    // Utilities
    clearError: () => setError(null),
    refreshData: loadAlertData,
    // Service access
    alertService
  }
}
