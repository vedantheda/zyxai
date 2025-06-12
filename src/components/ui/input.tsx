"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)
    const inputRef = ref || internalRef

    // Handle browser extension modifications after hydration
    useEffect(() => {
      if (typeof inputRef === 'object' && inputRef?.current) {
        const input = inputRef.current

        // Remove any attributes that browser extensions might add
        const extensionAttributes = [
          'data-temp-mail-org',
          'data-1password-ignore',
          'data-lpignore',
          'data-form-type'
        ]

        extensionAttributes.forEach(attr => {
          if (input.hasAttribute(attr)) {
            input.removeAttribute(attr)
          }
        })

        // Reset any inline styles that extensions might add
        if (input.style.backgroundImage && input.style.backgroundImage.includes('data:')) {
          input.style.backgroundImage = ''
        }
      }
    })

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={inputRef}
        suppressHydrationWarning={true}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
