'use client'
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { ComplianceTrackingService, ComplianceReport, VendorInfo } from '@/lib/compliance/ComplianceTrackingService'
export interface UseComplianceOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}
export function useCompliance(options: UseComplianceOptions = {}) {
  const { user } = useAuth()
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [vendors, setVendors] = useState<VendorInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const complianceService = user ? new ComplianceTrackingService(user.id) : null
  // Load compliance data
  const loadComplianceData = useCallback(async () => {
    if (!complianceService) return
    setLoading(true)
    setError(null)
    try {
      const [reportData, vendorsData] = await Promise.all([
        complianceService.getComplianceReport(),
        complianceService.getVendorsRequiringAttention()
      ])
      setReport(reportData)
      setVendors(vendorsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load compliance data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [complianceService])
  // Add vendor
  const addVendor = useCallback(async (vendorData: any) => {
    if (!complianceService) return { success: false, error: 'Service not available' }
    try {
      const vendor = await complianceService.addVendor(vendorData)
      await loadComplianceData() // Refresh data
      return { success: true, data: vendor }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add vendor'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [complianceService, loadComplianceData])
  // Update vendor payments
  const updateVendorPayments = useCallback(async (vendorId: string, paymentAmount: number) => {
    if (!complianceService) return { success: false, error: 'Service not available' }
    try {
      await complianceService.updateVendorPayments(vendorId, paymentAmount)
      await loadComplianceData() // Refresh data
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vendor payments'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [complianceService, loadComplianceData])
  // Request W-9
  const requestW9 = useCallback(async (vendorId: string, sendEmail: boolean = true) => {
    if (!complianceService) return { success: false, error: 'Service not available' }
    try {
      await complianceService.requestW9(vendorId, sendEmail)
      await loadComplianceData() // Refresh data
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request W-9'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [complianceService, loadComplianceData])
  // Mark W-9 as received
  const markW9Received = useCallback(async (vendorId: string, documentId: string) => {
    if (!complianceService) return { success: false, error: 'Service not available' }
    try {
      await complianceService.markW9Received(vendorId, documentId)
      await loadComplianceData() // Refresh data
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark W-9 as received'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [complianceService, loadComplianceData])
  // Run compliance check
  const runComplianceCheck = useCallback(async () => {
    if (!complianceService) return { success: false, error: 'Service not available' }
    try {
      await complianceService.runComplianceCheck()
      await loadComplianceData() // Refresh data
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run compliance check'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [complianceService, loadComplianceData])
  // Auto-refresh setup
  useEffect(() => {
    if (user && options.autoRefresh !== false) {
      loadComplianceData()
    }
  }, [user, loadComplianceData, options.autoRefresh])
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(loadComplianceData, options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [loadComplianceData, options.autoRefresh, options.refreshInterval])
  return {
    // State
    report,
    vendors,
    loading,
    error,
    // Actions
    loadComplianceData,
    addVendor,
    updateVendorPayments,
    requestW9,
    markW9Received,
    runComplianceCheck,
    // Utilities
    clearError: () => setError(null),
    refreshData: loadComplianceData,
    // Service access
    complianceService
  }
}
