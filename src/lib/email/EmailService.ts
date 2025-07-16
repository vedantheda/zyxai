import { supabaseAdmin } from '@/lib/supabase'
import { generateInvitationEmailHTML, generateInvitationEmailText } from './templates/invitation'
import type { UserInvitation } from '@/types/database'

interface EmailData {
  to: string
  subject: string
  html: string
  text: string
}

export class EmailService {
  /**
   * Send invitation email
   */
  static async sendInvitationEmail(
    invitation: UserInvitation,
    organizationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get organization details
      const { data: organization, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('name, slug')
        .eq('id', organizationId)
        .single()

      if (orgError || !organization) {
        throw new Error('Organization not found')
      }

      // Get inviter details
      const { data: inviter, error: inviterError } = await supabaseAdmin
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', invitation.invited_by!)
        .single()

      if (inviterError || !inviter) {
        throw new Error('Inviter not found')
      }

      const inviterName = `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() || inviter.email
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation?token=${invitation.invitation_token}`

      const emailData = {
        invitation,
        organizationName: organization.name,
        inviterName,
        inviterEmail: inviter.email,
        inviteUrl
      }

      const emailContent: EmailData = {
        to: invitation.email,
        subject: `You're invited to join ${organization.name} on ZyxAI`,
        html: generateInvitationEmailHTML(emailData),
        text: generateInvitationEmailText(emailData)
      }

      // Send email using the configured email service
      const result = await this.sendEmail(emailContent)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }

      console.log('✅ Invitation email sent successfully:', {
        to: invitation.email,
        organization: organization.name,
        inviter: inviterName
      })

      return { success: true }

    } catch (error: any) {
      console.error('Error sending invitation email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send invitation email'
      }
    }
  }

  /**
   * Send email using the configured email service
   */
  private static async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Method 1: Using Supabase Edge Function (recommended)
      if (process.env.SUPABASE_EMAIL_FUNCTION_URL) {
        return await this.sendViaSupabaseFunction(emailData)
      }

      // Method 2: Using Resend API (alternative)
      if (process.env.RESEND_API_KEY) {
        return await this.sendViaResend(emailData)
      }

      // Method 3: Using SendGrid API (alternative)
      if (process.env.SENDGRID_API_KEY) {
        return await this.sendViaSendGrid(emailData)
      }

      // Fallback: Log email content for development
      console.log('📧 Email would be sent (no email service configured):', {
        to: emailData.to,
        subject: emailData.subject,
        preview: emailData.text.substring(0, 200) + '...'
      })

      return { success: true }

    } catch (error: any) {
      console.error('Error in sendEmail:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email'
      }
    }
  }

  /**
   * Send email via Supabase Edge Function
   */
  private static async sendViaSupabaseFunction(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(process.env.SUPABASE_EMAIL_FUNCTION_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Supabase function error: ${error}`)
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Supabase email function failed'
      }
    }
  }

  /**
   * Send email via Resend API
   */
  private static async sendViaResend(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'noreply@zyxai.com',
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Resend API error: ${error.message || 'Unknown error'}`)
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Resend API failed'
      }
    }
  }

  /**
   * Send email via SendGrid API
   */
  private static async sendViaSendGrid(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: emailData.to }]
          }],
          from: {
            email: process.env.FROM_EMAIL || 'noreply@zyxai.com',
            name: 'ZyxAI Team'
          },
          subject: emailData.subject,
          content: [
            {
              type: 'text/html',
              value: emailData.html
            },
            {
              type: 'text/plain',
              value: emailData.text
            }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`SendGrid API error: ${error}`)
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'SendGrid API failed'
      }
    }
  }

  /**
   * Test email configuration
   */
  static async testEmailConfiguration(): Promise<{ success: boolean; service?: string; error?: string }> {
    try {
      if (process.env.SUPABASE_EMAIL_FUNCTION_URL) {
        return { success: true, service: 'Supabase Edge Function' }
      }

      if (process.env.RESEND_API_KEY) {
        return { success: true, service: 'Resend API' }
      }

      if (process.env.SENDGRID_API_KEY) {
        return { success: true, service: 'SendGrid API' }
      }

      return {
        success: false,
        error: 'No email service configured. Please set up RESEND_API_KEY, SENDGRID_API_KEY, or SUPABASE_EMAIL_FUNCTION_URL'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Email configuration test failed'
      }
    }
  }
}
