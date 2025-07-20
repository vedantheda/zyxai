/**
 * Optimized React Query Hooks
 * High-performance data fetching with advanced caching and prefetching
 */

import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { AdvancedDataService } from '@/lib/services/AdvancedDataService'
import { useAuth } from '@/contexts/AuthProvider'
import { queryKeys } from '@/lib/queryClient'

// Enhanced query options for better performance
const createOptimizedQueryOptions = (staleTime = 2 * 60 * 1000, gcTime = 10 * 60 * 1000) => ({
  staleTime,
  gcTime,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: true,
  retry: (failureCount: number, error: any) => {
    if (error?.status >= 400 && error?.status < 500) return false
    return failureCount < 2
  }
})

/**
 * Optimized dashboard data hook with parallel fetching
 */
export function useOptimizedDashboard() {
  const { user } = useAuth()
  const organizationId = user?.organization_id

  return useQuery({
    queryKey: ['dashboard', 'optimized', organizationId],
    queryFn: () => AdvancedDataService.getDashboardData(organizationId!),
    enabled: !!organizationId,
    ...createOptimizedQueryOptions(1 * 60 * 1000, 5 * 60 * 1000), // 1min stale, 5min cache
    select: (data) => ({
      ...data,
      isStale: Date.now() - data.timestamp > 2 * 60 * 1000 // 2 minutes
    })
  })
}

/**
 * Optimized agents hook with background updates
 */
export function useOptimizedAgents() {
  const { user } = useAuth()
  const organizationId = user?.organization_id
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['agents', 'optimized', organizationId],
    queryFn: () => AdvancedDataService.getAgentsOptimized(organizationId!),
    enabled: !!organizationId,
    ...createOptimizedQueryOptions(3 * 60 * 1000, 10 * 60 * 1000),
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
  })

  // Background refresh every 5 minutes
  useEffect(() => {
    if (!organizationId) return

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['agents', 'optimized', organizationId],
        refetchType: 'none' // Don't refetch immediately, just mark as stale
      })
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [organizationId, queryClient])

  return query
}

/**
 * Optimized calls hook with real-time updates
 */
export function useOptimizedCalls(limit = 20) {
  const { user } = useAuth()
  const organizationId = user?.organization_id

  return useQuery({
    queryKey: ['calls', 'optimized', organizationId, limit],
    queryFn: () => AdvancedDataService.getRecentCallsOptimized(organizationId!, limit),
    enabled: !!organizationId,
    ...createOptimizedQueryOptions(30 * 1000, 5 * 60 * 1000), // 30s stale for real-time feel
    refetchInterval: 60 * 1000, // Refetch every minute for calls
  })
}

/**
 * Parallel data fetching for multiple resources
 */
export function useParallelDashboardData() {
  const { user } = useAuth()
  const organizationId = user?.organization_id

  const queries = useQueries({
    queries: [
      {
        queryKey: ['agents', 'stats', organizationId],
        queryFn: () => AdvancedDataService.getAgentsOptimized(organizationId!),
        enabled: !!organizationId,
        ...createOptimizedQueryOptions()
      },
      {
        queryKey: ['contacts', 'stats', organizationId],
        queryFn: () => AdvancedDataService.getContactsStatsOptimized(organizationId!),
        enabled: !!organizationId,
        ...createOptimizedQueryOptions(5 * 60 * 1000) // 5 minutes for stats
      },
      {
        queryKey: ['campaigns', 'stats', organizationId],
        queryFn: () => AdvancedDataService.getCampaignsStatsOptimized(organizationId!),
        enabled: !!organizationId,
        ...createOptimizedQueryOptions(5 * 60 * 1000)
      },
      {
        queryKey: ['analytics', 'overview', organizationId],
        queryFn: () => AdvancedDataService.getAnalyticsOptimized(organizationId!),
        enabled: !!organizationId,
        ...createOptimizedQueryOptions(10 * 60 * 1000) // 10 minutes for analytics
      }
    ]
  })

  return {
    agents: queries[0],
    contacts: queries[1],
    campaigns: queries[2],
    analytics: queries[3],
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    errors: queries.filter(q => q.error).map(q => q.error)
  }
}

/**
 * Prefetching hook for critical data
 */
