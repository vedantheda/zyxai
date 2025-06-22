/**
 * Client-side Notification Service for ZyxAI
 * Handles in-app notifications without requiring database access
 * Used as fallback when server-side notifications are not available
 */

type NotificationType = 'call_completed' | 'campaign_finished' | 'agent_error' | 'integration_sync' | 'system_alert' | 'user_action'
type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

interface ClientNotification {
  id: string
  user_id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  created_at: string
  expires_at?: string
  action_url?: string
  action_label?: string
}

interface ClientNotificationPreferences {
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  in_app_notifications: boolean
  notification_types: {
    call_completed: boolean
    campaign_finished: boolean
    agent_error: boolean
    integration_sync: boolean
    system_alert: boolean
    user_action: boolean
  }
  quiet_hours: {
    enabled: boolean
    start_time: string
    end_time: string
    timezone: string
  }
}

export class ClientNotificationService {
  private static instance: ClientNotificationService
  private notifications: Map<string, ClientNotification[]> = new Map()
  private preferences: Map<string, ClientNotificationPreferences> = new Map()
  private subscribers: Map<string, (notification: ClientNotification) => void> = new Map()

  static getInstance(): ClientNotificationService {
    if (!ClientNotificationService.instance) {
      ClientNotificationService.instance = new ClientNotificationService()
    }
    return ClientNotificationService.instance
  }

  /**
   * Get notifications for a user (client-side only)
   */
  getNotifications(
    userId: string,
    options: {
      limit?: number
      offset?: number
      unreadOnly?: boolean
      type?: NotificationType
    } = {}
  ): { notifications: ClientNotification[]; totalCount: number; error?: string } {
    try {
      let userNotifications = this.notifications.get(userId) || []

      // Filter by type if specified
      if (options.type) {
        userNotifications = userNotifications.filter(n => n.type === options.type)
      }

      // Filter by read status if specified
      if (options.unreadOnly) {
        userNotifications = userNotifications.filter(n => !n.read)
      }

      // Filter out expired notifications
      const now = new Date().toISOString()
      userNotifications = userNotifications.filter(n => 
        !n.expires_at || n.expires_at > now
      )

      // Sort by created_at descending
      userNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // Apply pagination
      const offset = options.offset || 0
      const limit = options.limit || 50
      const paginatedNotifications = userNotifications.slice(offset, offset + limit)

      return {
        notifications: paginatedNotifications,
        totalCount: userNotifications.length
      }
    } catch (error: any) {
      console.error('Failed to get client notifications:', error)
      return {
        notifications: [],
        totalCount: 0,
        error: error.message
      }
    }
  }

  /**
   * Add a notification (client-side only)
   */
  addNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options: {
      priority?: NotificationPriority
      data?: Record<string, any>
      actionUrl?: string
      actionLabel?: string
      expiresIn?: number // minutes
    } = {}
  ): ClientNotification {
    const notification: ClientNotification = {
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      type,
      priority: options.priority || 'medium',
      title,
      message,
      data: options.data,
      read: false,
      created_at: new Date().toISOString(),
      expires_at: options.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 60 * 1000).toISOString()
        : undefined,
      action_url: options.actionUrl,
      action_label: options.actionLabel
    }

    // Add to user's notifications
    const userNotifications = this.notifications.get(userId) || []
    userNotifications.unshift(notification)
    this.notifications.set(userId, userNotifications)

    // Notify subscribers
    this.notifySubscribers(notification)

    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      this.showToast(notification)
    }

    return notification
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string, userId: string): { success: boolean; error?: string } {
    try {
      const userNotifications = this.notifications.get(userId) || []
      const notification = userNotifications.find(n => n.id === notificationId)
      
      if (notification) {
        notification.read = true
        return { success: true }
      }
      
      return { success: false, error: 'Notification not found' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): { success: boolean; error?: string } {
    try {
      const userNotifications = this.notifications.get(userId) || []
      userNotifications.forEach(n => n.read = true)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string, userId: string): { success: boolean; error?: string } {
    try {
      const userNotifications = this.notifications.get(userId) || []
      const filteredNotifications = userNotifications.filter(n => n.id !== notificationId)
      this.notifications.set(userId, filteredNotifications)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get user preferences (client-side defaults)
   */
  getUserPreferences(userId: string): ClientNotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId)
  }

  /**
   * Update user preferences (client-side only)
   */
  updateUserPreferences(
    userId: string,
    updates: Partial<ClientNotificationPreferences>
  ): { success: boolean; error?: string } {
    try {
      const currentPreferences = this.getUserPreferences(userId)
      const updatedPreferences = { ...currentPreferences, ...updates }
      this.preferences.set(userId, updatedPreferences)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(userId: string, callback: (notification: ClientNotification) => void): () => void {
    const subscriptionId = `${userId}-${Date.now()}`
    this.subscribers.set(subscriptionId, callback)

    return () => {
      this.subscribers.delete(subscriptionId)
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(userId: string): ClientNotificationPreferences {
    return {
      user_id: userId,
      email_notifications: true,
      push_notifications: true,
      in_app_notifications: true,
      notification_types: {
        call_completed: true,
        campaign_finished: true,
        agent_error: true,
        integration_sync: true,
        system_alert: true,
        user_action: true
      },
      quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'UTC'
      }
    }
  }

  /**
   * Notify subscribers
   */
  private notifySubscribers(notification: ClientNotification): void {
    this.subscribers.forEach(callback => {
      try {
        callback(notification)
      } catch (error) {
        console.error('Error notifying subscriber:', error)
      }
    })
  }

  /**
   * Show toast notification
   */
  private showToast(notification: ClientNotification): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-notification-toast', {
        detail: notification
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * Clean up expired notifications
   */
  cleanupExpiredNotifications(): { deletedCount: number } {
    let deletedCount = 0
    const now = new Date().toISOString()

    this.notifications.forEach((userNotifications, userId) => {
      const validNotifications = userNotifications.filter(n => {
        if (n.expires_at && n.expires_at <= now) {
          deletedCount++
          return false
        }
        return true
      })
      this.notifications.set(userId, validNotifications)
    })

    return { deletedCount }
  }

  /**
   * Clear all notifications for a user
   */
  clearUserNotifications(userId: string): void {
    this.notifications.delete(userId)
    this.preferences.delete(userId)
  }
}

// Export singleton instance
export const clientNotificationService = ClientNotificationService.getInstance()
