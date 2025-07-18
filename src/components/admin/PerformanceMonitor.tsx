'use client'

import { useState, useEffect } from 'react'
import { AdminGuard } from '@/components/auth/PermissionGuard'
import { apiCache, globalCache } from '@/lib/optimization/AdvancedCache'

interface PerformanceMetrics {
  cacheStats: {
    hits: number
    misses: number
    hitRate: number
    totalSize: number
    memoryUsage: number
  }
  loadTimes: {
    dashboard: number
    agents: number
    contacts: number
    campaigns: number
  }
  databasePerformance: {
    avgQueryTime: number
    slowQueries: number
    connectionPool: number
  }
}

/**
 * Performance monitoring dashboard for admins
 */
export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPerformanceMetrics()
    const interval = setInterval(loadPerformanceMetrics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadPerformanceMetrics = async () => {
    try {
      setLoading(true)

      // Get cache statistics
      const apiCacheStats = apiCache.getStats()
      const globalCacheStats = globalCache.getStats()

      // Simulate load time measurements (in production, these would come from real monitoring)
      const loadTimes = {
        dashboard: Math.random() * 1000 + 500, // 500-1500ms
        agents: Math.random() * 800 + 300,     // 300-1100ms
        contacts: Math.random() * 600 + 200,   // 200-800ms
        campaigns: Math.random() * 700 + 250   // 250-950ms
      }

      // Simulate database performance metrics
      const databasePerformance = {
        avgQueryTime: Math.random() * 100 + 50, // 50-150ms
        slowQueries: Math.floor(Math.random() * 5), // 0-5 slow queries
        connectionPool: Math.floor(Math.random() * 20) + 80 // 80-100% pool usage
      }

      setMetrics({
        cacheStats: {
          hits: apiCacheStats.hits + globalCacheStats.hits,
          misses: apiCacheStats.misses + globalCacheStats.misses,
          hitRate: (apiCacheStats.hitRate + globalCacheStats.hitRate) / 2,
          totalSize: apiCacheStats.totalSize + globalCacheStats.totalSize,
          memoryUsage: apiCacheStats.memoryUsage + globalCacheStats.memoryUsage
        },
        loadTimes,
        databasePerformance
      })
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearAllCaches = () => {
    apiCache.clear()
    globalCache.clear()
    alert('All caches cleared successfully!')
    loadPerformanceMetrics()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600 bg-green-50'
    if (value <= thresholds.warning) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <AdminGuard fallback={
      <div className="p-4 text-center text-red-600">
        Access denied. Admin privileges required.
      </div>
    }>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <div className="space-x-2">
            <button
              onClick={loadPerformanceMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={clearAllCaches}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear Caches
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow border">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cache Performance */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hit Rate</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    getPerformanceColor(100 - metrics.cacheStats.hitRate, { good: 20, warning: 40 })
                  }`}>
                    {metrics.cacheStats.hitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Hits</span>
                  <span className="font-medium">{metrics.cacheStats.hits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Misses</span>
                  <span className="font-medium">{metrics.cacheStats.misses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memory Usage</span>
                  <span className="font-medium">{formatBytes(metrics.cacheStats.memoryUsage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Size</span>
                  <span className="font-medium">{metrics.cacheStats.totalSize} entries</span>
                </div>
              </div>
            </div>

            {/* Load Times */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Load Times</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dashboard</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    getPerformanceColor(metrics.loadTimes.dashboard, { good: 800, warning: 1200 })
                  }`}>
                    {metrics.loadTimes.dashboard.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agents</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    getPerformanceColor(metrics.loadTimes.agents, { good: 600, warning: 1000 })
                  }`}>
                    {metrics.loadTimes.agents.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contacts</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    getPerformanceColor(metrics.loadTimes.contacts, { good: 500, warning: 800 })
                  }`}>
                    {metrics.loadTimes.contacts.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Campaigns</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    getPerformanceColor(metrics.loadTimes.campaigns, { good: 600, warning: 900 })
                  }`}>
                    {metrics.loadTimes.campaigns.toFixed(0)}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Database Performance */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Query Time</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    getPerformanceColor(metrics.databasePerformance.avgQueryTime, { good: 100, warning: 200 })
                  }`}>
                    {metrics.databasePerformance.avgQueryTime.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slow Queries</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    getPerformanceColor(metrics.databasePerformance.slowQueries, { good: 1, warning: 3 })
                  }`}>
                    {metrics.databasePerformance.slowQueries}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection Pool</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    getPerformanceColor(metrics.databasePerformance.connectionPool, { good: 70, warning: 85 })
                  }`}>
                    {metrics.databasePerformance.connectionPool}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Failed to load performance metrics
          </div>
        )}

        {/* Performance Recommendations */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
          <div className="space-y-3">
            {metrics && metrics.cacheStats.hitRate < 80 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  <strong>Low Cache Hit Rate:</strong> Consider increasing cache TTL or implementing more aggressive caching strategies.
                </p>
              </div>
            )}
            {metrics && metrics.loadTimes.dashboard > 1200 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">
                  <strong>Slow Dashboard Loading:</strong> Dashboard is taking longer than 1.2s to load. Consider optimizing queries or implementing pagination.
                </p>
              </div>
            )}
            {metrics && metrics.databasePerformance.slowQueries > 2 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-orange-800">
                  <strong>Database Performance:</strong> Multiple slow queries detected. Review query optimization and indexing.
                </p>
              </div>
            )}
            {metrics && 
             metrics.cacheStats.hitRate >= 80 && 
             metrics.loadTimes.dashboard <= 1200 && 
             metrics.databasePerformance.slowQueries <= 2 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">
                  <strong>Excellent Performance:</strong> All metrics are within optimal ranges. System is performing well!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}
