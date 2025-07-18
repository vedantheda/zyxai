/**
 * Accessibility Enhancements
 * WCAG 2.1 AA compliant components and utilities
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// Focus trap for modals and dialogs
export function FocusTrap({ 
  children, 
  active = true,
  className = ''
}: {
  children: React.ReactNode
  active?: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!active || !containerRef.current) return
    
    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()
    
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [active])
  
  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// Skip to content link
export function SkipToContent({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 transition-all"
    >
      Skip to main content
    </a>
  )
}

// Screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

// Accessible button with proper focus states
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'default',
  className = '',
  ariaLabel,
  ariaDescribedBy,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  [key: string]: any
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  }
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    default: 'h-10 py-2 px-4',
    lg: 'h-11 px-8'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Accessible form field with proper labeling
export function AccessibleFormField({
  label,
  children,
  error,
  description,
  required = false,
  className = ''
}: {
  label: string
  children: React.ReactNode
  error?: string
  description?: string
  required?: boolean
  className?: string
}) {
  const fieldId = React.useId()
  const errorId = `${fieldId}-error`
  const descriptionId = `${fieldId}-description`
  
  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': [
            description ? descriptionId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required
        })}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible loading indicator
export function AccessibleLoading({ 
  label = 'Loading...',
  size = 'default',
  className = ''
}: {
  label?: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('animate-spin rounded-full border-2 border-muted border-t-primary', sizeClasses[size])}
        role="status"
        aria-label={label}
      />
      <ScreenReaderOnly>{label}</ScreenReaderOnly>
    </div>
  )
}

// Accessible progress bar
export function AccessibleProgress({
  value,
  max = 100,
  label,
  className = ''
}: {
  value: number
  max?: number
  label?: string
  className?: string
}) {
  const percentage = Math.round((value / max) * 100)
  
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className="w-full bg-muted rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${percentage}%`}
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Accessible tooltip
export function AccessibleTooltip({
  children,
  content,
  side = 'top',
  className = ''
}: {
  children: React.ReactNode
  content: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = React.useId()
  
  const sideClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? tooltipId : undefined}
        className={className}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-sm bg-popover text-popover-foreground border rounded shadow-md',
            sideClasses[side]
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// Accessible announcement for screen readers
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = false
}: {
  children: React.ReactNode
  politeness?: 'off' | 'polite' | 'assertive'
  atomic?: boolean
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  )
}

// High contrast mode detection
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return isHighContrast
}

// Reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return prefersReducedMotion
}
