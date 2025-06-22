'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

// ===== OPTIMIZED STATE MANAGEMENT =====

/**
 * Enhanced useState with performance optimizations
 */
export function useOptimizedState<T>(
  initialValue: T | (() => T),
  options: {
    debounceMs?: number
    throttleMs?: number
    equalityFn?: (a: T, b: T) => boolean
  } = {}
) {
  const { debounceMs, throttleMs, equalityFn } = options
  const [state, setState] = useState(initialValue)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastUpdateRef = useRef<number>(0)

  const optimizedSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    const now = Date.now()
    
    const updateState = () => {
      setState(prevState => {
        const nextState = typeof newValue === 'function' 
          ? (newValue as (prev: T) => T)(prevState)
          : newValue

        // Skip update if values are equal
        if (equalityFn && equalityFn(prevState, nextState)) {
          return prevState
        }

        return nextState
      })
      lastUpdateRef.current = now
    }

    // Throttling
    if (throttleMs && now - lastUpdateRef.current < throttleMs) {
      return
    }

    // Debouncing
    if (debounceMs) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(updateState, debounceMs)
    } else {
      updateState()
    }
  }, [debounceMs, throttleMs, equalityFn])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, optimizedSetState] as const
}

// ===== MEMOIZED CALCULATIONS =====

/**
 * Advanced useMemo with dependency tracking and cache invalidation
 */
export function useAdvancedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    maxAge?: number // Cache expiration in ms
    maxSize?: number // Max cache entries
    key?: string // Custom cache key
  } = {}
) {
  const { maxAge = 5 * 60 * 1000, maxSize = 10, key } = options
  const cacheRef = useRef<Map<string, { value: T; timestamp: number }>>(new Map())
  const depsRef = useRef<React.DependencyList>()

  return useMemo(() => {
    const cache = cacheRef.current
    const cacheKey = key || JSON.stringify(deps)
    const now = Date.now()

    // Check if we have a valid cached value
    const cached = cache.get(cacheKey)
    if (cached && now - cached.timestamp < maxAge) {
      return cached.value
    }

    // Clean up expired entries
    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp >= maxAge) {
        cache.delete(k)
      }
    }

    // Limit cache size
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }

    // Calculate new value
    const value = factory()
    cache.set(cacheKey, { value, timestamp: now })
    depsRef.current = deps

    return value
  }, deps)
}

// ===== OPTIMIZED CALLBACKS =====

/**
 * Enhanced useCallback with automatic dependency optimization
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: {
    throttleMs?: number
    debounceMs?: number
    maxCalls?: number
    resetInterval?: number
  } = {}
): T {
  const { throttleMs, debounceMs, maxCalls, resetInterval = 60000 } = options
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastCallRef = useRef<number>(0)
  const callCountRef = useRef<number>(0)
  const resetTimeoutRef = useRef<NodeJS.Timeout>()

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()

    // Rate limiting
    if (maxCalls && callCountRef.current >= maxCalls) {
      console.warn('Callback rate limit exceeded')
      return
    }

    // Throttling
    if (throttleMs && now - lastCallRef.current < throttleMs) {
      return
    }

    const executeCallback = () => {
      callCountRef.current++
      lastCallRef.current = now
      
      // Reset call count after interval
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
      resetTimeoutRef.current = setTimeout(() => {
        callCountRef.current = 0
      }, resetInterval)

      return callback(...args)
    }

    // Debouncing
    if (debounceMs) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(executeCallback, debounceMs)
    } else {
      return executeCallback()
    }
  }, deps) as T
}

// ===== ASYNC STATE MANAGEMENT =====

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * Optimized async state management with caching and error handling
 */
export function useAsyncState<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList,
  options: {
    initialData?: T
    cacheKey?: string
    cacheTime?: number
    retryCount?: number
    retryDelay?: number
  } = {}
) {
  const { initialData = null, cacheKey, cacheTime = 5 * 60 * 1000, retryCount = 3, retryDelay = 1000 } = options
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null
  })

  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())
  const abortControllerRef = useRef<AbortController>()
  const retryCountRef = useRef<number>(0)

  const execute = useCallback(async () => {
    // Check cache first
    if (cacheKey) {
      const cached = cacheRef.current.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setState({ data: cached.data, loading: false, error: null })
        return
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await asyncFn()
      
      // Cache the result
      if (cacheKey) {
        cacheRef.current.set(cacheKey, { data, timestamp: Date.now() })
      }

      setState({ data, loading: false, error: null })
      retryCountRef.current = 0
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled
      }

      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++
        setTimeout(() => execute(), retryDelay * retryCountRef.current)
        return
      }

      setState({ data: null, loading: false, error: error as Error })
    }
  }, [asyncFn, cacheKey, cacheTime, retryCount, retryDelay, ...deps])

  useEffect(() => {
    execute()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, deps)

  const retry = useCallback(() => {
    retryCountRef.current = 0
    execute()
  }, [execute])

  return { ...state, retry, execute }
}

// ===== INTERSECTION OBSERVER =====

/**
 * Optimized intersection observer for lazy loading and infinite scroll
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {},
  callback?: (entry: IntersectionObserverEntry) => void
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const elementRef = useRef<Element | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setElement = useCallback((element: Element | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current)
    }

    elementRef.current = element

    if (element) {
      if (observerRef.current) {
        observerRef.current.observe(element)
      }
    }
  }, [])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported')
      return
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
        callback?.(entry)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [callback, options])

  return { isIntersecting, entry, setElement }
}

// ===== WINDOW SIZE OPTIMIZATION =====

/**
 * Optimized window size hook with debouncing
 */
export function useOptimizedWindowSize(debounceMs = 100) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        })
      }, debounceMs)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [debounceMs])

  return windowSize
}

// ===== LOCAL STORAGE WITH OPTIMIZATION =====

/**
 * Optimized localStorage hook with serialization and error handling
 */
export function useOptimizedLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
    syncAcrossTabs?: boolean
  } = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true
  } = options

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? deserialize(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serialize(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, serialize, storedValue])

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue))
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, deserialize, syncAcrossTabs])

  return [storedValue, setValue] as const
}
