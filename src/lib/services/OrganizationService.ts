// ZyxAI Organization Service
// Handles organization management, user roles, and multi-tenant operations

import { supabase, supabaseAdmin } from '@/lib/supabase'
import { Organization, User, BusinessNiche, AgentTemplate } from '@/types/database'

export class OrganizationService {

  // Create a new organization
  static async createOrganization(data: {
    name: string
    slug: string
    description?: string
    industry?: string
    website?: string
    phone?: string
  }): Promise<{ organization: Organization | null; error: string | null }> {
    try {
      // Check if slug is available
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', data.slug)
        .single()

      if (existing) {
        return { organization: null, error: 'Organization slug already exists' }
      }

      // Create organization
      const { data: organization, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description,
          industry: data.industry,
          website: data.website,
          phone: data.phone,
          subscription_tier: 'starter',
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days trial
        })
        .select()
        .single()

      if (error) {
        return { organization: null, error: error.message }
      }

      return { organization, error: null }
    } catch (error) {
      return { organization: null, error: 'Failed to create organization' }
    }
  }

  // Add user to organization
  static async addUserToOrganization(
    userId: string,
    organizationId: string,
    role: User['role'] = 'admin',
    userData: {
      email: string
      first_name?: string
      last_name?: string
    }
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          organization_id: organizationId,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role
        })
        .select()
        .single()

      if (error) {
        return { user: null, error: error.message }
      }

      return { user, error: null }
    } catch (error) {
      return { user: null, error: 'Failed to add user to organization' }
    }
  }

  // Get organization by ID
  static async getOrganization(id: string): Promise<{ organization: Organization | null; error: string | null }> {
    try {
      const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { organization: null, error: error.message }
      }

      return { organization, error: null }
    } catch (error) {
      return { organization: null, error: 'Failed to fetch organization' }
    }
  }

  // Get organization by slug
  static async getOrganizationBySlug(slug: string): Promise<{ organization: Organization | null; error: string | null }> {
    try {
      const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        return { organization: null, error: error.message }
      }

      return { organization, error: null }
    } catch (error) {
      return { organization: null, error: 'Failed to fetch organization' }
    }
  }

  // Get user's organization
  static async getUserOrganization(userId: string): Promise<{ organization: Organization | null; user: User | null; error: string | null }> {
    try {
      console.log('🏢 OrganizationService: Fetching user organization for:', userId)

      // Check if supabase client is available
      if (!supabase) {
        console.error('🚨 OrganizationService: Supabase client is null!')
        return { organization: null, user: null, error: 'Database connection unavailable' }
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', userId)
        .maybeSingle()

      if (userError) {
        console.error('🚨 OrganizationService: Database error:', userError)
        return { organization: null, user: null, error: `Database error: ${userError.message}` }
      }

      console.log('🏢 OrganizationService: Query result:', {
        hasUser: !!user,
        userEmail: user?.email,
        hasOrganization: !!user?.organization,
        organizationName: user?.organization?.name
      })

      // If user doesn't exist in our users table, they need to complete their profile
      if (!user) {
        console.log('🏢 OrganizationService: User not found in users table - needs profile completion')
        return {
          organization: null,
          user: null,
          error: 'User profile incomplete. Please complete your account setup.'
        }
      }

      console.log('🏢 OrganizationService: User found:', user.email, 'Organization:', user.organization?.name || 'None')

      return {
        organization: user.organization as Organization,
        user: user as User,
        error: null
      }
    } catch (error: any) {
      console.error('🚨 OrganizationService: Unexpected error:', error)
      return { organization: null, user: null, error: `Failed to fetch user organization: ${error.message}` }
    }
  }

  // Update organization
  static async updateOrganization(
    id: string,
    updates: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ organization: Organization | null; error: string | null }> {
    try {
      const { data: organization, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { organization: null, error: error.message }
      }

      return { organization, error: null }
    } catch (error) {
      return { organization: null, error: 'Failed to update organization' }
    }
  }

  // Get organization members
  static async getOrganizationMembers(organizationId: string): Promise<{ members: User[]; error: string | null }> {
    try {
      const { data: members, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        return { members: [], error: error.message }
      }

      return { members: members || [], error: null }
    } catch (error) {
      return { members: [], error: 'Failed to fetch organization members' }
    }
  }

  // Update user role
  static async updateUserRole(
    userId: string,
    role: User['role']
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { user: null, error: error.message }
      }

      return { user, error: null }
    } catch (error) {
      return { user: null, error: 'Failed to update user role' }
    }
  }

  // Get available business niches
  static async getBusinessNiches(): Promise<{ niches: BusinessNiche[]; error: string | null }> {
    try {
      const { data: niches, error } = await supabase
        .from('business_niches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        return { niches: [], error: error.message }
      }

      return { niches: niches || [], error: null }
    } catch (error) {
      return { niches: [], error: 'Failed to fetch business niches' }
    }
  }

  // Get agent templates for a niche
  static async getAgentTemplates(nicheId: string): Promise<{ templates: AgentTemplate[]; error: string | null }> {
    try {
      const { data: templates, error } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('niche_id', nicheId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        return { templates: [], error: error.message }
      }

      return { templates: templates || [], error: null }
    } catch (error) {
      return { templates: [], error: 'Failed to fetch agent templates' }
    }
  }

  // Check if user has permission
  static hasPermission(user: User, requiredRole: User['role']): boolean {
    const roleHierarchy: Record<User['role'], number> = {
      viewer: 1,
      agent: 2,
      manager: 3,
      admin: 4,
      owner: 5
    }

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  }

  // Generate organization slug from name
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
  }

  // Validate organization slug
  static validateSlug(slug: string): { valid: boolean; error?: string } {
    if (!slug || slug.length < 3) {
      return { valid: false, error: 'Slug must be at least 3 characters long' }
    }

    if (slug.length > 50) {
      return { valid: false, error: 'Slug must be less than 50 characters' }
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' }
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { valid: false, error: 'Slug cannot start or end with a hyphen' }
    }

    return { valid: true }
  }
}
