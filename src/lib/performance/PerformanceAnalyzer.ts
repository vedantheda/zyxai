/**
 * Comprehensive Performance Analyzer
 * Enterprise-grade performance analysis and monitoring
 */

import { BundleAnalyzer } from '@/lib/optimization/BundleAnalyzer'

export interface PerformanceReport {
  timestamp: string
  bundleAnalysis: {
    totalSize: number
    gzippedSize: number
    chunks: Array<{
      name: string
      size: number
      gzippedSize: number
      isAsync: boolean
    }>
    dependencies: Array<{
      name: string
      size: number
      treeshakeable: boolean
    }>
    recommendations: Array<{
      type: string
      severity: 'low' | 'medium' | 'high'
      description: string
      impact: string
    }>
  }
  runtimeMetrics: {
    loadTime: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    cumulativeLayoutShift: number
    firstInputDelay: number
    timeToInteractive: number
  }
  componentMetrics: {
    renderCount: number
    averageRenderTime: number
    slowComponents: Array<{
      name: string
      renderTime: number
      renderCount: number
    }>
  }
  networkMetrics: {
    totalRequests: number
    totalTransferSize: number
    slowRequests: Array<{
      url: string
      duration: number
      size: number
    }>
  }
  score: {
    overall: number
    bundle: number
    runtime: number
    network: number
  }
}

export class PerformanceAnalyzer {
  private static instance: PerformanceAnalyzer
  private componentMetrics = new Map<string, {
    renderCount: number
    totalRenderTime: number
    lastRenderTime: number
  }>()

  static getInstance(): PerformanceAnalyzer {
    if (!PerformanceAnalyzer.instance) {
      PerformanceAnalyzer.instance = new PerformanceAnalyzer()
    }
    return PerformanceAnalyzer.instance
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport(): Promise<PerformanceReport> {
    const timestamp = new Date().toISOString()
    
    // Bundle analysis
    const bundleAnalysis = await BundleAnalyzer.analyzeBundlePerformance()
    
    // Runtime metrics
    const runtimeMetrics = this.collectRuntimeMetrics()
    
    // Component metrics
    const componentMetrics = this.getComponentMetrics()
    
    // Network metrics
    const networkMetrics = this.collectNetworkMetrics()
    
    // Calculate scores
    const score = this.calculatePerformanceScore(
      bundleAnalysis,
      runtimeMetrics,
      networkMetrics
    )

    const report: PerformanceReport = {
      timestamp,
      bundleAnalysis: {
        totalSize: bundleAnalysis.totalSize,
        gzippedSize: bundleAnalysis.gzippedSize,
        chunks: bundleAnalysis.chunks,
        dependencies: bundleAnalysis.dependencies,
        recommendations: bundleAnalysis.recommendations
      },
      runtimeMetrics,
      componentMetrics,
      networkMetrics,
      score
    }

    // Store report for comparison
    this.storeReport(report)
    
    return report
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName) || {
      renderCount: 0,
      totalRenderTime: 0,
      lastRenderTime: 0
    }

    this.componentMetrics.set(componentName, {
      renderCount: existing.renderCount + 1,
      totalRenderTime: existing.totalRenderTime + renderTime,
      lastRenderTime: renderTime
    })
  }

  /**
   * Collect runtime performance metrics
   */
  private collectRuntimeMetrics() {
    const metrics = {
      loadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      timeToInteractive: 0
    }

    if (typeof window === 'undefined' || !('performance' in window)) {
      return metrics
    }

    try {
      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart
      }

      // Paint timing
      const paintEntries = performance.getEntriesByType('paint')
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      if (fcp) {
        metrics.firstContentfulPaint = fcp.startTime
      }

      // LCP
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
      if (lcpEntries.length > 0) {
        metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime
      }

      // CLS
      const clsEntries = performance.getEntriesByType('layout-shift')
      metrics.cumulativeLayoutShift = clsEntries
        .filter((entry: any) => !entry.hadRecentInput)
        .reduce((sum: number, entry: any) => sum + entry.value, 0)

      // FID
      const fidEntries = performance.getEntriesByType('first-input')
      if (fidEntries.length > 0) {
        metrics.firstInputDelay = (fidEntries[0] as any).processingStart - fidEntries[0].startTime
      }

      // TTI (approximation)
      metrics.timeToInteractive = navigation ? navigation.domInteractive - navigation.fetchStart : 0

    } catch (error) {
      console.warn('Error collecting runtime metrics:', error)
    }

