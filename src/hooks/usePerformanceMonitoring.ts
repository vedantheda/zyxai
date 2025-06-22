'use client'

import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  connectionSpeed?: string
}

interface PerformanceEntry {
  name: string
  startTime: number
  duration: number
  entryType: string
}

export function usePerformanceMonitoring(componentName: string) {
  const startTimeRef = useRef<number>(Date.now())
  const metricsRef = useRef<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0
  })

  // Track component mount time
  useEffect(() => {
    const mountTime = Date.now() - startTimeRef.current
    metricsRef.current.renderTime = mountTime

    // Log slow renders
    if (mountTime > 1000) {
      console.warn(`🐌 Slow render detected in ${componentName}: ${mountTime}ms`)
      
      // Report to analytics
      reportPerformanceIssue({
        component: componentName,
        type: 'slow_render',
        duration: mountTime,
        threshold: 1000
      })
    }

    // Track memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metricsRef.current.memoryUsage = memory.usedJSHeapSize
      
      // Warn about high memory usage (>50MB)
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) {
        console.warn(`🧠 High memory usage in ${componentName}: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`)
        
        reportPerformanceIssue({
          component: componentName,
          type: 'high_memory',
          memoryUsage: memory.usedJSHeapSize,
          threshold: 50 * 1024 * 1024
        })
      }
    }

    // Track connection speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      metricsRef.current.connectionSpeed = connection.effectiveType
    }

  }, [componentName])

  // Performance observer for detailed metrics
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Track long tasks (>50ms)
        if (entry.entryType === 'longtask') {
          console.warn(`⏱️ Long task detected: ${entry.duration}ms`)
          
          reportPerformanceIssue({
            component: componentName,
            type: 'long_task',
            duration: entry.duration,
            threshold: 50
          })
        }

        // Track layout shifts
        if (entry.entryType === 'layout-shift' && (entry as any).value > 0.1) {
          console.warn(`📐 Layout shift detected: ${(entry as any).value}`)
          
          reportPerformanceIssue({
            component: componentName,
            type: 'layout_shift',
            value: (entry as any).value,
            threshold: 0.1
          })
        }

        // Track large contentful paint
        if (entry.entryType === 'largest-contentful-paint') {
          const lcp = entry.startTime
          if (lcp > 2500) {
            console.warn(`🎨 Slow LCP detected: ${lcp}ms`)
            
            reportPerformanceIssue({
              component: componentName,
              type: 'slow_lcp',
              duration: lcp,
              threshold: 2500
            })
          }
        }
      })
    })

    // Observe different performance entry types
    try {
      observer.observe({ entryTypes: ['longtask', 'layout-shift', 'largest-contentful-paint'] })
    } catch (error) {
      console.warn('Performance observer not supported:', error)
    }

    return () => observer.disconnect()
  }, [componentName])

  // Measure function execution time
  const measureFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    functionName: string
  ) => {
    return (...args: T): R => {
      const start = performance.now()
      const result = fn(...args)
      const duration = performance.now() - start

      // Log slow functions
      if (duration > 100) {
        console.warn(`🐌 Slow function ${functionName} in ${componentName}: ${duration.toFixed(2)}ms`)
        
        reportPerformanceIssue({
          component: componentName,
          type: 'slow_function',
          functionName,
          duration,
          threshold: 100
        })
      }

      return result
    }
  }, [componentName])

  // Measure async function execution time
  const measureAsyncFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    functionName: string
  ) => {
    return async (...args: T): Promise<R> => {
      const start = performance.now()
      try {
        const result = await fn(...args)
        const duration = performance.now() - start

        // Log slow async functions
        if (duration > 500) {
          console.warn(`🐌 Slow async function ${functionName} in ${componentName}: ${duration.toFixed(2)}ms`)
          
          reportPerformanceIssue({
            component: componentName,
            type: 'slow_async_function',
            functionName,
            duration,
            threshold: 500
          })
        }

        return result
      } catch (error) {
        const duration = performance.now() - start
        console.error(`❌ Function ${functionName} failed after ${duration.toFixed(2)}ms:`, error)
        throw error
      }
    }
  }, [componentName])

  // Track user interactions
  const trackInteraction = useCallback((interactionName: string) => {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      
      // Log slow interactions
      if (duration > 100) {
        console.warn(`🖱️ Slow interaction ${interactionName} in ${componentName}: ${duration.toFixed(2)}ms`)
        
        reportPerformanceIssue({
          component: componentName,
          type: 'slow_interaction',
          interactionName,
          duration,
          threshold: 100
        })
      }
    }
  }, [componentName])

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current }
  }, [])

  return {
    measureFunction,
    measureAsyncFunction,
    trackInteraction,
    getMetrics
  }
}

// Report performance issues to analytics
function reportPerformanceIssue(issue: {
  component: string
  type: string
  duration?: number
  value?: number
  functionName?: string
  interactionName?: string
  memoryUsage?: number
  threshold: number
}) {
  try {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_issue', {
        event_category: 'Performance',
        event_label: `${issue.component}:${issue.type}`,
        value: Math.round(issue.duration || issue.value || issue.memoryUsage || 0),
        custom_map: {
          component: issue.component,
          type: issue.type,
          threshold: issue.threshold
        }
      })
    }

    // Send to our own analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...issue,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(error => {
      console.warn('Failed to report performance issue:', error)
    })

  } catch (error) {
    console.warn('Error reporting performance issue:', error)
  }
}

// Hook for monitoring API call performance
export function useApiPerformanceMonitoring() {
  const measureApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const start = performance.now()
    
    try {
      const result = await apiCall()
      const duration = performance.now() - start

      // Log slow API calls
      if (duration > 2000) {
        console.warn(`🌐 Slow API call to ${endpoint}: ${duration.toFixed(2)}ms`)
        
        reportPerformanceIssue({
          component: 'API',
          type: 'slow_api_call',
          functionName: endpoint,
          duration,
          threshold: 2000
        })
      }

      // Track successful API calls
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'api_call_success', {
          event_category: 'API',
          event_label: endpoint,
          value: Math.round(duration)
        })
      }

      return result
    } catch (error) {
      const duration = performance.now() - start
      
      console.error(`❌ API call to ${endpoint} failed after ${duration.toFixed(2)}ms:`, error)
      
      // Track failed API calls
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'api_call_error', {
          event_category: 'API',
          event_label: endpoint,
          value: Math.round(duration)
        })
      }

      throw error
    }
  }, [])

  return { measureApiCall }
}

// Hook for monitoring bundle size and loading performance
export function useBundlePerformanceMonitoring() {
  useEffect(() => {
    // Track bundle loading performance
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
        
        console.log(`📦 Bundle performance:`, {
          loadTime: `${loadTime.toFixed(2)}ms`,
          domContentLoaded: `${domContentLoaded.toFixed(2)}ms`,
          transferSize: navigation.transferSize,
          encodedBodySize: navigation.encodedBodySize
        })

        // Report slow bundle loading
        if (loadTime > 3000) {
          reportPerformanceIssue({
            component: 'Bundle',
            type: 'slow_bundle_load',
            duration: loadTime,
            threshold: 3000
          })
        }
      }
    }
  }, [])
}
