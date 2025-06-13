'use client'
import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { EmailManagementService, EmailMessage, EmailRoutingRule } from '@/lib/email/EmailManagementService'
export interface UseEmailManagementOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}
export function useEmailManagement(options: UseEmailManagementOptions = {}) {
  const { user } = useAuth()
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [routingRules, setRoutingRules] = useState<EmailRoutingRule[]>([])
  const [emailSummary, setEmailSummary] = useState<any>(null)
  const [teamPerformance, setTeamPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailService = user ? new EmailManagementService(user.id) : null
  // Load email data
  const loadEmailData = useCallback(async () => {
    if (!emailService) return
    setLoading(true)
    setError(null)
    try {
      const [summary, performance] = await Promise.all([
        emailService.getEmailSummary('today'),
        emailService.getTeamPerformance()
      ])
      setEmailSummary(summary)
      setTeamPerformance(performance)
      // In a real implementation, this would fetch actual emails
      // For now, we'll use mock data
      setEmails([])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load email data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [emailService])
  // Process incoming email
  const processEmail = useCallback(async (emailData: Partial<EmailMessage>) => {
    if (!emailService) return { success: false, error: 'Service not available' }
    try {
      const processedEmail = await emailService.processIncomingEmail(emailData)
      setEmails(prev => [processedEmail, ...prev])
      return { success: true, data: processedEmail }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process email'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [emailService])
  // Route email
  const routeEmail = useCallback(async (emailId: string, teamMemberId?: string) => {
    if (!emailService) return { success: false, error: 'Service not available' }
    try {
      await emailService.routeEmail(emailId, teamMemberId)
      await loadEmailData() // Refresh data
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to route email'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [emailService, loadEmailData])
  // Analyze email with AI
  const analyzeEmail = useCallback(async (body: string, subject: string) => {
    if (!emailService) return null
    try {
      return await emailService.analyzeEmailWithAI(body, subject)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze email'
      setError(errorMessage)
      return null
    }
  }, [emailService])
  // Create routing rule
  const createRoutingRule = useCallback(async (rule: Omit<EmailRoutingRule, 'id'>) => {
    if (!emailService) return { success: false, error: 'Service not available' }
    try {
      const newRule = await emailService.createRoutingRule(rule)
      setRoutingRules(prev => [...prev, newRule])
      return { success: true, data: newRule }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create routing rule'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [emailService])
  // Get email summary for different timeframes
  const getEmailSummary = useCallback(async (timeframe: 'today' | 'week' | 'month' = 'today') => {
    if (!emailService) return null
    try {
      return await emailService.getEmailSummary(timeframe)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get email summary'
      setError(errorMessage)
      return null
    }
  }, [emailService])
  // Auto-refresh setup
  useEffect(() => {
    if (user && options.autoRefresh !== false) {
      loadEmailData()
    }
  }, [user, loadEmailData, options.autoRefresh])
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(loadEmailData, options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [loadEmailData, options.autoRefresh, options.refreshInterval])
  // Email filtering and search
  const filterEmails = useCallback((
    searchTerm: string = '',
    category: string = 'all',
    priority: string = 'all',
    isRead?: boolean
  ) => {
    return emails.filter(email => {
      const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           email.body.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = category === 'all' || email.aiCategory === category
      const matchesPriority = priority === 'all' || email.aiPriority === priority
      const matchesReadStatus = isRead === undefined || email.isRead === isRead
      return matchesSearch && matchesCategory && matchesPriority && matchesReadStatus
    })
  }, [emails])
  // Email actions
  const markAsRead = useCallback((emailId: string) => {
    setEmails(prev => prev.map(email =>
      email.id === emailId ? { ...email, isRead: true } : email
    ))
  }, [])
  const markAsImportant = useCallback((emailId: string, isImportant: boolean) => {
    setEmails(prev => prev.map(email =>
      email.id === emailId ? { ...email, isImportant } : email
    ))
  }, [])
  const archiveEmail = useCallback((emailId: string) => {
    setEmails(prev => prev.filter(email => email.id !== emailId))
  }, [])
  // Computed values
  const unreadCount = emails.filter(email => !email.isRead).length
  const urgentCount = emails.filter(email => email.aiPriority === 'urgent').length
  const todayCount = emails.filter(email => {
    const today = new Date()
    const emailDate = email.receivedAt
    return emailDate.toDateString() === today.toDateString()
  }).length
  return {
    // State
    emails,
    routingRules,
    emailSummary,
    teamPerformance,
    loading,
    error,
    // Computed values
    unreadCount,
    urgentCount,
    todayCount,
    // Actions
    loadEmailData,
    processEmail,
    routeEmail,
    analyzeEmail,
    createRoutingRule,
    getEmailSummary,
    filterEmails,
    markAsRead,
    markAsImportant,
    archiveEmail,
    // Utilities
    clearError: () => setError(null),
    refreshData: loadEmailData,
    // Service access
    emailService
  }
}
