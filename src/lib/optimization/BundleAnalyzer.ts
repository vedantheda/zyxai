/**
 * Bundle Analysis and Optimization Tools for ZyxAI
 * Analyzes bundle size, identifies optimization opportunities
 */

interface BundleAnalysis {
  totalSize: number
  gzippedSize: number
  chunks: ChunkInfo[]
  dependencies: DependencyInfo[]
  recommendations: OptimizationRecommendation[]
}

interface ChunkInfo {
  name: string
  size: number
  gzippedSize: number
  modules: ModuleInfo[]
  isAsync: boolean
  isEntry: boolean
}

interface ModuleInfo {
  name: string
  size: number
  reasons: string[]
  isExternal: boolean
}

interface DependencyInfo {
  name: string
  version: string
  size: number
  treeshakeable: boolean
  sideEffects: boolean
  usageCount: number
}

interface OptimizationRecommendation {
  type: 'code-splitting' | 'tree-shaking' | 'lazy-loading' | 'dependency-optimization'
  severity: 'low' | 'medium' | 'high'
  description: string
  impact: string
  implementation: string
}

export class BundleAnalyzer {
  private static readonly SIZE_THRESHOLDS = {
    LARGE_CHUNK: 250 * 1024, // 250KB
    HUGE_CHUNK: 500 * 1024,  // 500KB
    LARGE_DEPENDENCY: 100 * 1024, // 100KB
    HUGE_DEPENDENCY: 500 * 1024   // 500KB
  }

  /**
   * Analyze bundle and provide optimization recommendations
   */
  static async analyzeBundlePerformance(): Promise<BundleAnalysis> {
    const analysis: BundleAnalysis = {
      totalSize: 0,
      gzippedSize: 0,
      chunks: [],
      dependencies: [],
      recommendations: []
    }

    try {
      // Analyze current bundle if webpack stats are available
      if (typeof window !== 'undefined' && (window as any).__WEBPACK_STATS__) {
        const stats = (window as any).__WEBPACK_STATS__
        analysis.chunks = this.analyzeChunks(stats)
        analysis.totalSize = analysis.chunks.reduce((sum, chunk) => sum + chunk.size, 0)
        analysis.gzippedSize = analysis.chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0)
      }

      // Analyze dependencies from package.json
      analysis.dependencies = await this.analyzeDependencies()

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis)

