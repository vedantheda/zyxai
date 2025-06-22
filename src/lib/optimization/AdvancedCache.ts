/**
 * Advanced Caching System for ZyxAI
 * Multi-layer caching with TTL, LRU eviction, and persistence
 */

interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  size: number
}

interface CacheOptions {
  maxSize?: number // Maximum number of entries
  maxMemory?: number // Maximum memory usage in bytes
  defaultTTL?: number // Default TTL in milliseconds
  persistToDisk?: boolean // Persist to localStorage
  compressionEnabled?: boolean // Enable compression for large values
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  totalSize: number
  memoryUsage: number
  hitRate: number
}

export class AdvancedCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    memoryUsage: 0,
    hitRate: 0
  }

  private readonly options: Required<CacheOptions>
  private readonly storageKey: string

  constructor(
    name: string,
    options: CacheOptions = {}
  ) {
    this.options = {
      maxSize: 1000,
      maxMemory: 50 * 1024 * 1024, // 50MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      persistToDisk: false,
      compressionEnabled: true,
      ...options
    }

    this.storageKey = `zyxai_cache_${name}`

    // Load from localStorage if persistence is enabled
    if (this.options.persistToDisk && typeof window !== 'undefined') {
      this.loadFromStorage()
    }

    // Set up periodic cleanup
    this.startCleanupInterval()
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.evictions++
      this.updateStats()
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.stats.hits++
    this.updateHitRate()

    return entry.value
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now()
    const entryTTL = ttl || this.options.defaultTTL
    const size = this.calculateSize(value)

    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 1,
      lastAccessed: now,
      size
    }

    // Check if we need to evict entries
    this.evictIfNecessary(size)

    // Set the entry
    this.cache.set(key, entry)
    this.updateStats()

    // Persist to storage if enabled
    if (this.options.persistToDisk) {
      this.saveToStorage()
    }
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.updateStats()
      if (this.options.persistToDisk) {
        this.saveToStorage()
      }
    }
    return deleted
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.evictions++
      this.updateStats()
      return false
    }

    return true
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      memoryUsage: 0,
      hitRate: 0
    }

    if (this.options.persistToDisk && typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Memoize a function with caching
   */
  memoize<Args extends any[], Return>(
    fn: (...args: Args) => Return,
    keyGenerator?: (...args: Args) => string,
    ttl?: number
  ): (...args: Args) => Return {
    return (...args: Args): Return => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      // Check cache first
      const cached = this.get(key)
      if (cached !== null) {
        return cached as Return
      }

      // Execute function and cache result
      const result = fn(...args)
      this.set(key, result as T, ttl)
      return result
    }
  }

  /**
   * Memoize an async function with caching
   */
  memoizeAsync<Args extends any[], Return>(
    fn: (...args: Args) => Promise<Return>,
    keyGenerator?: (...args: Args) => string,
    ttl?: number
  ): (...args: Args) => Promise<Return> {
    const pendingPromises = new Map<string, Promise<Return>>()

    return async (...args: Args): Promise<Return> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      // Check cache first
      const cached = this.get(key)
      if (cached !== null) {
        return cached as Return
      }

      // Check if there's a pending promise for this key
      const pending = pendingPromises.get(key)
      if (pending) {
        return pending
      }

      // Execute function and cache result
      const promise = fn(...args).then(result => {
        this.set(key, result as T, ttl)
        pendingPromises.delete(key)
        return result
      }).catch(error => {
        pendingPromises.delete(key)
        throw error
      })

      pendingPromises.set(key, promise)
      return promise
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Calculate approximate size of value
   */
  private calculateSize(value: T): number {
    try {
      const serialized = JSON.stringify(value)
      return serialized.length * 2 // Approximate bytes (UTF-16)
    } catch {
      return 1000 // Default size for non-serializable values
    }
  }

  /**
   * Evict entries if necessary
   */
  private evictIfNecessary(newEntrySize: number): void {
    // Check size limit
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU()
    }

    // Check memory limit
    if (this.stats.memoryUsage + newEntrySize > this.options.maxMemory) {
      this.evictByMemory(newEntrySize)
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
    }
  }

  /**
   * Evict entries to free memory
   */
  private evictByMemory(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

    let freedSpace = 0
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break

      this.cache.delete(key)
      freedSpace += entry.size
      this.stats.evictions++
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.totalSize = this.cache.size
    this.stats.memoryUsage = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0)
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup()
    }, 60000) // Cleanup every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key)
      this.stats.evictions++
    }

    if (expiredKeys.length > 0) {
      this.updateStats()
      if (this.options.persistToDisk) {
        this.saveToStorage()
      }
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const serializable = Array.from(this.cache.entries())
        .filter(([, entry]) => !this.isExpired(entry))
        .slice(0, 100) // Limit storage size

      localStorage.setItem(this.storageKey, JSON.stringify(serializable))
    } catch (error) {
      console.warn('Failed to save cache to storage:', error)
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return

      const entries: [string, CacheEntry<T>][] = JSON.parse(stored)
      const now = Date.now()

      for (const [key, entry] of entries) {
        // Only load non-expired entries
        if (now - entry.timestamp <= entry.ttl) {
          this.cache.set(key, entry)
        }
      }

      this.updateStats()
    } catch (error) {
      console.warn('Failed to load cache from storage:', error)
    }
  }
}

// Global cache instances
export const globalCache = new AdvancedCache('global', {
  maxSize: 500,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  persistToDisk: true
})

export const apiCache = new AdvancedCache('api', {
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  persistToDisk: false
})

export const userCache = new AdvancedCache('user', {
  maxSize: 100,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  persistToDisk: true
})
