interface NotificationData {
  type: 'call' | 'lead' | 'billing' | 'system' | 'campaign' | 'workflow' | 'team'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  userId?: string
  organizationId?: string
}

interface EmailNotificationData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

interface SMSNotificationData {
  to: string
  message: string
}

class NotificationManager {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  /**
   * Create a new notification
   */
  async createNotification(data: NotificationData): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      return response.ok
    } catch (error) {
      console.error('Failed to create notification:', error)
      return false
    }
  }

  /**
   * Create multiple notifications at once
   */
  async createBulkNotifications(notifications: NotificationData[]): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notifications }),
      })

      return response.ok
    } catch (error) {
      console.error('Failed to create bulk notifications:', error)
      return false
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(data: EmailNotificationData): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      return response.ok
    } catch (error) {
      console.error('Failed to send email notification:', error)
      return false
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(data: SMSNotificationData): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      return response.ok
    } catch (error) {
      console.error('Failed to send SMS notification:', error)
      return false
    }
  }

  /**
   * Notification templates for common scenarios
   */
  
  // Call-related notifications
  async notifyCallCompleted(callId: string, leadName: string, leadScore: number, userId?: string) {
    return this.createNotification({
      type: 'call',
      priority: leadScore >= 80 ? 'high' : 'medium',
      title: 'Call Completed',
      message: `Call with ${leadName} completed. Lead score: ${leadScore}/100`,
      actionUrl: `/dashboard/calls/${callId}`,
      actionLabel: 'View Call',
      metadata: { callId, leadName, leadScore },
      userId
    })
  }

  async notifyCallFailed(callId: string, leadName: string, reason: string, userId?: string) {
    return this.createNotification({
      type: 'call',
      priority: 'medium',
      title: 'Call Failed',
      message: `Call to ${leadName} failed: ${reason}`,
      actionUrl: `/dashboard/calls/${callId}`,
      actionLabel: 'View Details',
      metadata: { callId, leadName, reason },
      userId
    })
  }

  // Lead-related notifications
  async notifyNewLead(leadId: string, leadName: string, source: string, userId?: string) {
    return this.createNotification({
      type: 'lead',
      priority: 'medium',
      title: 'New Lead Created',
      message: `New lead ${leadName} from ${source}`,
      actionUrl: `/dashboard/leads/${leadId}`,
      actionLabel: 'View Lead',
      metadata: { leadId, leadName, source },
      userId
    })
  }

  async notifyLeadQualified(leadId: string, leadName: string, estimatedValue: number, userId?: string) {
    return this.createNotification({
      type: 'lead',
      priority: 'high',
      title: 'Lead Qualified',
      message: `${leadName} has been qualified. Estimated value: $${estimatedValue.toLocaleString()}`,
      actionUrl: `/dashboard/leads/${leadId}`,
      actionLabel: 'View Lead',
      metadata: { leadId, leadName, estimatedValue },
      userId
    })
  }

  // Billing-related notifications
  async notifyPaymentSuccess(amount: number, invoiceId: string, userId?: string) {
    return this.createNotification({
      type: 'billing',
      priority: 'low',
      title: 'Payment Successful',
      message: `Payment of $${amount} processed successfully`,
      actionUrl: `/dashboard/billing`,
      actionLabel: 'View Invoice',
      metadata: { amount, invoiceId },
      userId
    })
  }

  async notifyPaymentFailed(amount: number, reason: string, userId?: string) {
    return this.createNotification({
      type: 'billing',
      priority: 'urgent',
      title: 'Payment Failed',
      message: `Payment of $${amount} failed: ${reason}`,
      actionUrl: `/dashboard/billing`,
      actionLabel: 'Update Payment',
      metadata: { amount, reason },
      userId
    })
  }

  async notifyUsageLimitReached(limitType: string, percentage: number, userId?: string) {
    return this.createNotification({
      type: 'billing',
      priority: percentage >= 90 ? 'urgent' : 'high',
      title: 'Usage Limit Warning',
      message: `You've used ${percentage}% of your ${limitType} limit`,
      actionUrl: `/dashboard/billing`,
      actionLabel: 'Upgrade Plan',
      metadata: { limitType, percentage },
      userId
    })
  }

  // Campaign-related notifications
  async notifyCampaignCompleted(campaignId: string, campaignName: string, results: any, userId?: string) {
    return this.createNotification({
      type: 'campaign',
      priority: 'medium',
      title: 'Campaign Completed',
      message: `${campaignName} completed with ${results.successfulCalls} successful calls`,
      actionUrl: `/dashboard/campaigns/${campaignId}`,
      actionLabel: 'View Results',
      metadata: { campaignId, campaignName, results },
      userId
    })
  }

  async notifyCampaignStarted(campaignId: string, campaignName: string, totalContacts: number, userId?: string) {
    return this.createNotification({
      type: 'campaign',
      priority: 'low',
      title: 'Campaign Started',
      message: `${campaignName} started with ${totalContacts} contacts`,
      actionUrl: `/dashboard/campaigns/${campaignId}`,
      actionLabel: 'Monitor Progress',
      metadata: { campaignId, campaignName, totalContacts },
      userId
    })
  }

  // System notifications
  async notifySystemMaintenance(startTime: string, duration: string, userId?: string) {
    return this.createNotification({
      type: 'system',
      priority: 'medium',
      title: 'Scheduled Maintenance',
      message: `System maintenance scheduled for ${startTime}. Expected duration: ${duration}`,
      actionUrl: `/dashboard/settings`,
      actionLabel: 'Learn More',
      metadata: { startTime, duration },
      userId
    })
  }

  async notifySystemUpdate(version: string, features: string[], userId?: string) {
    return this.createNotification({
      type: 'system',
      priority: 'low',
      title: 'System Update Available',
      message: `Version ${version} is now available with ${features.length} new features`,
      actionUrl: `/dashboard/settings`,
      actionLabel: 'View Changes',
      metadata: { version, features },
      userId
    })
  }

  // Team notifications
  async notifyTeamMemberAdded(memberName: string, role: string, userId?: string) {
    return this.createNotification({
      type: 'team',
      priority: 'low',
      title: 'Team Member Added',
      message: `${memberName} has been added as ${role}`,
      actionUrl: `/dashboard/team`,
      actionLabel: 'View Team',
      metadata: { memberName, role },
      userId
    })
  }

  async notifyTeamMemberRemoved(memberName: string, userId?: string) {
    return this.createNotification({
      type: 'team',
      priority: 'low',
      title: 'Team Member Removed',
      message: `${memberName} has been removed from the team`,
      actionUrl: `/dashboard/team`,
      actionLabel: 'View Team',
      metadata: { memberName },
      userId
    })
  }

  // Workflow notifications
  async notifyWorkflowCompleted(workflowId: string, workflowName: string, result: string, userId?: string) {
    return this.createNotification({
      type: 'workflow',
      priority: 'medium',
      title: 'Workflow Completed',
      message: `${workflowName} completed with result: ${result}`,
      actionUrl: `/dashboard/workflows/${workflowId}`,
      actionLabel: 'View Workflow',
      metadata: { workflowId, workflowName, result },
      userId
    })
  }

  async notifyWorkflowFailed(workflowId: string, workflowName: string, error: string, userId?: string) {
    return this.createNotification({
      type: 'workflow',
      priority: 'high',
      title: 'Workflow Failed',
      message: `${workflowName} failed: ${error}`,
      actionUrl: `/dashboard/workflows/${workflowId}`,
      actionLabel: 'View Error',
      metadata: { workflowId, workflowName, error },
      userId
    })
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager()

// Export class for testing
export { NotificationManager }
