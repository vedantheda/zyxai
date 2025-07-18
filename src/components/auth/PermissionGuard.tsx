'use client'

import { ReactNode } from 'react'
import { useRBAC } from '@/hooks/useRBAC'

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean // For multiple permissions
}

interface MultiplePermissionGuardProps {
  permissions: string[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean // true = AND logic, false = OR logic
}

interface RoleGuardProps {
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer'
  children: ReactNode
  fallback?: ReactNode
  allowHigher?: boolean // Allow higher roles (default: true)
}

interface RoleLevelGuardProps {
  minLevel: number
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Guard component that shows children only if user has the required permission
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { can } = useRBAC()

  if (!can(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Guard component for multiple permissions
 */
export function MultiplePermissionGuard({ 
  permissions, 
  children, 
  fallback = null, 
  requireAll = false 
}: MultiplePermissionGuardProps) {
  const { canAny, canAll } = useRBAC()

  const hasAccess = requireAll ? canAll(permissions) : canAny(permissions)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Guard component that shows children only if user has the required role
 */
export function RoleGuard({ 
  role, 
  children, 
  fallback = null, 
  allowHigher = true 
}: RoleGuardProps) {
  const { user, hasRoleLevel, roleInfo } = useRBAC()

  if (!user || !roleInfo) {
    return <>{fallback}</>
  }

  if (allowHigher) {
    // Check if user has this role level or higher
    const requiredLevel = {
      viewer: 20,
      agent: 40,
      manager: 60,
      admin: 80,
      owner: 100
    }[role]

    if (!hasRoleLevel(requiredLevel)) {
      return <>{fallback}</>
    }
  } else {
    // Exact role match
    if (user.role !== role) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

/**
 * Guard component that shows children only if user has minimum role level
 */
export function RoleLevelGuard({ minLevel, children, fallback = null }: RoleLevelGuardProps) {
  const { hasRoleLevel } = useRBAC()

  if (!hasRoleLevel(minLevel)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Admin-only guard (Admin level and above)
 */
export function AdminGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleLevelGuard minLevel={80} fallback={fallback}>
      {children}
    </RoleLevelGuard>
  )
}

/**
 * Manager-level guard (Manager level and above)
 */
export function ManagerGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleLevelGuard minLevel={60} fallback={fallback}>
      {children}
    </RoleLevelGuard>
  )
}

/**
 * Owner-only guard
 */
export function OwnerGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard role="owner" allowHigher={false} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Composite guard for common permission patterns
 */
export function FeatureGuard({ 
  feature, 
  action, 
  children, 
  fallback = null 
}: { 
  feature: string
  action: 'view' | 'create' | 'manage' | 'delete'
  children: ReactNode
  fallback?: ReactNode 
}) {
  const permission = `${feature}.${action}`
  
  return (
    <PermissionGuard permission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}
