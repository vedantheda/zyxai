'use client'

// Optimized global cache system with memory management
class GlobalCache {
  private cache = new Map<string, { data: any; time: number; hits: number }>()
  private readonly CACHE_TIME = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_ENTRIES = 100
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Auto-cleanup expired entries every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 2 * 60 * 1000)
  }

  get(key: string) {
    const entry = this.cache.get(key)
    if (entry && Date.now() - entry.time < this.CACHE_TIME) {
      entry.hits++
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 CACHE HIT: ${key} (${entry.hits} hits)`)
      }
      return entry.data
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(key)
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`💥 CACHE MISS: ${key}`)
    }
    return null
  }

  set(key: string, data: any) {
    // Prevent cache overflow
    if (this.cache.size >= this.MAX_ENTRIES) {
      this.evictLeastUsed()
    }

    this.cache.set(key, { data, time: Date.now(), hits: 0 })

    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 CACHED: ${key} (${this.cache.size}/${this.MAX_ENTRIES})`)
    }
  }

  clear(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  private cleanup() {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.time >= this.CACHE_TIME) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key))

    if (expiredKeys.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`🧹 CACHE CLEANUP: Removed ${expiredKeys.length} expired entries`)
    }
  }

  private evictLeastUsed() {
    let leastUsedKey = ''
    let leastHits = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ CACHE EVICTED: ${leastUsedKey} (${leastHits} hits)`)
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// Create singleton instance
const globalCacheInstance = new GlobalCache()

// Export convenience functions
export const getFromCache = (key: string) => globalCacheInstance.get(key)
export const setCache = (key: string, data: any) => globalCacheInstance.set(key, data)
export const clearCache = (pattern?: string) => globalCacheInstance.clear(pattern)

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalCacheInstance.destroy()
  })
}

// Hook for cached data fetching
export const useCachedFetch = (key: string, fetchFn: () => Promise<any>) => {
  const cached = getFromCache(key)
  if (cached) {
    return Promise.resolve(cached)
  }

  return fetchFn().then(data => {
    setCache(key, data)
    return data
  })
}
