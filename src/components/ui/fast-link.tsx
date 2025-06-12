'use client'

import React from 'react'
import { useFastNavigation } from '@/hooks/useFastNavigation'
import { cn } from '@/lib/utils'

interface FastLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetchOnHover?: boolean
  showLoading?: boolean
  loadingMessage?: string
  instant?: boolean
  [key: string]: any
}

/**
 * Optimized Link component for fast navigation
 * Includes prefetching, loading states, and performance optimizations
 */
export function FastLink({
  href,
  children,
  className,
  prefetchOnHover = true,
  showLoading = true,
  loadingMessage,
  instant = false,
  ...props
}: FastLinkProps) {
  const { navigate, navigateInstantly, prefetchOnHover: prefetch } = useFastNavigation()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // Always navigate instantly - no loading popup
    navigate(href)
  }

  const handleMouseEnter = () => {
    if (prefetchOnHover) {
      prefetch(href)
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </a>
  )
}

/**
 * Fast Link for buttons
 */
export function FastButton({
  href,
  children,
  className,
  onClick,
  prefetchOnHover = true,
  showLoading = true,
  loadingMessage,
  instant = false,
  ...props
}: FastLinkProps & { onClick?: () => void }) {
  const { navigate, navigateInstantly, prefetchOnHover: prefetch } = useFastNavigation()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (onClick) {
      onClick()
    }

    if (href) {
      // Always navigate instantly - no loading popup
      navigate(href)
    }
  }

  const handleMouseEnter = () => {
    if (prefetchOnHover && href) {
      prefetch(href)
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </button>
  )
}
