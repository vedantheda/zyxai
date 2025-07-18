/**
 * Responsive Design Utilities
 * Mobile-first responsive components and utilities
 */

'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Breakpoint hook
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg')
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < 640) setBreakpoint('sm')
      else if (width < 768) setBreakpoint('md')
      else if (width < 1024) setBreakpoint('lg')
      else if (width < 1280) setBreakpoint('xl')
      else setBreakpoint('2xl')
    }
    
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])
  
  return breakpoint
}

// Mobile detection hook
export function useIsMobile() {
  const breakpoint = useBreakpoint()
  return breakpoint === 'sm' || breakpoint === 'md'
}

// Responsive container
export function ResponsiveContainer({ 
  children, 
  className = '',
  maxWidth = '7xl'
}: {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
}) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  }
  
  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}

// Responsive grid
export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 6,
  className = ''
}: {
  children: React.ReactNode
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: number
  className?: string
}) {
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`
  ].filter(Boolean).join(' ')
  
  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  )
}

// Responsive stack (vertical on mobile, horizontal on desktop)
export function ResponsiveStack({ 
  children, 
  direction = 'horizontal',
  spacing = 4,
  className = ''
}: {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical'
  spacing?: number
  className?: string
}) {
  const stackClasses = direction === 'horizontal' 
    ? `flex flex-col md:flex-row gap-${spacing}`
    : `flex flex-col gap-${spacing}`
  
  return (
    <div className={cn(stackClasses, className)}>
      {children}
    </div>
  )
}

// Show/hide based on breakpoint
export function ShowOn({ 
  breakpoint, 
  children 
}: { 
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode 
}) {
  const classes = {
    sm: 'block sm:hidden',
    md: 'hidden sm:block md:hidden',
    lg: 'hidden md:block lg:hidden',
    xl: 'hidden lg:block xl:hidden',
    '2xl': 'hidden xl:block'
  }
  
  return (
    <div className={classes[breakpoint]}>
      {children}
    </div>
  )
}

export function HideOn({ 
  breakpoint, 
  children 
}: { 
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode 
}) {
  const classes = {
    sm: 'hidden sm:block',
    md: 'block sm:hidden md:block',
    lg: 'block md:hidden lg:block',
    xl: 'block lg:hidden xl:block',
    '2xl': 'block xl:hidden'
  }
  
  return (
    <div className={classes[breakpoint]}>
      {children}
    </div>
  )
}

// Responsive text sizes
export function ResponsiveText({ 
  children, 
  size = 'base',
  className = ''
}: {
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  className?: string
}) {
  const sizeClasses = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl',
    '4xl': 'text-4xl sm:text-5xl'
  }
  
  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  )
}

// Responsive spacing
export function ResponsiveSpacing({ 
  children, 
  padding = { sm: 4, lg: 8 },
  margin = { sm: 2, lg: 4 },
  className = ''
}: {
  children: React.ReactNode
  padding?: { sm?: number, md?: number, lg?: number, xl?: number }
  margin?: { sm?: number, md?: number, lg?: number, xl?: number }
  className?: string
}) {
  const paddingClasses = [
    padding.sm && `p-${padding.sm}`,
    padding.md && `md:p-${padding.md}`,
    padding.lg && `lg:p-${padding.lg}`,
    padding.xl && `xl:p-${padding.xl}`
  ].filter(Boolean).join(' ')
  
  const marginClasses = [
    margin.sm && `m-${margin.sm}`,
    margin.md && `md:m-${margin.md}`,
    margin.lg && `lg:m-${margin.lg}`,
    margin.xl && `xl:m-${margin.xl}`
  ].filter(Boolean).join(' ')
  
  return (
    <div className={cn(paddingClasses, marginClasses, className)}>
      {children}
    </div>
  )
}

// Mobile drawer/desktop sidebar
export function ResponsiveNavigation({ 
  children, 
  isOpen, 
  onClose 
}: {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
}) {
  const isMobile = useIsMobile()
  
  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Mobile drawer */}
        <div className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          {children}
        </div>
      </>
    )
  }
  
  // Desktop sidebar
  return (
    <div className="hidden lg:block w-64 bg-background border-r">
      {children}
    </div>
  )
}

// Responsive card layout
export function ResponsiveCardGrid({ 
  children,
  minCardWidth = 300,
  gap = 6,
  className = ''
}: {
  children: React.ReactNode
  minCardWidth?: number
  gap?: number
  className?: string
}) {
  return (
    <div 
      className={cn(`grid gap-${gap}`, className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`
      }}
    >
      {children}
    </div>
  )
}

// Responsive table wrapper
export function ResponsiveTable({ 
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-full inline-block align-middle">
        {children}
      </div>
    </div>
  )
}
