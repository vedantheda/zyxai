/**
 * Performance Monitor Component
 * Real-time performance monitoring and optimization tracking
 */

'use client'

import { useEffect, useState } from 'react'
import { PerformanceAnalyzer } from '@/lib/performance/PerformanceAnalyzer'
import { BundleAnalyzer } from '@/lib/optimization/BundleAnalyzer'

interface PerformanceData {
  loadTime: number
  renderTime: number
  bundleSize: number
  score: number
  timestamp: number
}

export const PerformanceMonitor = ({ 
  enabled = process.env.NODE_ENV === 'development',
  interval = 30000 // 30 seconds
}: {
  enabled?: boolean
  interval?: number
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const analyzer = PerformanceAnalyzer.getInstance()
    let intervalId: NodeJS.Timeout

    const collectMetrics = async () => {
      try {
        const report = await analyzer.generateReport()
        const bundleMetrics = BundleAnalyzer.getPerformanceMetrics()
        
        const data: PerformanceData = {
          loadTime: report.runtimeMetrics.loadTime,
          renderTime: report.componentMetrics.averageRenderTime,
          bundleSize: report.bundleAnalysis.totalSize,
          score: report.score.overall,
          timestamp: Date.now()
        }

        setPerformanceData(prev => {
          const newData = [...prev, data]
          // Keep only last 20 data points
          return newData.slice(-20)
        })

        // Log performance warnings
        if (data.score < 70) {
          console.warn(`⚠️ Performance score dropped to ${data.score}`)
        }
        
        if (data.loadTime > 3000) {
          console.warn(`⚠️ Slow page load: ${data.loadTime}ms`)
        }

      } catch (error) {
        console.error('Performance monitoring error:', error)
      }
    }

    // Initial collection
    collectMetrics()

    // Set up interval
    intervalId = setInterval(collectMetrics, interval)

    // Keyboard shortcut to toggle visibility (Ctrl+Shift+P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [enabled, interval])

  if (!enabled || !isVisible || performanceData.length === 0) {
    return null
  }

  const latestData = performanceData[performanceData.length - 1]
  const trend = performanceData.length > 1 
    ? latestData.score - performanceData[performanceData.length - 2].score
    : 0

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981' // green
    if (score >= 70) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div 
      className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg z-50 font-mono text-xs"
      style={{ minWidth: '280px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">Performance Monitor</span>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Score:</span>
          <span style={{ color: getScoreColor(latestData.score) }}>
            {latestData.score}
            {trend !== 0 && (
              <span className={trend > 0 ? 'text-green-400' : 'text-red-400'}>
                {trend > 0 ? ' ↑' : ' ↓'}{Math.abs(trend).toFixed(1)}
              </span>
            )}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className={latestData.loadTime > 3000 ? 'text-red-400' : 'text-green-400'}>
            {latestData.loadTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Render Time:</span>
          <span className={latestData.renderTime > 16 ? 'text-red-400' : 'text-green-400'}>
            {latestData.renderTime.toFixed(1)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Bundle Size:</span>
          <span>{formatBytes(latestData.bundleSize)}</span>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-gray-400 text-xs">
            Press Ctrl+Shift+P to toggle
          </div>
        </div>
      </div>
      
      {/* Mini chart */}
      <div className="mt-2 h-8 flex items-end space-x-1">
        {performanceData.slice(-10).map((data, index) => (
          <div
            key={index}
            className="flex-1 bg-gray-600 rounded-sm"
            style={{
              height: `${(data.score / 100) * 100}%`,
              backgroundColor: getScoreColor(data.score),
              opacity: 0.7
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Global performance monitor setup
export const setupGlobalPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return

  // Make performance analyzer globally available
  ;(window as any).performanceAnalyzer = PerformanceAnalyzer.getInstance()

  // Start bundle monitoring in development
  if (process.env.NODE_ENV === 'development') {
    const stopMonitoring = BundleAnalyzer.startBundleMonitoring()
    
    // Clean up on page unload
    window.addEventListener('beforeunload', stopMonitoring)
  }

  // Monitor Core Web Vitals
  if ('web-vitals' in window || typeof window !== 'undefined') {
    // FCP
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log('🎨 FCP:', entry.startTime.toFixed(2) + 'ms')
        }
      }
    }).observe({ entryTypes: ['paint'] })

    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('🖼️ LCP:', lastEntry.startTime.toFixed(2) + 'ms')
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // FID
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime
        console.log('👆 FID:', fid.toFixed(2) + 'ms')
      }
    }).observe({ entryTypes: ['first-input'] })

    // CLS
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      console.log('📐 CLS:', clsValue.toFixed(3))
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// Performance optimization recommendations
export const getPerformanceRecommendations = async () => {
  const analyzer = PerformanceAnalyzer.getInstance()
  const report = await analyzer.generateReport()
  
  const recommendations: string[] = []
  
  // Bundle size recommendations
  if (report.bundleAnalysis.totalSize > 1000000) { // > 1MB
    recommendations.push('Consider code splitting to reduce bundle size')
  }
  
  // Runtime performance recommendations
  if (report.runtimeMetrics.loadTime > 3000) {
    recommendations.push('Optimize critical rendering path to improve load time')
  }
  
  if (report.runtimeMetrics.firstContentfulPaint > 1800) {
    recommendations.push('Reduce time to first contentful paint')
  }
  
  if (report.componentMetrics.slowComponents.length > 0) {
    recommendations.push(`Optimize slow components: ${report.componentMetrics.slowComponents.slice(0, 3).map(c => c.name).join(', ')}`)
  }
  
  // Network recommendations
  if (report.networkMetrics.slowRequests.length > 0) {
    recommendations.push('Optimize slow network requests')
  }
  
  return recommendations
}