      return analysis
    } catch (error) {
      console.error('Bundle analysis failed:', error)
      return analysis
    }
  }

  /**
   * Analyze webpack chunks
   */
  private static analyzeChunks(stats: any): ChunkInfo[] {
    const chunks: ChunkInfo[] = []

    if (stats.chunks) {
      for (const chunk of stats.chunks) {
        const chunkInfo: ChunkInfo = {
          name: chunk.names?.[0] || `chunk-${chunk.id}`,
          size: chunk.size || 0,
          gzippedSize: Math.round((chunk.size || 0) * 0.3), // Estimate
          modules: this.analyzeModules(chunk.modules || []),
          isAsync: !chunk.initial,
          isEntry: chunk.entry || false
        }
        chunks.push(chunkInfo)
      }
    }

    return chunks.sort((a, b) => b.size - a.size)
  }

  /**
   * Analyze webpack modules
   */
  private static analyzeModules(modules: any[]): ModuleInfo[] {
    return modules.map(module => ({
      name: module.name || module.identifier || 'unknown',
      size: module.size || 0,
      reasons: module.reasons?.map((r: any) => r.moduleName) || [],
      isExternal: module.name?.includes('node_modules') || false
    })).sort((a, b) => b.size - a.size)
  }

  /**
   * Analyze dependencies from package.json
   */
  private static async analyzeDependencies(): Promise<DependencyInfo[]> {
    try {
      // In a real implementation, this would fetch package.json
      // For now, we'll analyze common heavy dependencies
      const commonDependencies = [
        { name: '@vapi-ai/web', estimatedSize: 150 * 1024, treeshakeable: true },
        { name: '@vapi-ai/server-sdk', estimatedSize: 200 * 1024, treeshakeable: true },
        { name: 'lucide-react', estimatedSize: 800 * 1024, treeshakeable: true },
        { name: '@radix-ui/react-dialog', estimatedSize: 50 * 1024, treeshakeable: false },
        { name: 'next', estimatedSize: 1000 * 1024, treeshakeable: false },
        { name: 'react', estimatedSize: 150 * 1024, treeshakeable: false },
        { name: 'react-dom', estimatedSize: 150 * 1024, treeshakeable: false }
      ]

      return commonDependencies.map(dep => ({
        name: dep.name,
        version: 'latest',
        size: dep.estimatedSize,
        treeshakeable: dep.treeshakeable,
        sideEffects: !dep.treeshakeable,
        usageCount: 1
      }))
    } catch (error) {
      console.warn('Could not analyze dependencies:', error)
      return []
    }
  }

  /**
   * Generate optimization recommendations
   */
  private static generateRecommendations(analysis: BundleAnalysis): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []

    // Check for large chunks
    const largeChunks = analysis.chunks.filter(chunk => 
      chunk.size > this.SIZE_THRESHOLDS.LARGE_CHUNK
    )

    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'code-splitting',
        severity: largeChunks.some(c => c.size > this.SIZE_THRESHOLDS.HUGE_CHUNK) ? 'high' : 'medium',
        description: `Found ${largeChunks.length} large chunks that could benefit from code splitting`,
        impact: `Reduce initial bundle size by ${Math.round(largeChunks.reduce((sum, c) => sum + c.size, 0) / 1024)}KB`,
        implementation: 'Use dynamic imports and React.lazy() for large components'
      })
    }

    // Check for heavy dependencies
    const heavyDeps = analysis.dependencies.filter(dep => 
      dep.size > this.SIZE_THRESHOLDS.LARGE_DEPENDENCY
    )

    if (heavyDeps.length > 0) {
      recommendations.push({
        type: 'dependency-optimization',
        severity: heavyDeps.some(d => d.size > this.SIZE_THRESHOLDS.HUGE_DEPENDENCY) ? 'high' : 'medium',
        description: `Found ${heavyDeps.length} heavy dependencies that could be optimized`,
        impact: `Potential savings of ${Math.round(heavyDeps.reduce((sum, d) => sum + d.size * 0.3, 0) / 1024)}KB`,
        implementation: 'Consider lighter alternatives or tree-shaking optimizations'
      })
    }

    // Check for tree-shaking opportunities
    const nonTreeshakeableDeps = analysis.dependencies.filter(dep => 
      !dep.treeshakeable && dep.size > 50 * 1024
    )

    if (nonTreeshakeableDeps.length > 0) {
      recommendations.push({
        type: 'tree-shaking',
        severity: 'medium',
        description: `Found ${nonTreeshakeableDeps.length} dependencies that don't support tree-shaking`,
        impact: 'Improve bundle efficiency and reduce unused code',
        implementation: 'Use named imports and configure webpack for better tree-shaking'
      })
    }

    // Check for lazy loading opportunities
    const syncChunks = analysis.chunks.filter(chunk => 
      !chunk.isAsync && !chunk.isEntry && chunk.size > 100 * 1024
    )

    if (syncChunks.length > 0) {
      recommendations.push({
        type: 'lazy-loading',
        severity: 'medium',
        description: `Found ${syncChunks.length} synchronous chunks that could be lazy loaded`,
        impact: 'Improve initial page load time',
        implementation: 'Convert to dynamic imports with React.lazy() and Suspense'
      })
    }

    return recommendations.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  /**
   * Get performance metrics for the current page
   */
  static getPerformanceMetrics(): {
    loadTime: number
    domContentLoaded: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    cumulativeLayoutShift: number
    firstInputDelay: number
  } {
    const metrics = {
      loadTime: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0
    }

    if (typeof window === 'undefined' || !('performance' in window)) {
      return metrics
    }

    try {
      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart
        metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
      }

      // Paint timing
      const paintEntries = performance.getEntriesByType('paint')
      for (const entry of paintEntries) {
        if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime
        }
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

      // FID (approximation)
      const fidEntries = performance.getEntriesByType('first-input')
      if (fidEntries.length > 0) {
        metrics.firstInputDelay = (fidEntries[0] as any).processingStart - fidEntries[0].startTime
      }

    } catch (error) {
      console.warn('Error collecting performance metrics:', error)
    }

    return metrics
  }

  /**
   * Generate performance report
   */
  static generatePerformanceReport(): {
    score: number
    metrics: ReturnType<typeof BundleAnalyzer.getPerformanceMetrics>
    recommendations: string[]
  } {
    const metrics = this.getPerformanceMetrics()
    const recommendations: string[] = []
    let score = 100

    // Evaluate metrics and generate recommendations
    if (metrics.loadTime > 3000) {
      score -= 20
      recommendations.push('Reduce page load time (currently > 3s)')
    }

    if (metrics.firstContentfulPaint > 1800) {
      score -= 15
      recommendations.push('Improve First Contentful Paint (currently > 1.8s)')
    }

    if (metrics.largestContentfulPaint > 2500) {
      score -= 20
      recommendations.push('Optimize Largest Contentful Paint (currently > 2.5s)')
    }

    if (metrics.cumulativeLayoutShift > 0.1) {
      score -= 15
      recommendations.push('Reduce Cumulative Layout Shift (currently > 0.1)')
    }

    if (metrics.firstInputDelay > 100) {
      score -= 10
      recommendations.push('Improve First Input Delay (currently > 100ms)')
    }

    return {
      score: Math.max(0, score),
      metrics,
      recommendations
    }
  }

  /**
   * Monitor bundle size in development
   */
  static startBundleMonitoring(): () => void {
    if (process.env.NODE_ENV !== 'development') {
      return () => {}
    }

    const checkInterval = setInterval(async () => {
      const analysis = await this.analyzeBundlePerformance()
      const performanceReport = this.generatePerformanceReport()

      console.group('📦 Bundle Analysis')
      console.log(`Total Size: ${Math.round(analysis.totalSize / 1024)}KB`)
      console.log(`Gzipped: ${Math.round(analysis.gzippedSize / 1024)}KB`)
      console.log(`Performance Score: ${performanceReport.score}/100`)
      
      if (analysis.recommendations.length > 0) {
        console.group('🔧 Optimization Recommendations')
        analysis.recommendations.forEach(rec => {
          console.log(`${rec.severity.toUpperCase()}: ${rec.description}`)
        })
        console.groupEnd()
      }
      
      console.groupEnd()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(checkInterval)
  }
}
