/**
 * React Performance Optimization Utilities
 * Memoization, virtualization, and performance patterns
 */

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect, 
  useState,
  ComponentType 
} from 'react'

// Enhanced memo with deep comparison option
export const memoDeep = <P extends object>(
  Component: ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, areEqual || ((prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps)
  }))
}

// Performance monitoring HOC
export const withPerformanceMonitoring = <P extends object>(
  Component: ComponentType<P>,
  componentName: string
) => {
  return memo((props: P) => {
    const renderStartTime = useRef<number>()
    const renderCount = useRef(0)

    // Track render start
    renderStartTime.current = performance.now()
    renderCount.current++

    useEffect(() => {
      // Track render end
      const renderTime = performance.now() - (renderStartTime.current || 0)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎭 ${componentName} rendered in ${renderTime.toFixed(2)}ms (render #${renderCount.current})`)
        
        // Track in performance analyzer
        if (typeof window !== 'undefined' && (window as any).performanceAnalyzer) {
          (window as any).performanceAnalyzer.trackComponentRender(componentName, renderTime)
        }
      }
    })

    return <Component {...props} />
  })
}

// Optimized state hook with debouncing
export const useOptimizedState = <T>(
  initialValue: T,
  debounceMs = 0
): [T, (value: T | ((prev: T) => T)) => void, T] => {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const setOptimizedValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(newValue)
    
    if (debounceMs > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue)
      }, debounceMs)
    } else {
      setDebouncedValue(typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue)
    }
  }, [debounceMs, value])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [value, setOptimizedValue, debouncedValue]
}

// Virtualized list component for large datasets
export const VirtualizedList = memo(<T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  )

  const startIndex = Math.max(0, visibleStart - overscan)
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan)

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }))
  }, [items, startIndex, endIndex])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

VirtualizedList.displayName = 'VirtualizedList'

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const elementRef = useRef<Element | null>(null)

  const setRef = useCallback((element: Element | null) => {
    elementRef.current = element
  }, [])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [options])

  return { isIntersecting, entry, setRef }
}

// Optimized event handler hook
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  delay = 0
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (delay > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          callback(...args)
        }, delay)
      } else {
        callback(...args)
      }
    }) as T,
    [...deps, delay]
  )
}

// Batch state updates hook
export const useBatchedState = <T extends Record<string, any>>(
  initialState: T
) => {
  const [state, setState] = useState(initialState)
  const batchedUpdates = useRef<Partial<T>>({})
  const timeoutRef = useRef<NodeJS.Timeout>()

  const batchUpdate = useCallback((updates: Partial<T>) => {
    batchedUpdates.current = { ...batchedUpdates.current, ...updates }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, ...batchedUpdates.current }))
      batchedUpdates.current = {}
    }, 0)
  }, [])

  const immediateUpdate = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, batchUpdate, immediateUpdate] as const
}

// Performance-optimized form hook
export const useOptimizedForm = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: (values: T) => Record<string, string>
) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const validate = useCallback(() => {
    if (!validationSchema) return true
    
    const newErrors = validationSchema(values)
    setErrors(newErrors)
    
    return Object.keys(newErrors).length === 0
  }, [values, validationSchema])

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    setIsSubmitting(true)
    
    try {
      if (validate()) {
        await onSubmit(values)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    validate,
    handleSubmit,
    reset
  }
}

// Component preloader utility
export const useComponentPreloader = (
  importFunctions: Array<() => Promise<any>>,
  preloadCondition = true
) => {
  useEffect(() => {
    if (!preloadCondition) return

    const preloadComponents = async () => {
      try {
        await Promise.all(importFunctions.map(fn => fn()))
      } catch (error) {
        console.warn('Component preloading failed:', error)
      }
    }

    // Preload on idle or after a delay
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadComponents)
    } else {
      setTimeout(preloadComponents, 100)
    }
  }, [importFunctions, preloadCondition])
}

// Performance metrics hook
export const usePerformanceMetrics = (componentName: string) => {
  const renderCount = useRef(0)
  const renderTimes = useRef<number[]>([])
  const startTime = useRef<number>()

  // Track render start
  startTime.current = performance.now()
  renderCount.current++

  useEffect(() => {
    // Track render end
    const renderTime = performance.now() - (startTime.current || 0)
    renderTimes.current.push(renderTime)
    
    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current = renderTimes.current.slice(-10)
    }

    if (process.env.NODE_ENV === 'development') {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      
      if (renderTime > 16) { // Slower than 60fps
        console.warn(`⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms (avg: ${avgRenderTime.toFixed(2)}ms)`)
      }
    }
  })

  return {
    renderCount: renderCount.current,
    averageRenderTime: renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length,
    lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0
  }
}
