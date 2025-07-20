/**
 * React Query Configuration
 * Centralized configuration for TanStack Query (React Query)
 */

import { QueryClient } from '@tanstack/react-query'

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      
      // Cache time: How long data stays in cache when unused (10 minutes)
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Disable refetch on window focus to prevent infinite loading on tab switch
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
})

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  
  // Organizations
  organizations: {
    all: ['organizations'] as const,
    detail: (id: string) => ['organizations', id] as const,
    members: (id: string) => ['organizations', id, 'members'] as const,
  },
  
  // Agents
  agents: {
    all: ['agents'] as const,
    detail: (id: string) => ['agents', id] as const,
    byOrganization: (orgId: string) => ['agents', 'organization', orgId] as const,
  },
  
  // Calls
  calls: {
    all: ['calls'] as const,
    detail: (id: string) => ['calls', id] as const,
    byAgent: (agentId: string) => ['calls', 'agent', agentId] as const,
    active: ['calls', 'active'] as const,
  },
  
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    detail: (id: string) => ['contacts', id] as const,
    byList: (listId: string) => ['contacts', 'list', listId] as const,
  },
  
  // Campaigns
  campaigns: {
    all: ['campaigns'] as const,
    detail: (id: string) => ['campaigns', id] as const,
    byOrganization: (orgId: string) => ['campaigns', 'organization', orgId] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
  },
  
  // Analytics
  analytics: {
    overview: (timeRange: string) => ['analytics', 'overview', timeRange] as const,
    calls: (timeRange: string) => ['analytics', 'calls', timeRange] as const,
    leads: (timeRange: string) => ['analytics', 'leads', timeRange] as const,
    revenue: (timeRange: string) => ['analytics', 'revenue', timeRange] as const,
  },
  
  // Billing
  billing: {
    overview: ['billing', 'overview'] as const,
    usage: ['billing', 'usage'] as const,
    invoices: ['billing', 'invoices'] as const,
    subscription: ['billing', 'subscription'] as const,
  },
}

// Mutation keys for consistent mutation management
export const mutationKeys = {
  // Auth
  auth: {
    signIn: ['auth', 'signIn'] as const,
    signOut: ['auth', 'signOut'] as const,
    signUp: ['auth', 'signUp'] as const,
  },
  
  // Agents
  agents: {
    create: ['agents', 'create'] as const,
    update: ['agents', 'update'] as const,
    delete: ['agents', 'delete'] as const,
  },
  
  // Calls
  calls: {
    create: ['calls', 'create'] as const,
    update: ['calls', 'update'] as const,
    end: ['calls', 'end'] as const,
  },
  
  // Contacts
  contacts: {
    create: ['contacts', 'create'] as const,
    update: ['contacts', 'update'] as const,
    delete: ['contacts', 'delete'] as const,
    import: ['contacts', 'import'] as const,
  },
  
  // Campaigns
  campaigns: {
    create: ['campaigns', 'create'] as const,
    update: ['campaigns', 'update'] as const,
    delete: ['campaigns', 'delete'] as const,
    start: ['campaigns', 'start'] as const,
    pause: ['campaigns', 'pause'] as const,
  },
  
  // Notifications
  notifications: {
    markRead: ['notifications', 'markRead'] as const,
    markAllRead: ['notifications', 'markAllRead'] as const,
    delete: ['notifications', 'delete'] as const,
  },
}

// Helper function to invalidate related queries
export const invalidateQueries = {
  // Invalidate all agent-related queries
  agents: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.agents.all })
  },
  
  // Invalidate all call-related queries
  calls: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.calls.all })
  },
  
  // Invalidate all contact-related queries
  contacts: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
  },
  
  // Invalidate all campaign-related queries
  campaigns: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
  },
  
  // Invalidate all notification-related queries
  notifications: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
  },
  
  // Invalidate analytics queries
  analytics: () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
  },
  
  // Invalidate billing queries
  billing: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.billing.overview })
  },
}

// Prefetch helpers for common data
export const prefetchQueries = {
  // Prefetch user's agents
  agents: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.agents.all,
      queryFn: async () => {
        // This would be replaced with actual API call
        return []
      },
    })
  },
  
  // Prefetch notifications
  notifications: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.notifications.all,
      queryFn: async () => {
        // This would be replaced with actual API call
        return []
      },
    })
  },
}
