'use client'

import React, { memo, useMemo, useCallback, forwardRef, lazy, Suspense } from 'react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// ===== MEMOIZED FORM COMPONENTS =====

interface OptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const OptimizedInput = memo(forwardRef<HTMLInputElement, OptimizedInputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = useMemo(() => id || `input-${Math.random().toString(36).substr(2, 9)}`, [id])
    
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
))
OptimizedInput.displayName = 'OptimizedInput'

interface OptimizedSelectProps {
  options: Array<{ value: string; label: string }>
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  error?: string
  label?: string
  className?: string
}

export const OptimizedSelect = memo<OptimizedSelectProps>(({
  options,
  value,
  onValueChange,
  placeholder,
  error,
  label,
  className
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(e.target.value)
  }, [onValueChange])

  const memoizedOptions = useMemo(() => 
    options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    )), [options]
  )

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={handleChange}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {memoizedOptions}
      </select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
})
OptimizedSelect.displayName = 'OptimizedSelect'

// ===== VIRTUALIZED LIST COMPONENT =====

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  containerHeight: number
  className?: string
  overscan?: number
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  className,
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0)

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== LAZY LOADED COMPONENTS =====

const LazyVoiceWidget = lazy(() => import('@/components/voice/VoiceWidget'))
const LazyAnalyticsDashboard = lazy(() => import('@/components/analytics/AnalyticsDashboard'))
const LazyVapiConfig = lazy(() => import('@/app/dashboard/vapi-config/page'))

interface LazyComponentProps {
  component: 'voice' | 'analytics' | 'vapi-config'
  fallback?: React.ReactNode
  [key: string]: any
}

export const LazyComponent = memo<LazyComponentProps>(({ component, fallback, ...props }) => {
  const Component = useMemo(() => {
    switch (component) {
      case 'voice':
        return LazyVoiceWidget
      case 'analytics':
        return LazyAnalyticsDashboard
      case 'vapi-config':
        return LazyVapiConfig
      default:
        return null
    }
  }, [component])

  if (!Component) {
    return <div>Component not found</div>
  }

  return (
    <Suspense fallback={fallback || <LoadingSpinner text={`Loading ${component}...`} />}>
      <Component {...props} />
    </Suspense>
  )
})
LazyComponent.displayName = 'LazyComponent'

// ===== OPTIMIZED TABLE COMPONENT =====

interface TableColumn<T> {
  key: keyof T | string
  header: string
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface OptimizedTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  className?: string
  virtualized?: boolean
  rowHeight?: number
  maxHeight?: number
}

export function OptimizedTable<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  className,
  virtualized = false,
  rowHeight = 50,
  maxHeight = 400
}: OptimizedTableProps<T>) {
  const handleSort = useCallback((key: string) => {
    if (!onSort) return
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(key, newDirection)
  }, [onSort, sortKey, sortDirection])

  const renderRow = useCallback((item: T, index: number) => (
    <tr key={index} className="border-b hover:bg-muted/50">
      {columns.map((column, colIndex) => (
        <td key={colIndex} className="px-4 py-2" style={{ width: column.width }}>
          {column.render ? column.render(item, index) : String(item[column.key as keyof T])}
        </td>
      ))}
    </tr>
  ), [columns])

  const tableHeader = useMemo(() => (
    <thead className="bg-muted">
      <tr>
        {columns.map((column, index) => (
          <th
            key={index}
            className={cn(
              "px-4 py-2 text-left font-medium",
              column.sortable && "cursor-pointer hover:bg-muted-foreground/10"
            )}
            style={{ width: column.width }}
            onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
          >
            <div className="flex items-center gap-2">
              {column.header}
              {column.sortable && sortKey === column.key && (
                <span className="text-xs">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  ), [columns, handleSort, sortKey, sortDirection])

  if (virtualized && data.length > 100) {
    return (
      <div className={cn("border rounded-md", className)}>
        <table className="w-full">
          {tableHeader}
        </table>
        <VirtualizedList
          items={data}
          renderItem={renderRow}
          itemHeight={rowHeight}
          containerHeight={maxHeight}
          className="border-t"
        />
      </div>
    )
  }

  return (
    <div className={cn("border rounded-md overflow-auto", className)} style={{ maxHeight }}>
      <table className="w-full">
        {tableHeader}
        <tbody>
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  )
}

// ===== OPTIMIZED CARD GRID =====

interface OptimizedCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  loading?: boolean
}

export const OptimizedCard = memo<OptimizedCardProps>(({ 
  children, 
  className, 
  onClick, 
  loading 
}) => {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
        loading && "opacity-50 pointer-events-none",
        className
      )}
      onClick={onClick}
    >
      {loading ? (
        <div className="p-6 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        children
      )}
    </div>
  )
})
OptimizedCard.displayName = 'OptimizedCard'

interface CardGridProps {
  children: React.ReactNode
  columns?: number
  gap?: number
  className?: string
}

export const CardGrid = memo<CardGridProps>(({ 
  children, 
  columns = 3, 
  gap = 4, 
  className 
}) => {
  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap * 0.25}rem`
  }), [columns, gap])

  return (
    <div className={cn("w-full", className)} style={gridStyle}>
      {children}
    </div>
  )
})
CardGrid.displayName = 'CardGrid'

// ===== DEBOUNCED SEARCH =====

interface DebouncedSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  delay?: number
  className?: string
}

export const DebouncedSearch = memo<DebouncedSearchProps>(({
  onSearch,
  placeholder = "Search...",
  delay = 300,
  className
}) => {
  const [query, setQuery] = React.useState('')
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(value)
    }, delay)
  }, [onSearch, delay])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <OptimizedInput
      value={query}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  )
})
DebouncedSearch.displayName = 'DebouncedSearch'
