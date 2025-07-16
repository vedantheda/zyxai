import type { UserInvitation } from '@/types/database'

interface InvitationEmailData {
  invitation: UserInvitation
  organizationName: string
  inviterName: string
  inviterEmail: string
  inviteUrl: string
}

export function generateInvitationEmailHTML(data: InvitationEmailData): string {
  const { invitation, organizationName, inviterName, inviterEmail, inviteUrl } = data
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're invited to join ${organizationName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
        }
        .content {
            margin-bottom: 30px;
        }
        .role-badge {
            display: inline-block;
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 500;
            margin: 0 4px;
        }
        .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 16px;
            margin: 20px 0;
        }
        .cta-button:hover {
            background-color: #0056b3;
        }
        .message-box {
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
        }
        .expiry-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 12px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🧠 ZyxAI</div>
            <h1 class="title">You're invited to join ${organizationName}</h1>
            <p class="subtitle">Start collaborating with your team on ZyxAI</p>
        </div>

        <div class="content">
            <p>Hi ${invitation.first_name || 'there'},</p>
            
            <p>
                <strong>${inviterName}</strong> has invited you to join 
                <strong>${organizationName}</strong> on ZyxAI as a 
                <span class="role-badge">${invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}</span>.
            </p>

            ${invitation.invitation_message ? `
            <div class="message-box">
                <strong>Personal message from ${inviterName}:</strong><br>
                "${invitation.invitation_message}"
            </div>
            ` : ''}

            <p>ZyxAI is a powerful AI-driven platform that helps teams manage voice communications, automate workflows, and streamline business processes.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" class="cta-button">Accept Invitation & Set Up Account</a>
            </div>

            <div class="expiry-notice">
                ⏰ <strong>Important:</strong> This invitation will expire on 
                <strong>${new Date(invitation.expires_at).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</strong>
            </div>

            <h3>What you can do as a ${invitation.role}:</h3>
            <ul>
                ${getRolePermissions(invitation.role).map(permission => `<li>${permission}</li>`).join('')}
            </ul>

            <p>If you have any questions about this invitation or need help getting started, feel free to reach out to ${inviterName} at <a href="mailto:${inviterEmail}">${inviterEmail}</a>.</p>
        </div>

        <div class="footer">
            <p>
                If you're having trouble with the button above, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #007bff; word-break: break-all;">${inviteUrl}</a>
            </p>
            
            <p>
                This invitation was sent to <strong>${invitation.email}</strong>. 
                If you weren't expecting this invitation, you can safely ignore this email.
            </p>
            
            <p style="margin-top: 20px; text-align: center; color: #999;">
                © ${new Date().getFullYear()} ZyxAI. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

export function generateInvitationEmailText(data: InvitationEmailData): string {
  const { invitation, organizationName, inviterName, inviterEmail, inviteUrl } = data
  
  return `
You're invited to join ${organizationName} on ZyxAI

Hi ${invitation.first_name || 'there'},

${inviterName} has invited you to join ${organizationName} on ZyxAI as a ${invitation.role}.

${invitation.invitation_message ? `Personal message from ${inviterName}: "${invitation.invitation_message}"` : ''}

ZyxAI is a powerful AI-driven platform that helps teams manage voice communications, automate workflows, and streamline business processes.

To accept this invitation and set up your account, visit:
${inviteUrl}

IMPORTANT: This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

What you can do as a ${invitation.role}:
${getRolePermissions(invitation.role).map(permission => `• ${permission}`).join('\n')}

If you have any questions about this invitation or need help getting started, feel free to reach out to ${inviterName} at ${inviterEmail}.

If you're having trouble with the link above, copy and paste this URL into your browser:
${inviteUrl}

This invitation was sent to ${invitation.email}. If you weren't expecting this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} ZyxAI. All rights reserved.
  `.trim()
}

function getRolePermissions(role: string): string[] {
  const permissions = {
    owner: [
      'Full access to all features and settings',
      'Manage organization billing and subscription',
      'Add and remove team members',
      'Configure integrations and security settings',
      'Access all analytics and reports'
    ],
    admin: [
      'Manage team members and their roles',
      'Configure AI agents and campaigns',
      'Access all analytics and reports',
      'Manage integrations and workflows',
      'Configure organization settings'
    ],
    manager: [
      'Invite and manage team members',
      'Create and manage AI agents',
      'View team performance analytics',
      'Manage contacts and campaigns',
      'Configure basic settings'
    ],
    agent: [
      'Handle voice calls and conversations',
      'Manage contacts and leads',
      'View assigned campaigns',
      'Access basic analytics',
      'Update personal profile'
    ],
    viewer: [
      'View dashboards and reports',
      'Access contact information',
      'View call logs and transcripts',
      'Basic profile management',
      'Read-only access to most features'
    ]
  }

  return permissions[role as keyof typeof permissions] || permissions.viewer
}
