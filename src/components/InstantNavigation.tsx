'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

// INSTANT NAVIGATION - NO MORE SLOW ROUTING!
export const useInstantNavigation = () => {
  const router = useRouter()

  const navigateInstantly = useCallback((href: string) => {
    // Prefetch the route immediately
    router.prefetch(href)
    
    // Navigate with optimistic UI
    router.push(href)
  }, [router])

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
