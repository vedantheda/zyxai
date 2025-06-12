'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSessionSync, useDataFetchReady } from './useSessionSync'
import { clearCache } from '@/lib/globalCache'
import { useRealtimeClients } from './useRealtimeData'

// Enhanced clients hook with real-time updates
export function useClients() {
  const { user } = useSessionSync()
  const {
    data: clients,
    loading,
    error,
    updateItem: updateClientOptimistic,
    insertItem: insertClientOptimistic,
    deleteItem: deleteClientOptimistic,
    refresh
  } = useRealtimeClients()

  // Legacy compatibility - keep the same interface
  const fetchClients = useCallback(() => {
    refresh()
  }, [refresh])

  const retryFetch = useCallback(() => {
    if (user?.id) {
      clearCache(`clients-${user.id}`)
    }
    refresh()
  }, [user?.id, refresh])

  // Enhanced addClient with optimistic updates
  const addClient = useCallback(async (clientData: any) => {
    return await insertClientOptimistic(clientData)
  }, [insertClientOptimistic])

  // Enhanced updateClient with optimistic updates
  const updateClient = useCallback(async (id: string, updates: any) => {
    return await updateClientOptimistic(id, updates)
  }, [updateClientOptimistic])

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    retryFetch,
    fetchClients,
    refresh
  }
}

// Hook for fetching documents
export function useDocuments() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isReady, user, loading: sessionLoading } = useDataFetchReady()

  useEffect(() => {
    // Wait for session to be ready before fetching
    if (!isReady) {
      setLoading(sessionLoading)
      return
    }

    if (!user) {
      setLoading(false)
      setDocuments([])
      setError(null)
      return
    }

    let isMounted = true

    const fetchDocuments = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from('documents')
          .select(`
            *,
            clients (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (isMounted) {
          setDocuments(data || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDocuments()

    return () => {
      isMounted = false
    }
  }, [user, isReady])

  const addDocument = async (documentData: any) => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          ...documentData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      setDocuments(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error }
    }
  }

  return { documents, loading, error, addDocument }
}

// Hook for fetching tasks
export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isReady, user, loading: sessionLoading } = useDataFetchReady()

  useEffect(() => {
    // Wait for session to be ready before fetching
    if (!isReady) {
      setLoading(sessionLoading)
      return
    }

    if (!user) {
      setLoading(false)
      setTasks([])
      setError(null)
      return
    }

    const fetchTasks = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            clients (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setTasks(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [user, isReady])

  const addTask = async (taskData: any) => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      setTasks(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error }
    }
  }

  const updateTask = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) throw error
      setTasks(prev => prev.map(task => task.id === id ? data : task))
      return { data, error: null }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An error occurred'
      return { data: null, error }
    }
  }

  return { tasks, loading, error, addTask, updateTask }
}

// Hook for dashboard statistics
export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalDocuments: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  })
  const [loading, setLoading] = useState(true)
  const { isReady, user, loading: sessionLoading } = useDataFetchReady()

  useEffect(() => {
    // Wait for session to be ready before fetching
    if (!isReady) {
      setLoading(sessionLoading)
      return
    }

    if (!user) {
      setLoading(false)
      setStats({
        totalClients: 0,
        activeClients: 0,
        totalDocuments: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
      })
      return
    }

    const fetchStats = async () => {
      try {
        setLoading(true)

        // Fetch client stats
        const { data: clientsData } = await supabase
          .from('clients')
          .select('status')
          .eq('user_id', user.id)

        // Fetch document stats
        const { data: documentsData } = await supabase
          .from('documents')
          .select('id')
          .eq('user_id', user.id)

        // Fetch task stats
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('status')
          .eq('user_id', user.id)

        const totalClients = clientsData?.length || 0
        const activeClients = clientsData?.filter(c => c.status === 'active').length || 0
        const totalDocuments = documentsData?.length || 0
        const totalTasks = tasksData?.length || 0
        const completedTasks = tasksData?.filter(t => t.status === 'completed').length || 0
        const pendingTasks = tasksData?.filter(t => t.status !== 'completed').length || 0

        setStats({
          totalClients,
          activeClients,
          totalDocuments,
          totalTasks,
          completedTasks,
          pendingTasks,
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user, isReady])

  return { stats, loading }
}