    return metrics
  }

  /**
   * Get component performance metrics
   */
  private getComponentMetrics() {
    const totalRenders = Array.from(this.componentMetrics.values())
      .reduce((sum, metric) => sum + metric.renderCount, 0)
    
    const totalRenderTime = Array.from(this.componentMetrics.values())
      .reduce((sum, metric) => sum + metric.totalRenderTime, 0)

    const slowComponents = Array.from(this.componentMetrics.entries())
      .map(([name, metric]) => ({
        name,
        renderTime: metric.totalRenderTime / metric.renderCount,
        renderCount: metric.renderCount
      }))
      .filter(component => component.renderTime > 16) // > 16ms is slow
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, 10) // Top 10 slowest

    return {
      renderCount: totalRenders,
      averageRenderTime: totalRenders > 0 ? totalRenderTime / totalRenders : 0,
      slowComponents
    }
  }

  /**
   * Collect network performance metrics
   */
  private collectNetworkMetrics() {
    const metrics = {
      totalRequests: 0,
      totalTransferSize: 0,
      slowRequests: [] as Array<{
        url: string
        duration: number
        size: number
      }>
    }

    if (typeof window === 'undefined' || !('performance' in window)) {
      return metrics
    }

    try {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      
      metrics.totalRequests = resourceEntries.length
      metrics.totalTransferSize = resourceEntries.reduce(
        (sum, entry) => sum + (entry.transferSize || 0), 0
      )

      metrics.slowRequests = resourceEntries
        .filter(entry => entry.duration > 1000) // > 1s is slow
        .map(entry => ({
          url: entry.name,
          duration: entry.duration,
          size: entry.transferSize || 0
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10) // Top 10 slowest

    } catch (error) {
      console.warn('Error collecting network metrics:', error)
    }

    return metrics
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(
    bundleAnalysis: any,
    runtimeMetrics: any,
    networkMetrics: any
  ) {
    let bundleScore = 100
    let runtimeScore = 100
    let networkScore = 100

    // Bundle score
    if (bundleAnalysis.totalSize > 1000000) bundleScore -= 30 // > 1MB
    if (bundleAnalysis.totalSize > 2000000) bundleScore -= 20 // > 2MB
    if (bundleAnalysis.recommendations.some((r: any) => r.severity === 'high')) bundleScore -= 25

    // Runtime score
    if (runtimeMetrics.loadTime > 3000) runtimeScore -= 25 // > 3s
    if (runtimeMetrics.firstContentfulPaint > 1800) runtimeScore -= 20 // > 1.8s
    if (runtimeMetrics.largestContentfulPaint > 2500) runtimeScore -= 25 // > 2.5s
    if (runtimeMetrics.cumulativeLayoutShift > 0.1) runtimeScore -= 15 // > 0.1
    if (runtimeMetrics.firstInputDelay > 100) runtimeScore -= 15 // > 100ms

    // Network score
    if (networkMetrics.totalTransferSize > 2000000) networkScore -= 20 // > 2MB
    if (networkMetrics.slowRequests.length > 5) networkScore -= 15
    if (networkMetrics.totalRequests > 50) networkScore -= 10

    const overall = Math.round((bundleScore + runtimeScore + networkScore) / 3)

    return {
      overall: Math.max(0, overall),
      bundle: Math.max(0, bundleScore),
      runtime: Math.max(0, runtimeScore),
      network: Math.max(0, networkScore)
    }
  }

  /**
   * Store report for historical comparison
   */
  private storeReport(report: PerformanceReport): void {
    if (typeof window === 'undefined') return

    try {
      const reports = JSON.parse(
        localStorage.getItem('zyxai_performance_reports') || '[]'
      )
      
      reports.push(report)
      
      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.splice(0, reports.length - 10)
      }
      
      localStorage.setItem('zyxai_performance_reports', JSON.stringify(reports))
    } catch (error) {
      console.warn('Failed to store performance report:', error)
    }
  }

  /**
   * Get historical reports for comparison
   */
  getHistoricalReports(): PerformanceReport[] {
    if (typeof window === 'undefined') return []

    try {
      return JSON.parse(
        localStorage.getItem('zyxai_performance_reports') || '[]'
      )
    } catch (error) {
      console.warn('Failed to load historical reports:', error)
      return []
    }
  }

  /**
   * Compare current performance with baseline
   */
  compareWithBaseline(currentReport: PerformanceReport): {
    improvements: string[]
    regressions: string[]
    recommendations: string[]
  } {
    const reports = this.getHistoricalReports()
    if (reports.length === 0) {
      return {
        improvements: [],
        regressions: [],
        recommendations: ['Establish baseline by running more performance tests']
      }
    }

    const baseline = reports[0]
    const improvements: string[] = []
    const regressions: string[] = []
    const recommendations: string[] = []

    // Compare bundle size
    const bundleDiff = currentReport.bundleAnalysis.totalSize - baseline.bundleAnalysis.totalSize
    if (bundleDiff < -50000) { // 50KB improvement
      improvements.push(`Bundle size reduced by ${Math.abs(bundleDiff / 1024).toFixed(1)}KB`)
    } else if (bundleDiff > 50000) {
      regressions.push(`Bundle size increased by ${(bundleDiff / 1024).toFixed(1)}KB`)
      recommendations.push('Consider code splitting or removing unused dependencies')
    }

    // Compare load time
    const loadTimeDiff = currentReport.runtimeMetrics.loadTime - baseline.runtimeMetrics.loadTime
    if (loadTimeDiff < -500) { // 500ms improvement
      improvements.push(`Load time improved by ${Math.abs(loadTimeDiff).toFixed(0)}ms`)
    } else if (loadTimeDiff > 500) {
      regressions.push(`Load time increased by ${loadTimeDiff.toFixed(0)}ms`)
      recommendations.push('Optimize critical rendering path and reduce blocking resources')
    }

    // Compare scores
    const scoreDiff = currentReport.score.overall - baseline.score.overall
    if (scoreDiff > 5) {
      improvements.push(`Overall performance score improved by ${scoreDiff} points`)
    } else if (scoreDiff < -5) {
      regressions.push(`Overall performance score decreased by ${Math.abs(scoreDiff)} points`)
    }

    return { improvements, regressions, recommendations }
  }
}
