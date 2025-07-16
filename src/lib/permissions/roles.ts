import type { User } from '@/types/database'

export type UserRole = User['role']

export interface Permission {
  id: string
  name: string
  description: string
  category: string
}

export interface RoleDefinition {
  id: UserRole
  name: string
  description: string
  level: number // Higher number = more permissions
  permissions: string[]
  inheritsFrom?: UserRole[]
}

// Define all available permissions
export const PERMISSIONS: Record<string, Permission> = {
  // Organization Management
  'org.manage': {
    id: 'org.manage',
    name: 'Manage Organization',
    description: 'Full organization settings and configuration',
    category: 'Organization'
  },
  'org.billing': {
    id: 'org.billing',
    name: 'Manage Billing',
    description: 'Access billing and subscription settings',
    category: 'Organization'
  },
  'org.settings': {
    id: 'org.settings',
    name: 'Organization Settings',
    description: 'Modify organization settings and preferences',
    category: 'Organization'
  },

  // User Management
  'users.invite': {
    id: 'users.invite',
    name: 'Invite Users',
    description: 'Send invitations to new team members',
    category: 'User Management'
  },
  'users.manage': {
    id: 'users.manage',
    name: 'Manage Users',
    description: 'Edit user roles and remove team members',
    category: 'User Management'
  },
  'users.view': {
    id: 'users.view',
    name: 'View Users',
    description: 'View team member list and basic information',
    category: 'User Management'
  },

  // AI Agents
  'agents.create': {
    id: 'agents.create',
    name: 'Create Agents',
    description: 'Create new AI agents and assistants',
    category: 'AI Agents'
  },
  'agents.manage': {
    id: 'agents.manage',
    name: 'Manage Agents',
    description: 'Edit and configure AI agents',
    category: 'AI Agents'
  },
  'agents.delete': {
    id: 'agents.delete',
    name: 'Delete Agents',
    description: 'Remove AI agents from the organization',
    category: 'AI Agents'
  },
  'agents.view': {
    id: 'agents.view',
    name: 'View Agents',
    description: 'View AI agents and their configurations',
    category: 'AI Agents'
  },

  // Campaigns
  'campaigns.create': {
    id: 'campaigns.create',
    name: 'Create Campaigns',
    description: 'Create new call campaigns',
    category: 'Campaigns'
  },
  'campaigns.manage': {
    id: 'campaigns.manage',
    name: 'Manage Campaigns',
    description: 'Edit and configure campaigns',
    category: 'Campaigns'
  },
  'campaigns.execute': {
    id: 'campaigns.execute',
    name: 'Execute Campaigns',
    description: 'Start, stop, and monitor campaigns',
    category: 'Campaigns'
  },
  'campaigns.view': {
    id: 'campaigns.view',
    name: 'View Campaigns',
    description: 'View campaign details and results',
    category: 'Campaigns'
  },

  // Contacts
  'contacts.create': {
    id: 'contacts.create',
    name: 'Create Contacts',
    description: 'Add new contacts to the system',
    category: 'Contacts'
  },
  'contacts.manage': {
    id: 'contacts.manage',
    name: 'Manage Contacts',
    description: 'Edit and organize contact information',
    category: 'Contacts'
  },
  'contacts.delete': {
    id: 'contacts.delete',
    name: 'Delete Contacts',
    description: 'Remove contacts from the system',
    category: 'Contacts'
  },
  'contacts.view': {
    id: 'contacts.view',
    name: 'View Contacts',
    description: 'Access contact information and history',
    category: 'Contacts'
  },

  // Calls
  'calls.make': {
    id: 'calls.make',
    name: 'Make Calls',
    description: 'Initiate outbound calls',
    category: 'Calls'
  },
  'calls.receive': {
    id: 'calls.receive',
    name: 'Receive Calls',
    description: 'Handle inbound calls',
    category: 'Calls'
  },
  'calls.view': {
    id: 'calls.view',
    name: 'View Calls',
    description: 'Access call logs and recordings',
    category: 'Calls'
  },

  // Analytics
  'analytics.view': {
    id: 'analytics.view',
    name: 'View Analytics',
    description: 'Access reports and analytics dashboards',
    category: 'Analytics'
  },
  'analytics.export': {
    id: 'analytics.export',
    name: 'Export Analytics',
    description: 'Export reports and data',
    category: 'Analytics'
  },

  // Integrations
  'integrations.manage': {
    id: 'integrations.manage',
    name: 'Manage Integrations',
    description: 'Configure third-party integrations',
    category: 'Integrations'
  },
  'integrations.view': {
    id: 'integrations.view',
    name: 'View Integrations',
    description: 'View integration status and settings',
    category: 'Integrations'
  }
}

