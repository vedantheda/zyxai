/**
 * Real-time Notification Service for ZyxAI
 * Handles in-app notifications, push notifications, and real-time updates
 */

import { supabase, supabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'

type NotificationType = 'call_completed' | 'campaign_finished' | 'agent_error' | 'integration_sync' | 'system_alert' | 'user_action'
type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

interface Notification {
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

interface NotificationPreferences {
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
    start_time: string // HH:MM format
    end_time: string // HH:MM format
    timezone: string
  }
}

export class NotificationService {
  private static instance: NotificationService
  private subscribers: Map<string, (notification: Notification) => void> = new Map()

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Send a notification to a user
   */
  async sendNotification(
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
  ): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      // Check if we're in browser environment or if supabaseAdmin is not available
      if (typeof window !== 'undefined' || !supabaseAdmin) {
        console.log('NotificationService: Browser environment - notifications not supported')
        return { success: false, error: 'Notifications only supported on server-side' }
      }

      // Check user preferences
      const preferences = await this.getUserPreferences(userId)
      if (!preferences.in_app_notifications || !preferences.notification_types[type]) {
        return { success: false, error: 'Notifications disabled for this type' }
      }

      // Check quiet hours
      if (this.isQuietHours(preferences.quiet_hours)) {
        // Queue for later unless urgent
        if (options.priority !== 'urgent') {
          return { success: false, error: 'Quiet hours active' }
        }
      }

      const notification: Omit<Notification, 'id'> = {
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

      // Save to database
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notification)
        .select()
        .single()

      if (error) throw error

      const savedNotification = data as Notification

      // Send real-time update
      await this.broadcastNotification(savedNotification)

      // Send push notification if enabled
      if (preferences.push_notifications) {
        await this.sendPushNotification(userId, savedNotification)
      }

      // Send email notification if enabled and high priority
      if (preferences.email_notifications && (options.priority === 'high' || options.priority === 'urgent')) {
        await this.sendEmailNotification(userId, savedNotification)
      }

      return { success: true, notification: savedNotification }
    } catch (error: any) {
      console.error('Failed to send notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    options: {
      limit?: number
      offset?: number
      unreadOnly?: boolean
      type?: NotificationType
    } = {}
  ): Promise<{ notifications: Notification[]; totalCount: number; error?: string }> {
    try {
      // Check if we're in browser environment or if supabaseAdmin is not available
      if (typeof window !== 'undefined' || !supabaseAdmin) {
        console.log('NotificationService: Browser environment - using empty notifications')
        return { notifications: [], totalCount: 0 }
      }

      let query = supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (options.unreadOnly) {
        query = query.eq('read', false)
      }

      if (options.type) {
        query = query.eq('type', options.type)
      }

      // Filter out expired notifications
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        notifications: data as Notification[],
        totalCount: count || 0
      }
    } catch (error: any) {
      console.error('Failed to get notifications:', error)
      return {
        notifications: [],
        totalCount: 0,
        error: error.message
      }
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're in browser environment or if supabaseAdmin is not available
      if (typeof window !== 'undefined' || !supabaseAdmin) {
        console.log('NotificationService: Using client service for mark as read')
        return clientNotificationService.markAsRead(notificationId, userId)
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Failed to delete notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Check if we're in browser environment or if supabaseAdmin is not available
      if (typeof window !== 'undefined' || !supabaseAdmin) {
        console.log('NotificationService: Browser environment - using default preferences')
        return this.getDefaultPreferences(userId)
      }

      const { data, error } = await supabaseAdmin
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      // Return default preferences if none exist
      if (!data) {
        return this.getDefaultPreferences(userId)
      }

      return data as NotificationPreferences
    } catch (error: any) {
      console.error('Failed to get user preferences:', error)
      // Return default preferences on error
      return this.getDefaultPreferences(userId)
    }
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
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
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Failed to update user preferences:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): () => void {
    const subscriptionId = `${userId}-${Date.now()}`
    this.subscribers.set(subscriptionId, callback)

    // Check if Supabase is available
    if (!supabase) {
      console.log('NotificationService: Supabase not available, no real-time notifications')
      // Return empty unsubscribe function
      return () => {
        this.subscribers.delete(subscriptionId)
      }
    }

    // Set up Supabase real-time subscription
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriptionId)
      subscription.unsubscribe()
    }
  }

  /**
   * Broadcast notification to subscribers
   */
  private async broadcastNotification(notification: Notification): Promise<void> {
    // Supabase real-time will handle this automatically
    // This method is for additional custom broadcasting if needed
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(userId: string, notification: Notification): Promise<void> {
    try {
      // Implement push notification logic here
      // This would integrate with services like Firebase, OneSignal, etc.
      console.log('Push notification sent:', notification.title)
    } catch (error) {
      console.error('Failed to send push notification:', error)
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(userId: string, notification: Notification): Promise<void> {
    try {
      // Get user email
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (!user.user?.email) return

      // Send email using your email service
      // This would integrate with SendGrid, Resend, etc.
      console.log('Email notification sent to:', user.user.email)
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(quietHours: NotificationPreferences['quiet_hours']): boolean {
    if (!quietHours.enabled) return false

    const now = new Date()
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: quietHours.timezone
    })

    const startTime = quietHours.start_time
    const endTime = quietHours.end_time

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime
    }

    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<{ deletedCount: number; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id')

      if (error) throw error

      return { deletedCount: data?.length || 0 }
    } catch (error: any) {
      console.error('Failed to cleanup expired notifications:', error)
      return { deletedCount: 0, error: error.message }
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()
