import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'
interface UserClient {
  id: string
  name: string
  email: string
  phone: string
  type: string
  status: string
  priority: string
  progress: number
  documents_count: number
  last_activity: string
  created_at: string
  updated_at: string
  organization_name?: string
}
interface OnboardingStatus {
  isCompleted: boolean
  completionDate?: string
  currentStep?: number
  totalSteps: number
  progressPercentage: number
  clientId?: string
}
interface UserDashboardData {
  client: UserClient | null
  onboardingStatus: OnboardingStatus
  recentActivity: any[]
  tasks: any[]
  documents: any[]
  stats: {
    documentsUploaded: number
    tasksCompleted: number
    progressPercentage: number
    estimatedRefund: string
    daysToDeadline: number
  }
}
export function useUserDashboard() {
  const [data, setData] = useState<UserDashboardData>({
    client: null,
    onboardingStatus: {
      isCompleted: false,
      totalSteps: 8,
      progressPercentage: 0,
    },
    recentActivity: [],
    tasks: [],
    documents: [],
    stats: {
      documentsUploaded: 0,
      tasksCompleted: 0,
      progressPercentage: 0,
      estimatedRefund: '$0',
      daysToDeadline: 45,
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const isAuthenticated = !!user
  const { isReady, user: readyUser, loading: sessionLoading } = useDataFetchReady()
  const isFetchingRef = useRef(false)
  const lastFetchedUserIdRef = useRef<string | null>(null)
  const lastFetchTimeRef = useRef<number>(0)
  const fetchUserDashboardData = useCallback(async () => {
    // Wait for session to be ready before fetching
    if (!isReady) {
      setLoading(sessionLoading)
      return
    }
    if (!user?.id || isFetchingRef.current) {
      return
    }
    // Prevent refetching the same user's data within 5 seconds
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTimeRef.current
    const isSameUser = lastFetchedUserIdRef.current === user.id
    if (isSameUser && timeSinceLastFetch < 5000) {
      return
    }
    isFetchingRef.current = true
    lastFetchedUserIdRef.current = user.id
    lastFetchTimeRef.current = now
    setLoading(true)
    setError(null)
    try {
      // Fetch user's client record (if onboarding completed)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      // Fetch onboarding session status
      const { data: sessionData, error: sessionError } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      // Fetch user's documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      // Fetch user's tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      // Calculate onboarding status
      const onboardingStatus: OnboardingStatus = {
        isCompleted: sessionData?.status === 'completed',
        completionDate: sessionData?.completed_at,
        currentStep: sessionData?.current_step || 0,
        totalSteps: 8,
        progressPercentage: sessionData?.status === 'completed'
          ? 100
          : Math.round(((sessionData?.current_step || 0) / 8) * 100),
        clientId: sessionData?.client_id,
      }
      // Generate recent activity
      const recentActivity = []
      if (clientData && !clientError) {
        recentActivity.push({
          action: 'Client profile created',
          time: formatTimeAgo(clientData.created_at),
          status: 'completed',
          icon: 'user'
        })
      }
      if (sessionData?.status === 'completed') {
        recentActivity.push({
          action: 'Onboarding completed',
          time: formatTimeAgo(sessionData.completed_at),
          status: 'completed',
          icon: 'check'
        })
      }
      if (documentsData && documentsData.length > 0) {
        recentActivity.push({
          action: `${documentsData.length} documents uploaded`,
          time: formatTimeAgo(documentsData[0].created_at),
          status: 'info',
          icon: 'file'
        })
      }
      // Calculate stats
      const stats = {
        documentsUploaded: documentsData?.length || 0,
        tasksCompleted: tasksData?.filter(task => task.status === 'completed').length || 0,
        progressPercentage: onboardingStatus.progressPercentage,
        estimatedRefund: calculateEstimatedRefund(clientData, sessionData),
        daysToDeadline: calculateDaysToDeadline(),
      }
      // Generate tasks based on onboarding status
      const generatedTasks = generateUserTasks(onboardingStatus, clientData, documentsData || [])
      setData({
        client: clientData && !clientError ? clientData : null,
        onboardingStatus,
        recentActivity: recentActivity.slice(0, 5),
        tasks: [...generatedTasks, ...(tasksData || [])],
        documents: documentsData || [],
        stats,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [user?.id, isReady, sessionLoading])
  useEffect(() => {
    if (isReady && user?.id) {
      fetchUserDashboardData()
    }
  }, [fetchUserDashboardData, user?.id, isReady])
  return {
    data,
    loading,
    error,
    refetch: fetchUserDashboardData,
  }
}
// Helper functions
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours} hours ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} days ago`
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks} weeks ago`
}
function calculateEstimatedRefund(clientData: any, sessionData: any): string {
  // Simple estimation based on form data
  if (!sessionData?.form_data) return '$0'
  const basicInfo = sessionData.form_data['basic-info'] || {}
  const incomeInfo = sessionData.form_data['income-sources'] || {}
  // Very basic calculation for demo purposes
  let estimatedRefund = 1500 // Base refund
  if (incomeInfo.w2Income && incomeInfo.w2Income < 50000) {
    estimatedRefund += 500 // Lower income bonus
  }
  if (sessionData.form_data['dependents']?.dependents?.length > 0) {
    estimatedRefund += sessionData.form_data['dependents'].dependents.length * 1000 // Child tax credit
  }
  return `$${estimatedRefund.toLocaleString()}`
}
function calculateDaysToDeadline(): number {
  const deadline = new Date('2024-04-15')
  const now = new Date()
  const diffInTime = deadline.getTime() - now.getTime()
  const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24))
  return Math.max(0, diffInDays)
}
function generateUserTasks(onboardingStatus: OnboardingStatus, clientData: any, documentsData: any[]): any[] {
  const tasks = []
  if (!onboardingStatus.isCompleted) {
    tasks.push({
      id: 'complete-onboarding',
      title: 'Complete your tax information setup',
      status: 'pending',
      priority: 'high',
      type: 'onboarding'
    })
  }
  if (onboardingStatus.isCompleted && (!documentsData || documentsData.length === 0)) {
    tasks.push({
      id: 'upload-documents',
      title: 'Upload your tax documents',
      status: 'pending',
      priority: 'high',
      type: 'documents'
    })
  }
  if (documentsData && documentsData.length > 0 && documentsData.length < 3) {
    tasks.push({
      id: 'upload-more-documents',
      title: 'Upload remaining tax documents',
      status: 'pending',
      priority: 'medium',
      type: 'documents'
    })
  }
  return tasks
}
