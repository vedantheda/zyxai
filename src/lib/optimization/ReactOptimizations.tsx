/**
 * React Performance Optimizations
 * Advanced hooks and utilities for optimal React performance
 */

// @ts-nocheck

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useEffect, 
  useRef, 
  useState,
  ComponentType 
} from 'react'

// Enhanced memo with deep comparison option
export const deepMemo = <P extends object>(
  Component: ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, areEqual || ((prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps)
  }))
}

// Performance monitoring HOC
export const withPerformanceMonitoring = <P extends object>(
  Component: ComponentType<P>,
  componentName: string
) => {
  return memo((props: P) => {
    const renderStartTime = useRef<number>()
    const renderCount = useRef(0)
    
    // Track render start
    renderStartTime.current = performance.now()
    renderCount.current++

    useEffect(() => {
      // Track render end
      const renderTime = performance.now() - (renderStartTime.current || 0)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎭 ${componentName} rendered in ${renderTime.toFixed(2)}ms (render #${renderCount.current})`)
        
        // Track in performance analyzer
        if (typeof window !== 'undefined' && (window as any).performanceAnalyzer) {
          (window as any).performanceAnalyzer.trackComponentRender(componentName, renderTime)
        }
      }
    })

    return React.createElement(Component, props)
  })
}

// Optimized state hook with debouncing
export const useOptimizedState = <T,>(
  initialValue: T,
  debounceMs = 0
): [T, (value: T | ((prev: T) => T)) => void, T] => {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const setOptimizedValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(newValue)
    
    if (debounceMs > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue)
      }, debounceMs)
    } else {
      setDebouncedValue(typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue)
    }
  }, [debounceMs, value])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [value, setOptimizedValue, debouncedValue]
}

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const elementRef = useRef<Element | null>(null)

  const setRef = useCallback((element: Element | null) => {
    elementRef.current = element
  }, [])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [options])

  return { isIntersecting, entry, setRef }
}

// Optimized event handler hook
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  delay = 0
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (delay > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          callback(...args)
        }, delay)
      } else {
        callback(...args)
      }
    }) as T,
    [...deps, delay]
  )
}

// Performance metrics hook
export const usePerformanceMetrics = (componentName: string) => {
  const renderCount = useRef(0)
  const renderTimes = useRef<number[]>([])
  const startTime = useRef<number>()

  // Track render start
  startTime.current = performance.now()
  renderCount.current++

  useEffect(() => {
    // Track render end
    const renderTime = performance.now() - (startTime.current || 0)
    renderTimes.current.push(renderTime)
    
    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current = renderTimes.current.slice(-10)
    }

    if (process.env.NODE_ENV === 'development') {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      
      if (renderTime > 16) { // Slower than 60fps
        console.warn(`⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms (avg: ${avgRenderTime.toFixed(2)}ms)`)
      }
    }
  })

  return {
    renderCount: renderCount.current,
    averageRenderTime: renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length,
    lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0
  }
}
