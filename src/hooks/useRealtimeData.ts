'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSessionSync } from '@/hooks/useSessionSync'
import { clearCache, setCache, getFromCache } from '@/lib/globalCache'
import { handleRealtimeInvalidation } from '@/lib/cacheInvalidation'

interface RealtimeOptions {
  table: string
  cacheKey: string
  select?: string
  filter?: string
  orderBy?: { column: string; ascending?: boolean }
  enableRealtime?: boolean
}

export function useRealtimeData<T = any>(options: RealtimeOptions) {
  const { user, isSessionReady, isAuthenticated } = useSessionSync()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const subscriptionRef = useRef<any>(null)
  const hasFetchedRef = useRef(false)

  const {
    table,
    cacheKey,
    select = '*',
    filter,
    orderBy,
    enableRealtime = true
  } = options

  // Generate full cache key with user ID
  const fullCacheKey = user?.id ? `${cacheKey}-${user.id}` : cacheKey

  const fetchData = useCallback(async (useCache = true) => {
    if (!isSessionReady || !isAuthenticated || !user?.id) {
      setData([])
      setLoading(false)
      hasFetchedRef.current = false
      return
    }

    // Prevent duplicate fetches
    if (hasFetchedRef.current && useCache) {
      return
    }

    // Check cache first if enabled
    if (useCache) {
      const cached = getFromCache(fullCacheKey)
      if (cached) {
        setData(cached)
        setLoading(false)
        hasFetchedRef.current = true
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from(table)
        .select(select)
        .eq('user_id', user.id)

      if (filter) {
        query = query.filter(...filter.split(','))
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false })
      }

      const { data: fetchedData, error: fetchError } = await query

      if (fetchError) throw fetchError

      const result = fetchedData || []
      setData(result)
      setCache(fullCacheKey, result)
      setError(null)
      hasFetchedRef.current = true
    } catch (err: any) {
      console.error(`Error fetching ${table}:`, err)
      setError(err.message || `Failed to load ${table}`)
    } finally {
      setLoading(false)
    }
  }, [isSessionReady, isAuthenticated, user?.id, table, select, filter, orderBy, fullCacheKey])

  // Optimistic update function
  const optimisticUpdate = useCallback((
    id: string,
    updates: Partial<T>,
    operation: 'update' | 'insert' | 'delete' = 'update'
  ) => {
    setData(prevData => {
      let newData = [...prevData]

      switch (operation) {
        case 'update':
          newData = newData.map(item =>
            (item as any).id === id ? { ...item, ...updates } : item
          )
          break
        case 'insert':
          newData.unshift({ id, ...updates } as T)
          break
        case 'delete':
          newData = newData.filter(item => (item as any).id !== id)
          break
      }

      // Update cache immediately
      setCache(fullCacheKey, newData)
      return newData
    })
  }, [fullCacheKey])

  // Database update with optimistic UI
  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    if (!isAuthenticated || !user?.id) return { error: 'Not authenticated' }

    // Apply optimistic update immediately
    optimisticUpdate(id, updates, 'update')

    try {
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        // Revert optimistic update on error
        await fetchData(false)
        throw error
      }

      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }, [isAuthenticated, user?.id, table, optimisticUpdate, fetchData])

  // Insert new item with optimistic UI
  const insertItem = useCallback(async (newItem: Omit<T, 'id'>) => {
    if (!isAuthenticated || !user?.id) return { error: 'Not authenticated' }

    const tempId = `temp-${Date.now()}`

    // Apply optimistic update immediately
    optimisticUpdate(tempId, newItem as Partial<T>, 'insert')

    try {
      const { data: insertedData, error } = await supabase
        .from(table)
        .insert({ ...newItem, user_id: user.id })
        .select()
        .single()

      if (error) {
        // Revert optimistic update on error
        optimisticUpdate(tempId, {}, 'delete')
        throw error
      }

      // Replace temp item with real data
      setData(prevData =>
        prevData.map(item =>
          (item as any).id === tempId ? insertedData : item
        )
      )

      return { error: null, data: insertedData }
    } catch (err: any) {
      return { error: err.message }
    }
  }, [isAuthenticated, user?.id, table, optimisticUpdate])

  // Delete item with optimistic UI
  const deleteItem = useCallback(async (id: string) => {
    if (!isAuthenticated || !user?.id) return { error: 'Not authenticated' }

    // Store original item for potential revert
    const originalItem = data.find(item => (item as any).id === id)

    // Apply optimistic update immediately
    optimisticUpdate(id, {}, 'delete')

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        // Revert optimistic update on error
        if (originalItem) {
          optimisticUpdate(id, originalItem as Partial<T>, 'insert')
        }
        throw error
      }

      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }, [isAuthenticated, user?.id, table, data, optimisticUpdate])

  // Refresh data and clear cache
  const refresh = useCallback(() => {
    clearCache(fullCacheKey)
    hasFetchedRef.current = false
    fetchData(false)
  }, [fullCacheKey, fetchData])

  // Set up real-time subscription
  useEffect(() => {
    if (!isSessionReady || !isAuthenticated || !user?.id || !enableRealtime) return

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log(`Real-time ${table} change:`, payload)

          // Handle cache invalidation
          handleRealtimeInvalidation(payload, table, user.id)

          // Handle different event types
          switch (payload.eventType) {
            case 'INSERT':
              setData(prevData => [payload.new as T, ...prevData])
              break
            case 'UPDATE':
              setData(prevData =>
                prevData.map(item =>
                  (item as any).id === payload.new.id ? payload.new as T : item
                )
              )
              break
            case 'DELETE':
              setData(prevData =>
                prevData.filter(item => (item as any).id !== payload.old.id)
              )
              break
          }

          // Update cache with new data
          setData(currentData => {
            setCache(fullCacheKey, currentData)
            return currentData
          })
        }
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [isSessionReady, isAuthenticated, user?.id, table, enableRealtime, fullCacheKey, data])

  // Initial data fetch - only when session is ready and authenticated
  useEffect(() => {
    if (isSessionReady && isAuthenticated && user?.id && !hasFetchedRef.current) {
      fetchData()
    }
  }, [isSessionReady, isAuthenticated, user?.id, fetchData])

  // Reset fetch flag when user changes
  useEffect(() => {
    if (!user?.id) {
      hasFetchedRef.current = false
    }
  }, [user?.id])

  return {
    data,
    loading,
    error,
    refresh,
    updateItem,
    insertItem,
    deleteItem,
    optimisticUpdate
  }
}

// Specialized hooks for common tables
export const useRealtimeClients = () =>
  useRealtimeData({
    table: 'clients',
    cacheKey: 'clients',
    select: '*, pipeline_stage',
    orderBy: { column: 'created_at', ascending: false }
  })

export const useRealtimeDocuments = (clientId?: string) =>
  useRealtimeData({
    table: 'documents',
    cacheKey: clientId ? `documents-${clientId}` : 'documents',
    select: '*, clients(name)',
    filter: clientId ? `client_id,eq,${clientId}` : undefined,
    orderBy: { column: 'created_at', ascending: false }
  })

export const useRealtimeTasks = (clientId?: string) =>
  useRealtimeData({
    table: 'tasks',
    cacheKey: clientId ? `tasks-${clientId}` : 'tasks',
    select: '*, clients(name)',
    filter: clientId ? `client_id,eq,${clientId}` : undefined,
    orderBy: { column: 'created_at', ascending: false }
  })
