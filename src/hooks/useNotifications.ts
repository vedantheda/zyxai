'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { notificationService } from '@/lib/services/NotificationService'

interface Notification {
  id: string
  user_id: string
  type: 'call_completed' | 'campaign_finished' | 'agent_error' | 'integration_sync' | 'system_alert' | 'user_action'
  priority: 'low' | 'medium' | 'high' | 'urgent'
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
    start_time: string
    end_time: string
    timezone: string
  }
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)

  // Load notifications
  const loadNotifications = useCallback(async (options: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  } = {}) => {
    if (!user) return

    setLoading(true)
    try {
      const result = await notificationService.getNotifications(user.id, options)

      if (result.error) {
        console.warn('Failed to load notifications:', result.error)
        // Set empty notifications instead of failing
        setNotifications([])
        setUnreadCount(0)
        return
      }

      setNotifications(result.notifications)
      setUnreadCount(result.notifications.filter(n => !n.read).length)
    } catch (error) {
      console.warn('Error loading notifications:', error)
      // Set empty notifications instead of failing
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user) return

    try {
      const userPreferences = await notificationService.getUserPreferences(user.id)
      setPreferences(userPreferences)
    } catch (error) {
      console.warn('Error loading preferences:', error)
      // Set default preferences instead of failing
      setPreferences({
        user_id: user.id,
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
      })
    }
  }, [user])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return

    try {
      const result = await notificationService.markAsRead(notificationId, user.id)

      if (result.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, read: true }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [user])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const result = await notificationService.markAllAsRead(user.id)

      if (result.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [user])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return

    try {
      const result = await notificationService.deleteNotification(notificationId, user.id)

      if (result.success) {
        const notification = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(n => n.id !== notificationId))

        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [user, notifications])

  // Send notification
  const sendNotification = useCallback(async (
    type: Notification['type'],
    title: string,
    message: string,
    options: {
      priority?: Notification['priority']
      data?: Record<string, any>
      actionUrl?: string
      actionLabel?: string
      expiresIn?: number
    } = {}
  ) => {
    if (!user) return

    try {
      const result = await notificationService.sendNotification(
        user.id,
        type,
        title,
        message,
        options
      )

      if (result.success && result.notification) {
        setNotifications(prev => [result.notification!, ...prev])
        if (!result.notification!.read) {
          setUnreadCount(prev => prev + 1)
        }
      }

      return result
    } catch (error) {
      console.error('Error sending notification:', error)
      return { success: false, error: 'Failed to send notification' }
    }
  }, [user])

  // Update preferences
  const updatePreferences = useCallback(async (
    updates: Partial<NotificationPreferences>
  ) => {
    if (!user) return

    try {
      const result = await notificationService.updateUserPreferences(user.id, updates)

      if (result.success) {
        setPreferences(prev => prev ? { ...prev, ...updates } : null)
      }

      return result
    } catch (error) {
      console.error('Error updating preferences:', error)
      return { success: false, error: 'Failed to update preferences' }
    }
  }, [user])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return

    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      (notification) => {
        setNotifications(prev => [notification, ...prev])
        if (!notification.read) {
          setUnreadCount(prev => prev + 1)
        }

        // Show toast notification for high priority notifications
        if (notification.priority === 'high' || notification.priority === 'urgent') {
          // Trigger toast notification
          const event = new CustomEvent('show-notification-toast', {
            detail: notification
          })
          window.dispatchEvent(event)
        }
      }
    )

    return unsubscribe
  }, [user])

  // Load initial data
  useEffect(() => {
    if (user) {
      loadNotifications()
      loadPreferences()
    }
  }, [user, loadNotifications, loadPreferences])

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    loadNotifications()
  }, [loadNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    updatePreferences,
    refreshNotifications,
    loadNotifications
  }
}

// Hook for notification toast management
export function useNotificationToasts() {
  const [toasts, setToasts] = useState<Notification[]>([])

  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const notification = event.detail as Notification
      setToasts(prev => [...prev, notification])

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(n => n.id !== notification.id))
      }, 5000)
    }

    window.addEventListener('show-notification-toast', handleShowToast as EventListener)

    return () => {
      window.removeEventListener('show-notification-toast', handleShowToast as EventListener)
    }
  }, [])

  const removeToast = useCallback((notificationId: string) => {
    setToasts(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  return {
    toasts,
    removeToast
  }
}

// Hook for notification preferences management
export function useNotificationPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPreferences = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const userPreferences = await notificationService.getUserPreferences(user.id)
      setPreferences(userPreferences)
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const updatePreferences = useCallback(async (
    updates: Partial<NotificationPreferences>
  ) => {
    if (!user) return

    try {
      const result = await notificationService.updateUserPreferences(user.id, updates)

      if (result.success) {
        setPreferences(prev => prev ? { ...prev, ...updates } : null)
      }

      return result
    } catch (error) {
      console.error('Error updating preferences:', error)
      return { success: false, error: 'Failed to update preferences' }
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user, loadPreferences])

  return {
    preferences,
    loading,
    updatePreferences,
    refreshPreferences: loadPreferences
  }
}
