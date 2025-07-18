/**
 * Performance Analysis Dashboard
 * Comprehensive performance monitoring and optimization tracking
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Zap, 
  Package, 
  Network, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react'
import { PerformanceAnalyzer, type PerformanceReport } from '@/lib/performance/PerformanceAnalyzer'
import { BundleAnalyzer } from '@/lib/optimization/BundleAnalyzer'
import { FadeIn, StaggerChildren } from '@/components/ui/animated'

export default function PerformanceAnalysisPage() {
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [historicalReports, setHistoricalReports] = useState<PerformanceReport[]>([])

  const analyzer = PerformanceAnalyzer.getInstance()

  useEffect(() => {
    // Load historical reports
    setHistoricalReports(analyzer.getHistoricalReports())
    
    // Run initial analysis
    runAnalysis()
  }, [])

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const newReport = await analyzer.generateReport()
      setReport(newReport)
      setHistoricalReports(analyzer.getHistoricalReports())
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 70) return 'secondary'
    return 'destructive'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">Analyzing Performance</h2>
            <p className="text-muted-foreground">Generating comprehensive performance report...</p>
          </div>
        </div>
      </div>
    )
  }

  const comparison = analyzer.compareWithBaseline(report)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance Analysis</h1>
            <p className="text-muted-foreground">
              Comprehensive performance monitoring and optimization tracking
            </p>
          </div>
          <Button onClick={runAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </FadeIn>

      {/* Performance Scores */}
      <FadeIn delay={0.1}>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${getScoreColor(report.score.overall)}`}>
                  {report.score.overall}
                </div>
                <Badge variant={getScoreBadgeVariant(report.score.overall)}>
                  /100
                </Badge>
              </div>
              <Progress value={report.score.overall} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bundle Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <div className={`text-xl font-bold ${getScoreColor(report.score.bundle)}`}>
                  {report.score.bundle}
                </div>
              </div>
              <Progress value={report.score.bundle} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Runtime Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <div className={`text-xl font-bold ${getScoreColor(report.score.runtime)}`}>
                  {report.score.runtime}
                </div>
              </div>
              <Progress value={report.score.runtime} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Network Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4" />
                <div className={`text-xl font-bold ${getScoreColor(report.score.network)}`}>
                  {report.score.network}
                </div>
              </div>
              <Progress value={report.score.network} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Comparison with Baseline */}
      {(comparison.improvements.length > 0 || comparison.regressions.length > 0) && (
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Changes since baseline measurement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {comparison.improvements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-600 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Improvements
                    </h4>
                    <ul className="space-y-1">
                      {comparison.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-green-600 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-2" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {comparison.regressions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2 flex items-center">
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Regressions
                    </h4>
                    <ul className="space-y-1">
                      {comparison.regressions.map((regression, index) => (
                        <li key={index} className="text-sm text-red-600 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-2" />
                          {regression}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Detailed Analysis */}
      <FadeIn delay={0.3}>
        <Tabs defaultValue="bundle" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
            <TabsTrigger value="runtime">Runtime Metrics</TabsTrigger>
            <TabsTrigger value="network">Network Performance</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="bundle" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bundle Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Size:</span>
                      <span className="font-mono">{formatBytes(report.bundleAnalysis.totalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gzipped:</span>
                      <span className="font-mono">{formatBytes(report.bundleAnalysis.gzippedSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chunks:</span>
                      <span>{report.bundleAnalysis.chunks.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dependencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.bundleAnalysis.dependencies.slice(0, 5).map((dep, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{dep.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono">{formatBytes(dep.size)}</span>
                          {dep.treeshakeable && (
                            <Badge variant="secondary" className="text-xs">Tree-shakeable</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="runtime" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Load Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTime(report.runtimeMetrics.loadTime)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total page load</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">First Contentful Paint</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTime(report.runtimeMetrics.firstContentfulPaint)}
                  </div>
                  <p className="text-xs text-muted-foreground">First content visible</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Largest Contentful Paint</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTime(report.runtimeMetrics.largestContentfulPaint)}
                  </div>
                  <p className="text-xs text-muted-foreground">Largest element loaded</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Network Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Requests:</span>
                      <span>{report.networkMetrics.totalRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transfer Size:</span>
                      <span className="font-mono">{formatBytes(report.networkMetrics.totalTransferSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slow Requests:</span>
                      <span>{report.networkMetrics.slowRequests.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {report.networkMetrics.slowRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Slow Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.networkMetrics.slowRequests.slice(0, 5).map((request, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span className="truncate">{request.url.split('/').pop()}</span>
                            <span className="font-mono">{formatTime(request.duration)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <StaggerChildren staggerDelay={0.1}>
              {report.bundleAnalysis.recommendations.map((rec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{rec.description}</CardTitle>
                      <Badge variant={rec.severity === 'high' ? 'destructive' : rec.severity === 'medium' ? 'secondary' : 'outline'}>
                        {rec.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{rec.impact}</p>
                    <p className="text-sm">{rec.implementation}</p>
                  </CardContent>
                </Card>
              ))}
            </StaggerChildren>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  )
}
