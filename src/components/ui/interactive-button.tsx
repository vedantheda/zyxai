'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useButtonFeedback } from "@/hooks/useClickFeedback"

const interactiveButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-lg active:shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-lg active:shadow-sm",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md active:shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-lg active:shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
      feedback: {
        default: "btn-press ripple-effect",
        subtle: "interactive-element",
        none: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      feedback: "default",
    },
  }
)

export interface InteractiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof interactiveButtonVariants> {
  asChild?: boolean
  haptic?: boolean
  sound?: boolean
  loading?: boolean
  loadingText?: string
}

const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    feedback,
    asChild = false, 
    haptic = true,
    sound = false,
    loading = false,
    loadingText = "Loading...",
    children,
    onClick,
    disabled,
    ...props 
  }, ref) => {
    const { handleClick } = useButtonFeedback({ 
      haptic: haptic && !disabled, 
      sound: sound && !disabled 
    })

    const Comp = asChild ? Slot : "button"

    const handleClickWithFeedback = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return
      
      // Trigger feedback
      handleClick(event.nativeEvent)
      
      // Call original onClick
      if (onClick) {
        onClick(event)
      }
    }, [disabled, loading, handleClick, onClick])

    return (
      <Comp
        className={cn(
          interactiveButtonVariants({ variant, size, feedback, className }),
          loading && "cursor-loading",
          disabled && "disabled"
        )}
        ref={ref}
        onClick={handleClickWithFeedback}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
InteractiveButton.displayName = "InteractiveButton"

export { InteractiveButton, interactiveButtonVariants }
