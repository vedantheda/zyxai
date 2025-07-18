'use client'

import { ReactNode } from 'react'
import { HelpCircle, Info, Lightbulb } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  content: string | ReactNode
  children?: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  variant?: 'help' | 'info' | 'tip'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
  delayDuration?: number
}

/**
 * Enhanced tooltip component for user guidance and help
 * Provides contextual help for first-time users
 */
export function HelpTooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  variant = 'help',
  size = 'md',
  showIcon = true,
  className,
  delayDuration = 300
}: HelpTooltipProps) {
  const getIcon = () => {
    switch (variant) {
      case 'info':
        return <Info className="w-4 h-4" />
      case 'tip':
        return <Lightbulb className="w-4 h-4" />
      default:
        return <HelpCircle className="w-4 h-4" />
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'info':
        return 'text-blue-500 hover:text-blue-600'
      case 'tip':
        return 'text-yellow-500 hover:text-yellow-600'
      default:
        return 'text-gray-400 hover:text-gray-600'
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3'
      case 'lg':
        return 'w-5 h-5'
      default:
        return 'w-4 h-4'
    }
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            showIcon && (
              <button
                type="button"
                className={cn(
                  'inline-flex items-center justify-center transition-colors',
                  getIconColor(),
                  className
                )}
              >
                <span className={getSizeClass()}>
                  {getIcon()}
                </span>
              </button>
            )
          )}
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          {typeof content === 'string' ? (
            <p className="text-sm">{content}</p>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Quick tooltip for buttons and interactive elements
 */
export function QuickTooltip({
  content,
  children,
  side = 'top'
}: {
  content: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Feature explanation tooltip with rich content
 */
export function FeatureTooltip({
  title,
  description,
  tips,
  children,
  side = 'top'
}: {
  title: string
  description: string
  tips?: string[]
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-gray-600">{description}</p>
            {tips && tips.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Tips:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Keyboard shortcut tooltip
 */
export function ShortcutTooltip({
  description,
  shortcut,
  children,
  side = 'top'
}: {
  description: string
  shortcut: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{description}</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border rounded">
              {shortcut}
            </kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Status tooltip with colored indicators
 */
export function StatusTooltip({
  status,
  description,
  children,
  side = 'top'
}: {
  status: 'success' | 'warning' | 'error' | 'info'
  description: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800'
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800'
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className={cn('border', getStatusColor())}>
          <p className="text-sm font-medium">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Progress tooltip for showing completion status
 */
export function ProgressTooltip({
  current,
  total,
  label,
  children,
  side = 'top'
}: {
  current: number
  total: number
  label: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  const percentage = Math.round((current / total) * 100)

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          <div className="space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {current}/{total} ({percentage}%)
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
