import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { EmailService } from '@/lib/email/EmailService'
import type { Database, UserInvitation, User } from '@/types/database'

// Create a separate client for auth operations
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface SendInvitationParams {
  organizationId: string
  invitedBy: string
  email: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  message?: string
}

interface AcceptInvitationParams {
  token: string
  password: string
  firstName?: string
  lastName?: string
}

interface InvitationResult {
  success: boolean
  invitation?: UserInvitation
  user?: User
  error?: string
}

export class InvitationService {
  /**
   * Send an invitation to join an organization
   */
  static async sendInvitation(params: SendInvitationParams): Promise<InvitationResult> {
    try {
      const { organizationId, invitedBy, email, firstName, lastName, role, message } = params

      // Check if user already exists in the organization
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', email)
        .eq('organization_id', organizationId)
        .single()

      if (existingUser) {
        return {
          success: false,
          error: 'User is already a member of this organization'
        }
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabaseAdmin
        .from('user_invitations')
        .select('id, status')
        .eq('email', email)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .single()

      if (existingInvitation) {
        return {
          success: false,
          error: 'A pending invitation already exists for this email'
        }
      }

      // Create the invitation
      const { data: invitation, error: invitationError } = await supabaseAdmin
        .from('user_invitations')
        .insert({
          organization_id: organizationId,
          invited_by: invitedBy,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          invitation_message: message,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single()

      if (invitationError || !invitation) {
        console.error('Error creating invitation:', invitationError)
        return {
          success: false,
          error: invitationError?.message || 'Failed to create invitation'
        }
      }

      // Send invitation email
      try {
        await EmailService.sendInvitationEmail(invitation as UserInvitation, organizationId)
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError)
        // Don't fail the invitation if email fails, but log it
      }

      return {
        success: true,
        invitation: invitation as UserInvitation
      }

    } catch (error: any) {
      console.error('Error in sendInvitation:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Accept an invitation and create user account
   */
  static async acceptInvitation(params: AcceptInvitationParams): Promise<InvitationResult> {
    try {
      const { token, password, firstName, lastName } = params

      // Find the invitation by token
      const { data: invitation, error: invitationError } = await supabaseAdmin
        .from('user_invitations')
        .select('*')
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .single()

      if (invitationError || !invitation) {
        return {
          success: false,
          error: 'Invalid or expired invitation'
        }
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        // Mark as expired
        await supabaseAdmin
          .from('user_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id)

        return {
          success: false,
          error: 'Invitation has expired'
        }
      }

      // Check if user already exists in auth
      const { data: existingAuthUser } = await supabaseAuth.auth.admin.getUserByEmail(invitation.email)
      
      let authUserId: string

      if (existingAuthUser.user) {
        // User exists in auth, use existing ID
        authUserId = existingAuthUser.user.id
      } else {
        // Create new auth user
        const { data: newAuthUser, error: authError } = await supabaseAuth.auth.admin.createUser({
          email: invitation.email,
          password,
          email_confirm: true, // Auto-confirm email for invited users
          user_metadata: {
            first_name: firstName || invitation.first_name,
            last_name: lastName || invitation.last_name,
            invited: true
          }
        })

        if (authError || !newAuthUser.user) {
          console.error('Error creating auth user:', authError)
          return {
            success: false,
            error: 'Failed to create user account'
          }
        }

        authUserId = newAuthUser.user.id
      }

      // Create user record in database
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUserId,
          organization_id: invitation.organization_id,
          email: invitation.email,
          first_name: firstName || invitation.first_name,
          last_name: lastName || invitation.last_name,
          role: invitation.role
        })
        .select()
        .single()

      if (userError || !user) {
        console.error('Error creating user record:', userError)
        
        // Clean up auth user if database creation fails
        if (!existingAuthUser.user) {
          await supabaseAuth.auth.admin.deleteUser(authUserId)
        }
        
        return {
          success: false,
          error: 'Failed to create user profile'
        }
      }

      // Mark invitation as accepted
      await supabaseAdmin
        .from('user_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      return {
        success: true,
        user: user as User
      }

    } catch (error: any) {
      console.error('Error in acceptInvitation:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }



  /**
   * Get invitation by token (for validation)
   */
  static async getInvitationByToken(token: string): Promise<UserInvitation | null> {
    try {
      const { data: invitation, error } = await supabaseAdmin
        .from('user_invitations')
        .select(`
          *,
          organization:organizations(name, slug)
        `)
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .single()

      if (error || !invitation) {
        return null
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        // Mark as expired
        await supabaseAdmin
          .from('user_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id)
        
        return null
      }

      return invitation as UserInvitation
    } catch (error) {
      console.error('Error getting invitation by token:', error)
      return null
    }
  }

  /**
   * Cleanup expired invitations (to be called periodically)
   */
  static async cleanupExpiredInvitations(): Promise<void> {
    try {
      await supabaseAdmin
        .from('user_invitations')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString())

      console.log('✅ Expired invitations cleaned up')
    } catch (error) {
      console.error('Error cleaning up expired invitations:', error)
    }
  }
}
