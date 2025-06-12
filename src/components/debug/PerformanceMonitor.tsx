'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  fps: number
  bundleSize: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
    bundleSize: 0
  })

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime))
        }))
        frameCount = 0
        lastTime = currentTime
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024)
        }))
      }
    }

    const measureRenderTime = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const renderTime = entries.reduce((sum, entry) => sum + entry.duration, 0)
        setMetrics(prev => ({
          ...prev,
          renderTime: Math.round(renderTime)
        }))
      })

      observer.observe({ entryTypes: ['measure'] })
      return observer
    }

    measureFPS()
    const memoryInterval = setInterval(measureMemory, 2000)
    const renderObserver = measureRenderTime()

    return () => {
      cancelAnimationFrame(animationId)
      clearInterval(memoryInterval)
      renderObserver.disconnect()
    }
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const getPerformanceStatus = () => {
    if (metrics.fps < 30) return 'poor'
    if (metrics.fps < 50) return 'fair'
    return 'good'
  }

  const getMemoryStatus = () => {
    if (metrics.memoryUsage > 100) return 'high'
    if (metrics.memoryUsage > 50) return 'medium'
    return 'low'
  }

  return (
    <Card className="fixed bottom-4 right-4 w-64 z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Performance Monitor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs">FPS:</span>
          <Badge variant={getPerformanceStatus() === 'good' ? 'default' : 'destructive'}>
            {metrics.fps || 0}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs">Memory:</span>
          <Badge variant={getMemoryStatus() === 'low' ? 'default' : 'secondary'}>
            {metrics.memoryUsage || 0}MB
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs">Render:</span>
          <Badge variant="outline">
            {metrics.renderTime || 0}ms
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
