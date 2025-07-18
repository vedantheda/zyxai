'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { hasPermission, hasAnyPermission, hasAllPermissions, getUserPermissions, ROLES } from '@/lib/permissions/roles'
import type { User } from '@/types/database'

/**
 * Enterprise RBAC hook for role-based access control
 * Provides permission checking and role management
 */
export function useRBAC() {
  const { user } = useAuth()

  // Permission checking functions
  const can = (permission: string): boolean => {
    return hasPermission(user, permission)
  }

  const canAny = (permissions: string[]): boolean => {
    return hasAnyPermission(user, permissions)
  }

  const canAll = (permissions: string[]): boolean => {
    return hasAllPermissions(user, permissions)
  }

  // Role checking functions
  const isRole = (role: User['role']): boolean => {
    return user?.role === role
  }

  const isOwner = (): boolean => isRole('owner')
  const isAdmin = (): boolean => isRole('admin')
  const isManager = (): boolean => isRole('manager')
  const isAgent = (): boolean => isRole('agent')
  const isViewer = (): boolean => isRole('viewer')

  // Role level checking (for hierarchy)
  const hasRoleLevel = (minLevel: number): boolean => {
    if (!user?.role) return false
    const userRole = ROLES[user.role]
    return userRole ? userRole.level >= minLevel : false
  }

  // Get user's permissions
  const permissions = getUserPermissions(user)

  // Get role information
  const roleInfo = user?.role ? ROLES[user.role] : null

  return {
    // User info
    user,
    role: user?.role,
    roleInfo,
    permissions,

    // Permission checks
    can,
    canAny,
    canAll,

    // Role checks
    isRole,
    isOwner,
    isAdmin,
    isManager,
    isAgent,
    isViewer,
    hasRoleLevel,

    // Common permission groups
    canManageOrg: () => can('org.manage'),
    canManageUsers: () => can('users.manage'),
    canInviteUsers: () => can('users.invite'),
    canManageAgents: () => can('agents.manage'),
    canCreateAgents: () => can('agents.create'),
    canDeleteAgents: () => can('agents.delete'),
    canManageCampaigns: () => can('campaigns.manage'),
    canMakeCalls: () => can('calls.make'),
    canViewAnalytics: () => can('analytics.view'),
    canExportAnalytics: () => can('analytics.export'),
    canManageIntegrations: () => can('integrations.manage'),

    // Admin-level checks
    isAdminLevel: () => hasRoleLevel(80), // Admin or Owner
    isManagerLevel: () => hasRoleLevel(60), // Manager, Admin, or Owner
    isAgentLevel: () => hasRoleLevel(40), // Agent, Manager, Admin, or Owner
  }
}

/**
 * Hook for protecting components based on permissions
 */
export function usePermissionGuard(permission: string) {
  const { can, user } = useRBAC()
  
  return {
    hasPermission: can(permission),
    user,
    loading: false // Since we're using the auth context
  }
}

/**
 * Hook for protecting components based on role level
 */
export function useRoleGuard(minLevel: number) {
  const { hasRoleLevel, user, roleInfo } = useRBAC()
  
  return {
    hasAccess: hasRoleLevel(minLevel),
    user,
    userLevel: roleInfo?.level || 0,
    loading: false
  }
}