// Define role hierarchy and permissions
export const ROLES: Record<UserRole, RoleDefinition> = {
  owner: {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all features and settings',
    level: 100,
    permissions: Object.keys(PERMISSIONS) // All permissions
  },

  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access except billing and organization deletion',
    level: 80,
    permissions: [
      'org.settings',
      'users.invite',
      'users.manage',
      'users.view',
      'agents.create',
      'agents.manage',
      'agents.delete',
      'agents.view',
      'campaigns.create',
      'campaigns.manage',
      'campaigns.execute',
      'campaigns.view',
      'contacts.create',
      'contacts.manage',
      'contacts.delete',
      'contacts.view',
      'calls.make',
      'calls.receive',
      'calls.view',
      'analytics.view',
      'analytics.export',
      'integrations.manage',
      'integrations.view'
    ]
  },

  manager: {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage team members and most features',
    level: 60,
    permissions: [
      'users.invite',
      'users.view',
      'agents.create',
      'agents.manage',
      'agents.view',
      'campaigns.create',
      'campaigns.manage',
      'campaigns.execute',
      'campaigns.view',
      'contacts.create',
      'contacts.manage',
      'contacts.view',
      'calls.make',
      'calls.receive',
      'calls.view',
      'analytics.view',
      'analytics.export',
      'integrations.view'
    ]
  },

  agent: {
    id: 'agent',
    name: 'Agent',
    description: 'Can handle calls and manage contacts',
    level: 40,
    permissions: [
      'users.view',
      'agents.view',
      'campaigns.view',
      'contacts.create',
      'contacts.manage',
      'contacts.view',
      'calls.make',
      'calls.receive',
      'calls.view',
      'analytics.view'
    ]
  },

  viewer: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to most features',
    level: 20,
    permissions: [
      'users.view',
      'agents.view',
      'campaigns.view',
      'contacts.view',
      'calls.view',
      'analytics.view',
      'integrations.view'
    ]
  }
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  
  const role = ROLES[user.role]
  if (!role) return false
  
  return role.permissions.includes(permission)
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user) return false
  
  return permissions.some(permission => hasPermission(user, permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
  if (!user) return false
  
  return permissions.every(permission => hasPermission(user, permission))
}

/**
 * Get all permissions for a user's role
 */
export function getUserPermissions(user: User | null): string[] {
  if (!user) return []
  
  const role = ROLES[user.role]
  return role ? role.permissions : []
}

/**
 * Check if a user can manage another user (based on role hierarchy)
 */
export function canManageUser(manager: User | null, target: User | null): boolean {
  if (!manager || !target) return false
  
  // Users can't manage themselves through this function
  if (manager.id === target.id) return false
  
  const managerRole = ROLES[manager.role]
  const targetRole = ROLES[target.role]
  
  if (!managerRole || !targetRole) return false
  
  // Manager must have user management permission and higher level than target
  return hasPermission(manager, 'users.manage') && managerRole.level > targetRole.level
}

/**
 * Get roles that a user can assign to others
 */
export function getAssignableRoles(user: User | null): UserRole[] {
  if (!user) return []
  
  const userRole = ROLES[user.role]
  if (!userRole || !hasPermission(user, 'users.manage')) return []
  
  // Users can only assign roles with lower level than their own
  return Object.values(ROLES)
    .filter(role => role.level < userRole.level)
    .map(role => role.id)
}

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return role in ROLES
}

/**
 * Get role display information
 */
export function getRoleInfo(role: UserRole): RoleDefinition | null {
  return ROLES[role] || null
}
