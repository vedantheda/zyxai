'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Package,
  Clock,
  Database,
  Cpu,
  HardDrive,
  Activity,
  RefreshCw
} from 'lucide-react'
import { BundleAnalyzer } from '@/lib/optimization/BundleAnalyzer'
import { globalCache, apiCache, userCache } from '@/lib/optimization/AdvancedCache'
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring'

export default function OptimizationDashboard() {
  const [bundleAnalysis, setBundleAnalysis] = useState<any>(null)
  const [performanceReport, setPerformanceReport] = useState<any>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const { getMetrics } = usePerformanceMonitoring('OptimizationDashboard')

  useEffect(() => {
    loadOptimizationData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOptimizationData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadOptimizationData = async () => {
    setIsAnalyzing(true)
    
    try {
      // Bundle analysis
      const analysis = await BundleAnalyzer.analyzeBundlePerformance()
      setBundleAnalysis(analysis)

      // Performance report
      const report = BundleAnalyzer.generatePerformanceReport()
      setPerformanceReport(report)

      // Cache statistics
      const stats = {
        global: globalCache.getStats(),
        api: apiCache.getStats(),
        user: userCache.getStats()
      }
      setCacheStats(stats)

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load optimization data:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'warning'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Optimization</h1>
          <p className="text-muted-foreground">
            Monitor and optimize ZyxAI application performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={loadOptimizationData} disabled={isAnalyzing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Performance Score Overview */}
      {performanceReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(performanceReport.score)}`}>
                {performanceReport.score}/100
              </div>
              <Progress value={performanceReport.score} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Load Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMs(performanceReport.metrics.loadTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: &lt; 3s
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">First Paint</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMs(performanceReport.metrics.firstContentfulPaint)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: &lt; 1.8s
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Layout Shift</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceReport.metrics.cumulativeLayoutShift.toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: &lt; 0.1
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="bundle" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        {/* Bundle Analysis Tab */}
        <TabsContent value="bundle" className="space-y-6">
          {bundleAnalysis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Bundle Size
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Size:</span>
                        <span className="font-mono">{formatBytes(bundleAnalysis.totalSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gzipped:</span>
                        <span className="font-mono">{formatBytes(bundleAnalysis.gzippedSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chunks:</span>
                        <span className="font-mono">{bundleAnalysis.chunks.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5" />
                      Dependencies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-mono">{bundleAnalysis.dependencies.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tree-shakeable:</span>
                        <span className="font-mono">
                          {bundleAnalysis.dependencies.filter((d: any) => d.treeshakeable).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heavy (&gt;100KB):</span>
                        <span className="font-mono">
                          {bundleAnalysis.dependencies.filter((d: any) => d.size > 100 * 1024).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Optimization Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Issues Found:</span>
                        <span className="font-mono">{bundleAnalysis.recommendations.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>High Priority:</span>
                        <span className="font-mono text-red-600">
                          {bundleAnalysis.recommendations.filter((r: any) => r.severity === 'high').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium Priority:</span>
                        <span className="font-mono text-yellow-600">
                          {bundleAnalysis.recommendations.filter((r: any) => r.severity === 'medium').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Largest Chunks */}
              <Card>
                <CardHeader>
                  <CardTitle>Largest Chunks</CardTitle>
                  <CardDescription>
                    Chunks that could benefit from optimization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bundleAnalysis.chunks.slice(0, 5).map((chunk: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{chunk.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {chunk.isAsync ? 'Async' : 'Sync'} • {chunk.modules.length} modules
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{formatBytes(chunk.size)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatBytes(chunk.gzippedSize)} gzipped
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Cache Performance Tab */}
        <TabsContent value="cache" className="space-y-6">
          {cacheStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(cacheStats).map(([name, stats]: [string, any]) => (
                <Card key={name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <Database className="w-5 h-5" />
                      {name} Cache
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Hit Rate:</span>
                        <span className={`font-mono ${stats.hitRate > 0.8 ? 'text-green-600' : stats.hitRate > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {(stats.hitRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entries:</span>
                        <span className="font-mono">{stats.totalSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory:</span>
                        <span className="font-mono">{formatBytes(stats.memoryUsage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hits:</span>
                        <span className="font-mono text-green-600">{stats.hits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Misses:</span>
                        <span className="font-mono text-red-600">{stats.misses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Evictions:</span>
                        <span className="font-mono text-yellow-600">{stats.evictions}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {bundleAnalysis?.recommendations && (
            <div className="space-y-4">
              {bundleAnalysis.recommendations.map((rec: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {rec.severity === 'high' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : rec.severity === 'medium' ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                        {rec.type.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </CardTitle>
                      <Badge variant={getSeverityColor(rec.severity) as any}>
                        {rec.severity}
                      </Badge>
                    </div>
                    <CardDescription>{rec.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Expected Impact:</h4>
                        <p className="text-sm text-muted-foreground">{rec.impact}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">Implementation:</h4>
                        <p className="text-sm text-muted-foreground">{rec.implementation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {performanceReport?.recommendations && performanceReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Performance Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performanceReport.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Real-time Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Real-time Performance Monitoring
              </CardTitle>
              <CardDescription>
                Live performance metrics and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Real-time monitoring is active. Performance issues will be detected automatically.
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    const metrics = getMetrics()
                    console.log('Current performance metrics:', metrics)
                  }}
                >
                  Log Current Metrics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
