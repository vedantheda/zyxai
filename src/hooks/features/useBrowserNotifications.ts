'use client'
import { useState, useEffect, useCallback } from 'react'

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  onClick?: () => void
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  // Check if notifications are supported
  useEffect(() => {
    setIsSupported('Notification' in window)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return 'denied'
    }
  }, [isSupported])

  // Show notification
  const showNotification = useCallback(async (options: NotificationOptions): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Browser notifications not supported')
      return false
    }

    // Request permission if not granted
    let currentPermission = permission
    if (currentPermission === 'default') {
      currentPermission = await requestPermission()
    }

    if (currentPermission !== 'granted') {
      console.warn('Notification permission not granted')
      return false
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: false
      })

      // Handle click event
      if (options.onClick) {
        notification.onclick = () => {
          options.onClick?.()
          notification.close()
          // Focus the window
          if (window.focus) {
            window.focus()
          }
        }
      }

      // Auto-close after 5 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      return true
    } catch (error) {
      console.error('Failed to show notification:', error)
      return false
    }
  }, [isSupported, permission, requestPermission])

  // Show message notification
  const showMessageNotification = useCallback(async (
    senderName: string,
    message: string,
    onClickCallback?: () => void
  ): Promise<boolean> => {
    return showNotification({
      title: `New message from ${senderName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/favicon.ico',
      tag: 'new-message',
      requireInteraction: false,
      onClick: onClickCallback
    })
  }, [showNotification])

  // Check if page is visible (don't show notifications if user is actively using the app)
  const shouldShowNotification = useCallback((): boolean => {
    return document.hidden || !document.hasFocus()
  }, [])

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showMessageNotification,
    shouldShowNotification
  }
}
