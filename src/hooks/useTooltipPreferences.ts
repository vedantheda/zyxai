'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'

interface TooltipPreferences {
  enabled: boolean
  showForNewUsers: boolean
  hideAfterDays: number
  categories: {
    dashboard: boolean
    agents: boolean
    calls: boolean
    contacts: boolean
    campaigns: boolean
    team: boolean
    settings: boolean
  }
}

const DEFAULT_PREFERENCES: TooltipPreferences = {
  enabled: true,
  showForNewUsers: true,
  hideAfterDays: 30, // Hide tooltips after 30 days for experienced users
  categories: {
    dashboard: true,
    agents: true,
    calls: true,
    contacts: true,
    campaigns: true,
    team: true,
    settings: true
  }
}

/**
 * Hook for managing user tooltip preferences
 * Automatically hides tooltips for experienced users
 */
export function useTooltipPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<TooltipPreferences>(DEFAULT_PREFERENCES)
  const [isNewUser, setIsNewUser] = useState(true)
  const [loading, setLoading] = useState(true)

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tooltip-preferences')
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      }

      // Check if user is new (account created within hideAfterDays)
      if (user?.created_at) {
        const accountAge = Date.now() - new Date(user.created_at).getTime()
        const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)
        setIsNewUser(daysSinceCreation <= preferences.hideAfterDays)
      }
    } catch (error) {
      console.error('Error loading tooltip preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [user, preferences.hideAfterDays])

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: Partial<TooltipPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)
    localStorage.setItem('tooltip-preferences', JSON.stringify(updated))
  }, [preferences])

  // Check if tooltips should be shown
  const shouldShowTooltips = useCallback((category?: keyof TooltipPreferences['categories']) => {
    if (!preferences.enabled) return false
    if (preferences.showForNewUsers && !isNewUser) return false
    if (category && !preferences.categories[category]) return false
    return true
  }, [preferences, isNewUser])

  // Enable/disable all tooltips
  const toggleTooltips = useCallback((enabled: boolean) => {
    savePreferences({ enabled })
  }, [savePreferences])

  // Enable/disable tooltips for specific category
  const toggleCategory = useCallback((category: keyof TooltipPreferences['categories'], enabled: boolean) => {
    savePreferences({
      categories: {
        ...preferences.categories,
        [category]: enabled
      }
    })
  }, [preferences.categories, savePreferences])

  // Mark user as experienced (hide tooltips)
  const markAsExperienced = useCallback(() => {
    savePreferences({ showForNewUsers: false })
    setIsNewUser(false)
  }, [savePreferences])

  // Reset to show tooltips again
  const resetTooltips = useCallback(() => {
    savePreferences({
      enabled: true,
      showForNewUsers: true,
      categories: DEFAULT_PREFERENCES.categories
    })
    setIsNewUser(true)
  }, [savePreferences])

  // Get tooltip delay based on user experience
  const getTooltipDelay = useCallback(() => {
    return isNewUser ? 500 : 300 // Longer delay for new users
  }, [isNewUser])

  return {
    preferences,
    loading,
    isNewUser,
    shouldShowTooltips,
    toggleTooltips,
    toggleCategory,
    markAsExperienced,
    resetTooltips,
    getTooltipDelay,
    savePreferences
  }
}

/**
 * Hook for tracking tooltip interactions
 */
export function useTooltipTracking() {
  const [viewedTooltips, setViewedTooltips] = useState<Set<string>>(new Set())

  // Load viewed tooltips from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('viewed-tooltips')
      if (stored) {
        setViewedTooltips(new Set(JSON.parse(stored)))
      }
    } catch (error) {
      console.error('Error loading viewed tooltips:', error)
    }
  }, [])

  // Mark tooltip as viewed
  const markTooltipViewed = useCallback((tooltipId: string) => {
    setViewedTooltips(prev => {
      const updated = new Set(prev)
      updated.add(tooltipId)
      localStorage.setItem('viewed-tooltips', JSON.stringify(Array.from(updated)))
      return updated
    })
  }, [])

  // Check if tooltip has been viewed
  const hasViewedTooltip = useCallback((tooltipId: string) => {
    return viewedTooltips.has(tooltipId)
  }, [viewedTooltips])

  // Reset viewed tooltips
  const resetViewedTooltips = useCallback(() => {
    setViewedTooltips(new Set())
    localStorage.removeItem('viewed-tooltips')
  }, [])

  return {
    hasViewedTooltip,
    markTooltipViewed,
    resetViewedTooltips,
    viewedCount: viewedTooltips.size
  }
}

/**
 * Smart tooltip hook that combines preferences and tracking
 */
export function useSmartTooltip(tooltipId: string, category?: keyof TooltipPreferences['categories']) {
  const { shouldShowTooltips, getTooltipDelay } = useTooltipPreferences()
  const { hasViewedTooltip, markTooltipViewed } = useTooltipTracking()

  const shouldShow = shouldShowTooltips(category) && !hasViewedTooltip(tooltipId)
  const delay = getTooltipDelay()

  const onTooltipView = useCallback(() => {
    markTooltipViewed(tooltipId)
  }, [tooltipId, markTooltipViewed])

  return {
    shouldShow,
    delay,
    onTooltipView
  }
}
