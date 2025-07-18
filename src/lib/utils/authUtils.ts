/**
 * Authentication utility functions
 */

import { supabase } from '@/lib/supabase'

/**
 * Check if a user needs to complete onboarding
 */
export async function checkUserOnboardingStatus(userId: string): Promise<{
  needsOnboarding: boolean
  hasProfile: boolean
  hasOrganization: boolean
  error?: string
}> {
  try {
    // Check if user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      return {
        needsOnboarding: true,
        hasProfile: false,
        hasOrganization: false,
        error: userError.message
      }
    }

    const hasProfile = !!user
    const hasOrganization = !!(user?.organization)
    const needsOnboarding = !hasProfile || !hasOrganization

    return {
      needsOnboarding,
      hasProfile,
      hasOrganization
    }
  } catch (error: any) {
    return {
      needsOnboarding: true,
      hasProfile: false,
      hasOrganization: false,
      error: error.message
    }
  }
}

/**
 * Redirect user to appropriate onboarding step
 */
export function redirectToOnboarding(hasProfile: boolean, hasOrganization: boolean) {
  if (!hasProfile) {
    // User doesn't exist in users table - needs complete signup
    window.location.href = '/onboarding'
  } else if (!hasOrganization) {
    // User exists but no organization - needs org setup
    window.location.href = '/onboarding/organization'
  } else {
    // User has everything - shouldn't need onboarding
    window.location.href = '/dashboard'
  }
}

/**
 * Get user-friendly error message for organization loading issues
 */
export function getOrganizationErrorMessage(error: string): {
  title: string
  message: string
  actionText: string
  actionUrl: string
} {
  if (error.includes('timed out')) {
    return {
      title: 'Connection Timeout',
      message: 'The request took too long to complete. Please try again.',
      actionText: 'Try Again',
      actionUrl: window.location.href
    }
  }

  if (error.includes('User profile not found') || error.includes('profile incomplete')) {
    return {
      title: 'Account Setup Required',
      message: 'Your account needs to be set up. You\'ll be redirected to complete the process.',
      actionText: 'Complete Setup',
      actionUrl: '/onboarding'
    }
  }

  if (error.includes('No organization found') || error.includes('organization setup')) {
    return {
      title: 'Organization Required',
      message: 'You need to create or join an organization to continue.',
      actionText: 'Setup Organization',
      actionUrl: '/onboarding/organization'
    }
  }

  if (error.includes('Database error')) {
    return {
      title: 'Database Connection Issue',
      message: 'There\'s a temporary issue connecting to our servers. Please try again.',
      actionText: 'Try Again',
      actionUrl: window.location.href
    }
  }

  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again or contact support.',
    actionText: 'Try Again',
    actionUrl: window.location.href
  }
}

/**
 * Check if current path requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/privacy',
    '/terms',
    '/about',
    '/contact'
  ]

  const publicPatterns = [
    /^\/invite\//, // Invitation pages
    /^\/api\//, // API routes (handled separately)
    /^\/debug\//, // Debug pages (for development)
  ]

  // Check exact matches
  if (publicPaths.includes(pathname)) {
    return false
  }

  // Check pattern matches
  for (const pattern of publicPatterns) {
    if (pattern.test(pathname)) {
      return false
    }
  }

  return true
}

/**
 * Check if current path requires organization
 */
export function requiresOrganization(pathname: string): boolean {
  const orgRequiredPaths = [
    '/dashboard',
    '/agents',
    '/campaigns',
    '/contacts',
    '/integrations',
    '/settings',
    '/analytics'
  ]

  const orgRequiredPatterns = [
    /^\/dashboard\//, // All dashboard pages
    /^\/agents\//, // All agent pages
    /^\/campaigns\//, // All campaign pages
    /^\/contacts\//, // All contact pages
  ]

  // Check exact matches
  if (orgRequiredPaths.includes(pathname)) {
    return true
  }

  // Check pattern matches
  for (const pattern of orgRequiredPatterns) {
    if (pattern.test(pathname)) {
      return true
    }
  }

  return false
}
