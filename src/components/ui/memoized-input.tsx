'use client'
import { memo, forwardRef, useCallback } from 'react'
import { Input } from './input'
import { Textarea } from './textarea'
import { cn } from '@/lib/utils'
// Memoized Input component to prevent focus loss
export const MemoizedInput = memo(forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    className?: string
  }
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn(className)}
    {...props}
  />
)))
MemoizedInput.displayName = 'MemoizedInput'
// Memoized Textarea component to prevent focus loss
export const MemoizedTextarea = memo(forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    className?: string
  }
>(({ className, ...props }, ref) => (
  <Textarea
    ref={ref}
    className={cn(className)}
    {...props}
  />
)))
MemoizedTextarea.displayName = 'MemoizedTextarea'
// Memoized Search Input with icon
export const MemoizedSearchInput = memo(forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    className?: string
    icon?: React.ReactNode
  }
>(({ className, icon, ...props }, ref) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground">
        {icon}
      </div>
    )}
    <Input
      ref={ref}
      className={cn(icon ? 'pl-10' : '', className)}
      {...props}
    />
  </div>
)))
MemoizedSearchInput.displayName = 'MemoizedSearchInput'
// Hook for creating memoized change handlers
export const useMemoizedHandlers = () => {
  const createInputHandler = useCallback((setter: (value: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value)
    }, [])
  const createTextareaHandler = useCallback((setter: (value: string) => void) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setter(e.target.value)
    }, [])
  const createSelectHandler = useCallback((setter: (value: string) => void) =>
    (value: string) => {
      setter(value)
    }, [])
  const createCheckboxHandler = useCallback((setter: (value: boolean) => void) =>
    (checked: boolean) => {
      setter(checked)
    }, [])
  const createNumberHandler = useCallback((setter: (value: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(parseFloat(e.target.value) || 0)
    }, [])
  return {
    createInputHandler,
    createTextareaHandler,
    createSelectHandler,
    createCheckboxHandler,
    createNumberHandler
  }
}
