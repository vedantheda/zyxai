'use client'

import { clearCache } from './globalCache'

/**
 * Cache invalidation utilities for keeping data fresh
 */

// Define cache key patterns for different data types
const CACHE_PATTERNS = {
  clients: (userId: string) => `clients-${userId}`,
  documents: (userId: string, clientId?: string) => 
    clientId ? `documents-${clientId}-${userId}` : `documents-${userId}`,
  tasks: (userId: string, clientId?: string) => 
    clientId ? `tasks-${clientId}-${userId}` : `tasks-${userId}`,
  workflows: (userId: string) => `workflows-${userId}`,
  clientDetail: (clientId: string) => `client-detail-${clientId}`,
  all: (userId: string) => userId
}

/**
 * Invalidate specific cache entries when data changes
 */
export class CacheInvalidator {
  private static userId: string | null = null

  static setUserId(userId: string) {
    this.userId = userId
  }

  // Invalidate all client-related caches
  static invalidateClients() {
    if (!this.userId) return
    
    clearCache(CACHE_PATTERNS.clients(this.userId))
    // Also clear any client detail caches
    clearCache('client-detail-')
    
    console.log('🗑️ Invalidated clients cache')
  }

  // Invalidate specific client detail cache
  static invalidateClientDetail(clientId: string) {
    clearCache(CACHE_PATTERNS.clientDetail(clientId))
    console.log(`🗑️ Invalidated client detail cache for ${clientId}`)
  }

  // Invalidate documents cache
  static invalidateDocuments(clientId?: string) {
    if (!this.userId) return
    
    clearCache(CACHE_PATTERNS.documents(this.userId, clientId))
    if (clientId) {
      // Also invalidate the client detail cache since it includes document counts
      this.invalidateClientDetail(clientId)
    }
    
    console.log('🗑️ Invalidated documents cache')
  }

  // Invalidate tasks cache
  static invalidateTasks(clientId?: string) {
    if (!this.userId) return
    
    clearCache(CACHE_PATTERNS.tasks(this.userId, clientId))
    if (clientId) {
      // Also invalidate the client detail cache since it includes task counts
      this.invalidateClientDetail(clientId)
    }
    
    console.log('🗑️ Invalidated tasks cache')
  }

  // Invalidate workflows cache
  static invalidateWorkflows() {
    if (!this.userId) return
    
    clearCache(CACHE_PATTERNS.workflows(this.userId))
    console.log('🗑️ Invalidated workflows cache')
  }

  // Invalidate all user data
  static invalidateAll() {
    if (!this.userId) return
    
    clearCache(this.userId)
    console.log('🗑️ Invalidated all user cache')
  }

  // Smart invalidation based on data type and relationships
  static smartInvalidate(dataType: string, entityId?: string, clientId?: string) {
    switch (dataType) {
      case 'client':
        this.invalidateClients()
        if (entityId) {
          this.invalidateClientDetail(entityId)
        }
        break
        
      case 'document':
        this.invalidateDocuments(clientId)
        break
        
      case 'task':
        this.invalidateTasks(clientId)
        break
        
      case 'workflow':
        this.invalidateWorkflows()
        break
        
      default:
        console.warn(`Unknown data type for cache invalidation: ${dataType}`)
    }
  }
}

/**
 * Hook to automatically set up cache invalidation for the current user
 */
export const useCacheInvalidation = (userId?: string) => {
  if (userId && CacheInvalidator.userId !== userId) {
    CacheInvalidator.setUserId(userId)
  }

  return {
    invalidateClients: () => CacheInvalidator.invalidateClients(),
    invalidateDocuments: (clientId?: string) => CacheInvalidator.invalidateDocuments(clientId),
    invalidateTasks: (clientId?: string) => CacheInvalidator.invalidateTasks(clientId),
    invalidateWorkflows: () => CacheInvalidator.invalidateWorkflows(),
    invalidateAll: () => CacheInvalidator.invalidateAll(),
    smartInvalidate: (dataType: string, entityId?: string, clientId?: string) => 
      CacheInvalidator.smartInvalidate(dataType, entityId, clientId)
  }
}

/**
 * Automatic cache invalidation based on Supabase real-time events
 */
export const handleRealtimeInvalidation = (
  payload: any,
  table: string,
  userId: string
) => {
  CacheInvalidator.setUserId(userId)
  
  switch (table) {
    case 'clients':
      CacheInvalidator.invalidateClients()
      if (payload.new?.id || payload.old?.id) {
        CacheInvalidator.invalidateClientDetail(payload.new?.id || payload.old?.id)
      }
      break
      
    case 'documents':
      CacheInvalidator.invalidateDocuments(payload.new?.client_id || payload.old?.client_id)
      break
      
    case 'tasks':
      CacheInvalidator.invalidateTasks(payload.new?.client_id || payload.old?.client_id)
      break
      
    case 'workflows':
      CacheInvalidator.invalidateWorkflows()
      break
      
    default:
      console.log(`Real-time event for ${table} - no cache invalidation needed`)
  }
}

/**
 * Debounced cache invalidation to prevent excessive clearing
 */
let invalidationTimeouts: Record<string, NodeJS.Timeout> = {}

export const debouncedInvalidation = (
  key: string,
  invalidationFn: () => void,
  delay: number = 1000
) => {
  // Clear existing timeout
  if (invalidationTimeouts[key]) {
    clearTimeout(invalidationTimeouts[key])
  }
  
  // Set new timeout
  invalidationTimeouts[key] = setTimeout(() => {
    invalidationFn()
    delete invalidationTimeouts[key]
  }, delay)
}

/**
 * Preemptive cache warming for common data access patterns
 */
export const warmCache = async (userId: string) => {
  // This would be implemented to pre-fetch commonly accessed data
  // For now, just log the intent
  console.log(`🔥 Cache warming initiated for user ${userId}`)
}