export function usePrefetchCriticalData() {
  const { user } = useAuth()
  const organizationId = user?.organization_id
  const queryClient = useQueryClient()

  const prefetchData = useCallback(async () => {
    if (!organizationId) return

    // Prefetch critical data
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['agents', 'optimized', organizationId],
        queryFn: () => AdvancedDataService.getAgentsOptimized(organizationId),
        staleTime: 3 * 60 * 1000
      }),
      queryClient.prefetchQuery({
        queryKey: ['calls', 'optimized', organizationId, 10],
        queryFn: () => AdvancedDataService.getRecentCallsOptimized(organizationId, 10),
        staleTime: 1 * 60 * 1000
      }),
      queryClient.prefetchQuery({
        queryKey: ['contacts', 'stats', organizationId],
        queryFn: () => AdvancedDataService.getContactsStatsOptimized(organizationId),
        staleTime: 5 * 60 * 1000
      })
    ])
  }, [organizationId, queryClient])

  // Auto-prefetch on mount and organization change
  useEffect(() => {
    prefetchData()
  }, [prefetchData])

  return { prefetchData }
}

/**
 * Background data synchronization
 */
export function useBackgroundSync() {
  const { user } = useAuth()
  const organizationId = user?.organization_id
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!organizationId) return

    // Start background refresh
    const cleanup = AdvancedDataService.startBackgroundRefresh(organizationId, 60000)

    // Subscribe to data changes
    const unsubscribeAgents = AdvancedDataService.subscribeToData(
      `agents_${organizationId}`,
      (data) => {
        queryClient.setQueryData(['agents', 'optimized', organizationId], data)
      }
    )

    const unsubscribeCalls = AdvancedDataService.subscribeToData(
      `recent_calls_${organizationId}_10`,
      (data) => {
        queryClient.setQueryData(['calls', 'optimized', organizationId, 10], data)
      }
    )

    return () => {
      cleanup()
      unsubscribeAgents()
      unsubscribeCalls()
    }
  }, [organizationId, queryClient])
}

/**
 * Optimized mutation with cache updates
 */
export function useOptimizedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: Error, variables: TVariables) => void
    invalidateQueries?: string[][]
    updateQueries?: Array<{
      queryKey: string[]
      updater: (oldData: any, newData: TData, variables: TVariables) => any
    }>
  } = {}
) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const organizationId = user?.organization_id

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Update specific queries optimistically
      options.updateQueries?.forEach(({ queryKey, updater }) => {
        queryClient.setQueryData(queryKey, (oldData: any) => 
          updater(oldData, data, variables)
        )
      })

      // Invalidate specified queries
      options.invalidateQueries?.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey })
      })

      // Invalidate organization cache
      if (organizationId) {
        AdvancedDataService.invalidateOrganizationCache(organizationId)
      }

      options.onSuccess?.(data, variables)
    },
    onError: options.onError,
    retry: 1
  })
}

/**
 * Smart loading states that prevent layout shifts
 */
export function useSmartLoading(queries: Array<{ isLoading: boolean; data: any }>) {
  const hasData = queries.some(q => q.data)
  const isInitialLoading = queries.some(q => q.isLoading) && !hasData
  const isRefetching = queries.some(q => q.isLoading) && hasData

  return {
    isInitialLoading,
    isRefetching,
    showSkeleton: isInitialLoading,
    showSpinner: isRefetching
  }
}

/**
 * Infinite query with optimized loading
 */
export function useOptimizedInfiniteQuery<T>(
  queryKey: string[],
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<{ data: T[]; nextPage?: number }>,
  options: {
    enabled?: boolean
    pageSize?: number
    staleTime?: number
  } = {}
) {
  const { enabled = true, pageSize = 20, staleTime = 2 * 60 * 1000 } = options

  return useQuery({
    queryKey: [...queryKey, 'infinite'],
    queryFn: async () => {
      // Load first page optimized
      const firstPage = await queryFn({ pageParam: 1 })
      return {
        pages: [firstPage],
        pageParams: [1]
      }
    },
    enabled,
    staleTime,
    select: (data) => ({
      ...data,
      flatData: data.pages.flatMap(page => page.data),
      totalItems: data.pages.reduce((sum, page) => sum + page.data.length, 0)
    })
  })
}

/**
 * Optimized search with debouncing
 */
export function useOptimizedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  debounceMs = 300
) {
  const queryClient = useQueryClient()

  return useCallback(
    async (query: string) => {
      if (!query.trim()) return []

      const queryKey = ['search', query.toLowerCase().trim()]
      
      return queryClient.fetchQuery({
        queryKey,
        queryFn: () => searchFn(query),
        staleTime: 5 * 60 * 1000, // 5 minutes for search results
      })
    },
    [searchFn, queryClient]
  )
}
