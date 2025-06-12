'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface NavigationTiming {
  route: string
  startTime: number
  endTime?: number
  duration?: number
}

/**
 * Performance monitoring for navigation
 * Tracks route change times and provides insights
 */
export function NavigationPerformanceMonitor() {
  const pathname = usePathname()
  const navigationTimingRef = useRef<NavigationTiming | null>(null)
  const performanceDataRef = useRef<NavigationTiming[]>([])

  useEffect(() => {
    // Start timing when route changes
    if (navigationTimingRef.current) {
      // Complete previous navigation timing
      const prevTiming = navigationTimingRef.current
      prevTiming.endTime = performance.now()
      prevTiming.duration = prevTiming.endTime - prevTiming.startTime
      
      // Store the completed timing
      performanceDataRef.current.push(prevTiming)
      
      // Log performance data in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Navigation Performance: ${prevTiming.route} took ${prevTiming.duration.toFixed(2)}ms`)
        
        // Warn about slow navigations
        if (prevTiming.duration > 1000) {
          console.warn(`⚠️ Slow Navigation: ${prevTiming.route} took ${prevTiming.duration.toFixed(2)}ms`)
        }
      }
      
      // Keep only last 10 entries
      if (performanceDataRef.current.length > 10) {
        performanceDataRef.current = performanceDataRef.current.slice(-10)
      }
    }

    // Start timing for new route
    navigationTimingRef.current = {
      route: pathname,
      startTime: performance.now()
    }

    // Mark navigation as complete when page is fully loaded
    const markComplete = () => {
      if (navigationTimingRef.current && !navigationTimingRef.current.endTime) {
        navigationTimingRef.current.endTime = performance.now()
        navigationTimingRef.current.duration = navigationTimingRef.current.endTime - navigationTimingRef.current.startTime
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Page Load Complete: ${navigationTimingRef.current.route} in ${navigationTimingRef.current.duration.toFixed(2)}ms`)
        }
      }
    }

    // Use multiple events to catch when page is ready
    const timer = setTimeout(markComplete, 100)
    
    // Also listen for when the page is fully interactive
    if (document.readyState === 'complete') {
      markComplete()
    } else {
      window.addEventListener('load', markComplete)
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', markComplete)
    }
  }, [pathname])

  // Expose performance data globally for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).__navigationPerformance = {
        getCurrentTiming: () => navigationTimingRef.current,
        getAllTimings: () => performanceDataRef.current,
        getAverageTime: () => {
          const timings = performanceDataRef.current.filter(t => t.duration)
          if (timings.length === 0) return 0
          return timings.reduce((sum, t) => sum + (t.duration || 0), 0) / timings.length
        },
        getSlowestRoute: () => {
          const timings = performanceDataRef.current.filter(t => t.duration)
          if (timings.length === 0) return null
          return timings.reduce((slowest, current) => 
            (current.duration || 0) > (slowest.duration || 0) ? current : slowest
          )
        }
      }
    }
  }, [])

  return null // This component doesn't render anything
}

/**
 * Hook to access navigation performance data
 */
export function useNavigationPerformance() {
  const getPerformanceData = () => {
    if (typeof window !== 'undefined' && (window as any).__navigationPerformance) {
      return (window as any).__navigationPerformance
    }
    return null
  }

  return { getPerformanceData }
}
