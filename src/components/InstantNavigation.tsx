'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
// INSTANT NAVIGATION - NO MORE SLOW ROUTING!
export const useInstantNavigation = () => {
  const router = useRouter()
  const navigationTimeoutRef = useRef<NodeJS.Timeout>()

  const navigateInstantly = useCallback((href: string) => {
    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }

    // Prefetch the route immediately if not already prefetched
    router.prefetch(href)

    // Navigate immediately - NO LOADING POPUP
    router.push(href)
  }, [router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  return { navigateInstantly }
}

// Enhanced Link component with instant navigation
export const InstantLink = ({
  href,
  children,
  className,
  ...props
}: {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}) => {
  const { navigateInstantly } = useInstantNavigation()

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    navigateInstantly(href)
  }, [href, navigateInstantly])

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </a>
  )
}

// Button with instant navigation
export const InstantButton = ({
  href,
  children,
  onClick,
  ...props
}: {
  href?: string
  children: React.ReactNode
  onClick?: () => void
  [key: string]: any
}) => {
  const { navigateInstantly } = useInstantNavigation()

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    }
    if (href) {
      navigateInstantly(href)
    }
  }, [href, onClick, navigateInstantly])

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}
