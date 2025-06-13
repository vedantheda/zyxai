/**
 * Professional-grade performance monitoring and analytics
 * Tracks Core Web Vitals and custom metrics
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals'

interface PerformanceMetric {
  name: string
  value: number
  id: string
  delta: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
}

interface CustomMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private customMetrics: CustomMetric[] = []
  private isInitialized = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private initialize() {
    if (this.isInitialized) return
    
    this.isInitialized = true
    
    // Track Core Web Vitals
    getCLS(this.handleMetric.bind(this))
    getFID(this.handleMetric.bind(this))
    getFCP(this.handleMetric.bind(this))
    getLCP(this.handleMetric.bind(this))
    getTTFB(this.handleMetric.bind(this))

    // Track navigation timing
    this.trackNavigationTiming()
    
    // Track resource timing
    this.trackResourceTiming()
    
    // Track custom performance marks
    this.trackCustomMarks()
  }

  private handleMetric(metric: Metric) {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    this.metrics.push(performanceMetric)
    this.sendToAnalytics(performanceMetric)
  }

  private trackNavigationTiming() {
    if (!('performance' in window)) return

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const metrics = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ssl: navigation.connectEnd - navigation.secureConnectionStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          domParse: navigation.domContentLoadedEventEnd - navigation.responseEnd,
          domReady: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          pageLoad: navigation.loadEventEnd - navigation.navigationStart,
        }

        Object.entries(metrics).forEach(([name, value]) => {
          if (value > 0) {
            this.trackCustomMetric(`navigation.${name}`, value)
          }
        })
      }
    })
  }

  private trackResourceTiming() {
    if (!('performance' in window)) return

    // Track resource loading performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming
          
          // Track slow resources
          if (resource.duration > 1000) {
            this.trackCustomMetric('resource.slow', resource.duration, {
              name: resource.name,
              type: resource.initiatorType,
            })
          }
        }
      })
    })

    observer.observe({ entryTypes: ['resource'] })
  }

  private trackCustomMarks() {
    if (!('performance' in window)) return

    // Track custom performance marks
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'mark') {
          this.trackCustomMetric(`mark.${entry.name}`, entry.startTime)
        }
      })
    })

    observer.observe({ entryTypes: ['mark'] })
  }

  /**
   * Track a custom performance metric
   */
  trackCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    }

    this.customMetrics.push(metric)
    this.sendCustomMetricToAnalytics(metric)
  }

  /**
   * Mark the start of a custom timing measurement
   */
  markStart(name: string) {
    if ('performance' in window && performance.mark) {
      performance.mark(`${name}-start`)
    }
  }

  /**
   * Mark the end of a custom timing measurement and calculate duration
   */
  markEnd(name: string) {
    if ('performance' in window && performance.mark && performance.measure) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const measure = performance.getEntriesByName(name, 'measure')[0]
      if (measure) {
        this.trackCustomMetric(`timing.${name}`, measure.duration)
      }
    }
  }

  /**
   * Track page view with performance context
   */
  trackPageView(page: string, metadata?: Record<string, any>) {
    this.trackCustomMetric('pageview', 1, {
      page,
      timestamp: Date.now(),
      ...metadata,
    })
  }

  /**
   * Track user interaction timing
   */
  trackInteraction(action: string, duration: number, metadata?: Record<string, any>) {
    this.trackCustomMetric(`interaction.${action}`, duration, metadata)
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      coreWebVitals: this.metrics.reduce((acc, metric) => {
        acc[metric.name] = {
          value: metric.value,
          rating: metric.rating,
        }
        return acc
      }, {} as Record<string, { value: number; rating: string }>),
      customMetrics: this.customMetrics.slice(-10), // Last 10 custom metrics
      timestamp: Date.now(),
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    if (process.env.NODE_ENV === 'production') {
      // Send to your analytics service (Google Analytics, DataDog, etc.)
      this.sendToGoogleAnalytics(metric)
      this.sendToCustomAnalytics(metric)
    } else {
      console.log('📊 Performance Metric:', metric)
    }
  }

  private sendCustomMetricToAnalytics(metric: CustomMetric) {
    if (process.env.NODE_ENV === 'production') {
      // Send to your analytics service
      this.sendToCustomAnalytics(metric)
    } else {
      console.log('📈 Custom Metric:', metric)
    }
  }

  private sendToGoogleAnalytics(metric: PerformanceMetric | CustomMetric) {
    // Google Analytics 4 implementation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        custom_parameter_1: 'timestamp',
        custom_parameter_2: metric.timestamp,
      })
    }
  }

  private sendToCustomAnalytics(metric: PerformanceMetric | CustomMetric) {
    // Send to your custom analytics endpoint
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        type: 'performance',
        metric,
        session: this.getSessionId(),
        user: this.getUserId(),
      })
      
      navigator.sendBeacon('/api/analytics/performance', data)
    }
  }

  private getSessionId(): string {
    // Get or generate session ID
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('session_id', sessionId)
    }
    return sessionId
  }

  private getUserId(): string | null {
    // Get user ID from your auth system
    return localStorage.getItem('user_id') || null
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for performance tracking
export function usePerformanceTracking() {
  const trackPageView = (page: string, metadata?: Record<string, any>) => {
    performanceMonitor.trackPageView(page, metadata)
  }

  const trackInteraction = (action: string, startTime: number, metadata?: Record<string, any>) => {
    const duration = Date.now() - startTime
    performanceMonitor.trackInteraction(action, duration, metadata)
  }

  const markStart = (name: string) => {
    performanceMonitor.markStart(name)
  }

  const markEnd = (name: string) => {
    performanceMonitor.markEnd(name)
  }

  return {
    trackPageView,
    trackInteraction,
    markStart,
    markEnd,
    getPerformanceSummary: () => performanceMonitor.getPerformanceSummary(),
  }
}

// Higher-order component for automatic performance tracking
export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: T) {
    React.useEffect(() => {
      performanceMonitor.markStart(`component.${componentName}`)
      return () => {
        performanceMonitor.markEnd(`component.${componentName}`)
      }
    }, [])

    return <Component {...props} />
  }
}

// Export for global usage
declare global {
  interface Window {
    performanceMonitor: PerformanceMonitor
  }
}

if (typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor
}
