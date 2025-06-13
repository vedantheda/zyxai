'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'

interface UseSimpleDataOptions {
  filter?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  select?: string
  enabled?: boolean
}

/**
 * Simple, consistent data fetching hook
 * Replaces all complex real-time, caching, and optimistic update hooks
 */
export function useSimpleData<T = any>(
  table: string,
  options: UseSimpleDataOptions = {}
) {
  const { user } = useAuth()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    filter = {},
    orderBy = { column: 'created_at', ascending: false },
    select = '*',
    enabled = true
  } = options

  const fetchData = useCallback(async () => {
    if (!user || !enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from(table)
        .select(select)
        .eq('user_id', user.id)

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      // Apply ordering
      query = query.order(orderBy.column, { ascending: orderBy.ascending })

      const { data: result, error: queryError } = await query

      if (queryError) throw queryError

      setData(result || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [user, table, select, JSON.stringify(filter), JSON.stringify(orderBy), enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const addItem = useCallback(async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null

    try {
      const { data: newItem, error } = await supabase
        .from(table)
        .insert({ ...item, user_id: user.id })
        .select()
        .single()

      if (error) throw error

      setData(prev => [newItem, ...prev])
      return newItem
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
      return null
    }
  }, [user, table])

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    if (!user) return null

    try {
      const { data: updatedItem, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setData(prev => prev.map(item =>
        (item as any).id === id ? updatedItem : item
      ))
      return updatedItem
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
      return null
    }
  }, [user, table])

  const deleteItem = useCallback(async (id: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setData(prev => prev.filter(item => (item as any).id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
      return false
    }
  }, [user, table])

  return {
    data,
    loading,
    error,
    refresh,
    addItem,
    updateItem,
    deleteItem
  }
}

// Specific hooks for common tables
export const useClients = () => useSimpleData('clients', {
  select: '*, pipeline_stage',
  orderBy: { column: 'created_at', ascending: false }
})

export const useDocuments = (clientId?: string) => useSimpleData('documents', {
  filter: clientId ? { client_id: clientId } : {},
  select: '*, clients(name)',
  orderBy: { column: 'created_at', ascending: false }
})

export const useTasks = (clientId?: string) => useSimpleData('tasks', {
  filter: clientId ? { client_id: clientId } : {},
  select: '*, clients(name)',
  orderBy: { column: 'created_at', ascending: false }
})

export const useMessages = () => useSimpleData('messages', {
  orderBy: { column: 'created_at', ascending: false }
})
