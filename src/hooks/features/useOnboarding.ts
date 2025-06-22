import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
interface OnboardingSession {
  id: string
  user_id: string
  client_id?: string
  current_step: number
  completed_steps: number[]
  form_data: any
  status: 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  completed_at?: string
  created_at: string
  updated_at: string
}
export function useOnboarding() {
  const [session, setSession] = useState<OnboardingSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { addToast } = useToast()
  // Get auth token for API calls
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }
  const loadSession = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const token = await getAuthToken()
      if (!token) {
        throw new Error('No auth token available')
      }
      const response = await fetch('/api/onboarding', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format - expected JSON')
      }
      const result = await response.json()
      if (!result.success && result.error) {
        throw new Error(result.error)
      }
      setSession(result.session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session')
    } finally {
      setIsLoading(false)
    }
  }, [user])
  const saveSession = useCallback(async (sessionData: {
    currentStep: number
    completedSteps: number[]
    formData: any
  }) => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const token = await getAuthToken()
      if (!token) {
        throw new Error('No auth token available')
      }
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_session',
          data: sessionData,
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format - expected JSON')
      }
      const result = await response.json()
      if (!result.success && result.error) {
        throw new Error(result.error)
      }
      // Don't update session state to prevent infinite loop
      // setSession(result.session)
      addToast({
        type: 'success',
        title: 'Progress saved',
        description: 'Your onboarding progress has been saved successfully.',
      })
      return result.session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save session'
      setError(errorMessage)
      addToast({
        type: 'error',
        title: 'Save failed',
        description: errorMessage,
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user, addToast])
  const completeOnboarding = useCallback(async (finalData: any) => {
    if (!user || !session) return
    setIsLoading(true)
    setError(null)
    try {
      const token = await getAuthToken()
      if (!token) {
        throw new Error('No auth token available')
      }
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete_onboarding',
          data: {
            sessionId: session.id,
            finalData,
          },
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format - expected JSON')
      }
      const result = await response.json()
      if (!result.success && result.error) {
        throw new Error(result.error)
      }
      addToast({
        type: 'success',
        title: 'Onboarding completed!',
        description: 'Welcome to ZyxAI! Your client profile has been created.',
      })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete onboarding'
      setError(errorMessage)
      addToast({
        type: 'error',
        title: 'Completion failed',
        description: errorMessage,
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user, session, addToast])
  // Load session on mount
  useEffect(() => {
    if (user) {
      loadSession()
    }
  }, [user, loadSession])
  return {
    session,
    isLoading,
    error,
    loadSession,
    saveSession,
    completeOnboarding,
  }
}
