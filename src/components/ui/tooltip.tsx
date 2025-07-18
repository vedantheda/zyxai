"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple tooltip implementation without Radix UI dependency
interface TooltipContextType {
  open: boolean
  setOpen: (open: boolean) => void
  delayDuration: number
}

const TooltipContext = React.createContext<TooltipContextType | null>(null)

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({
  children,
  delayDuration = 300
}) => {
  return (
    <div>
      {children}
    </div>
  )
}

interface TooltipProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  open: controlledOpen,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const value = React.useMemo(() => ({
    open,
    setOpen,
    delayDuration: 300
  }), [open, setOpen])

  return (
    <TooltipContext.Provider value={value}>
      {children}
    </TooltipContext.Provider>
  )
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, asChild }) => {
  const context = React.useContext(TooltipContext)

  const handleMouseEnter = () => {
    context?.setOpen(true)
  }

  const handleMouseLeave = () => {
    context?.setOpen(false)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      ...children.props
    })
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block"
    >
      {children}
    </div>
  )
}

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, className, side = 'top', sideOffset = 4, ...props }, ref) => {
    const context = React.useContext(TooltipContext)

    if (!context?.open) return null

    const getPositionClasses = () => {
      switch (side) {
        case 'top':
          return "bottom-full left-1/2 transform -translate-x-1/2 mb-2"
        case 'bottom':
          return "top-full left-1/2 transform -translate-x-1/2 mt-2"
        case 'left':
          return "right-full top-1/2 transform -translate-y-1/2 mr-2"
        case 'right':
          return "left-full top-1/2 transform -translate-y-1/2 ml-2"
        default:
          return "bottom-full left-1/2 transform -translate-x-1/2 mb-2"
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 overflow-hidden rounded-md border bg-white px-3 py-1.5 text-sm text-gray-900 shadow-lg",
          "transition-opacity duration-200",
          getPositionClasses(),
          className
        )}
        style={{
          marginTop: side === 'bottom' ? sideOffset : undefined,
          marginBottom: side === 'top' ? sideOffset : undefined,
          marginLeft: side === 'right' ? sideOffset : undefined,
          marginRight: side === 'left' ? sideOffset : undefined,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
