'use client'

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useLinkFeedback } from "@/hooks/useClickFeedback"
import { useFastNavigation } from "@/hooks/useFastNavigation"

interface InteractiveLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: React.ReactNode
  haptic?: boolean
  sound?: boolean
  prefetch?: boolean
  showLoading?: boolean
  loadingMessage?: string
  external?: boolean
  variant?: 'default' | 'button' | 'nav' | 'subtle'
}

/**
 * Enhanced Link component with click feedback and fast navigation
 */
export const InteractiveLink = React.forwardRef<HTMLAnchorElement, InteractiveLinkProps>(
  ({
    href,
    children,
    className,
    haptic = true,
    sound = false,
    prefetch = true,
    showLoading = false,
    loadingMessage,
    external = false,
    variant = 'default',
    onClick,
    ...props
  }, ref) => {
    const { handleClick } = useLinkFeedback({ haptic, sound })
    const { navigate, prefetchOnHover } = useFastNavigation()

    const getVariantClasses = () => {
      switch (variant) {
        case 'button':
          return 'inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-150'
        case 'nav':
          return 'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent'
        case 'subtle':
          return 'text-muted-foreground hover:text-foreground transition-colors duration-150'
        default:
          return 'link-hover text-primary hover:text-primary/80 transition-colors duration-150'
      }
    }

    const handleClickWithFeedback = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
      // Trigger feedback
      handleClick(event.nativeEvent)
      
      // Handle navigation for internal links
      if (!external && href.startsWith('/')) {
        event.preventDefault()
        navigate(href, { showLoading, loadingMessage })
      }
      
      // Call original onClick
      if (onClick) {
        onClick(event)
      }
    }, [handleClick, external, href, navigate, showLoading, loadingMessage, onClick])

    const handleMouseEnter = React.useCallback(() => {
      if (prefetch && !external && href.startsWith('/')) {
        prefetchOnHover(href)
      }
    }, [prefetch, external, href, prefetchOnHover])

    // External links
    if (external || !href.startsWith('/')) {
      return (
        <a
          ref={ref}
          href={href}
          className={cn(getVariantClasses(), className)}
          onClick={handleClickWithFeedback}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    }

    // Internal links with Next.js Link
    return (
      <Link
        href={href}
        ref={ref}
        className={cn(getVariantClasses(), className)}
        onClick={handleClickWithFeedback}
        onMouseEnter={handleMouseEnter}
        {...props}
      >
        {children}
      </Link>
    )
  }
)

InteractiveLink.displayName = "InteractiveLink"

/**
 * Quick link variants for common use cases
 */
export const ButtonLink = React.forwardRef<HTMLAnchorElement, Omit<InteractiveLinkProps, 'variant'>>(
  (props, ref) => <InteractiveLink ref={ref} variant="button" {...props} />
)
ButtonLink.displayName = "ButtonLink"

export const NavLink = React.forwardRef<HTMLAnchorElement, Omit<InteractiveLinkProps, 'variant'>>(
  (props, ref) => <InteractiveLink ref={ref} variant="nav" {...props} />
)
NavLink.displayName = "NavLink"

export const SubtleLink = React.forwardRef<HTMLAnchorElement, Omit<InteractiveLinkProps, 'variant'>>(
  (props, ref) => <InteractiveLink ref={ref} variant="subtle" {...props} />
)
SubtleLink.displayName = "SubtleLink"
