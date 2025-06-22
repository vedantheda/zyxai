'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useNotifications, useNotificationToasts } from '@/hooks/useNotifications'
import { NotificationToast } from '@/components/notifications/NotificationCenter'
import { useAuth } from '@/contexts/AuthProvider'

interface NotificationContextType {
  notifications: any[]
  unreadCount: number
  sendNotification: (type: string, title: string, message: string, options?: any) => Promise<any>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications()
  
  const { toasts, removeToast } = useNotificationToasts()

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      refreshNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [user, refreshNotifications])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Render notification toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={() => removeToast(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

// Helper hook for sending common notification types
export function useNotificationHelpers() {
  const { sendNotification } = useNotificationContext()

  const notifyCallCompleted = async (callId: string, duration: number, outcome: string) => {
    return sendNotification(
      'call_completed',
      'Call Completed',
      `Call completed in ${Math.round(duration / 60)} minutes with outcome: ${outcome}`,
      {
        priority: 'medium',
        actionUrl: `/dashboard/calls/${callId}`,
        actionLabel: 'View Call',
        data: { callId, duration, outcome }
      }
    )
  }

  const notifyCampaignFinished = async (campaignId: string, totalCalls: number, successRate: number) => {
    return sendNotification(
      'campaign_finished',
      'Campaign Completed',
      `Campaign finished with ${totalCalls} calls and ${successRate}% success rate`,
      {
        priority: 'high',
        actionUrl: `/dashboard/campaigns/${campaignId}`,
        actionLabel: 'View Results',
        data: { campaignId, totalCalls, successRate }
      }
    )
  }

  const notifyAgentError = async (agentId: string, error: string) => {
    return sendNotification(
      'agent_error',
      'Agent Error',
      `Agent encountered an error: ${error}`,
      {
        priority: 'high',
        actionUrl: `/dashboard/agents/${agentId}`,
        actionLabel: 'Check Agent',
        data: { agentId, error }
      }
    )
  }

  const notifyIntegrationSync = async (integration: string, status: 'success' | 'failed', details?: string) => {
    return sendNotification(
      'integration_sync',
      `${integration} Sync ${status === 'success' ? 'Completed' : 'Failed'}`,
      details || `Integration sync ${status}`,
      {
        priority: status === 'failed' ? 'high' : 'medium',
        actionUrl: '/dashboard/integrations',
        actionLabel: 'View Integrations',
        data: { integration, status, details }
      }
    )
  }

  const notifySystemAlert = async (title: string, message: string, severity: 'low' | 'medium' | 'high' | 'urgent' = 'medium') => {
    return sendNotification(
      'system_alert',
      title,
      message,
      {
        priority: severity,
        actionUrl: '/dashboard/settings',
        actionLabel: 'View Settings'
      }
    )
  }

  const notifyUserAction = async (action: string, details: string) => {
    return sendNotification(
      'user_action',
      `Action: ${action}`,
      details,
      {
        priority: 'low',
        data: { action, details }
      }
    )
  }

  return {
    notifyCallCompleted,
    notifyCampaignFinished,
    notifyAgentError,
    notifyIntegrationSync,
    notifySystemAlert,
    notifyUserAction
  }
}

// Hook for browser push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!supported) return 'denied'

    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  const sendPushNotification = (title: string, options?: NotificationOptions) => {
    if (!supported || permission !== 'granted') return

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    })

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    return notification
  }

  return {
    supported,
    permission,
    requestPermission,
    sendPushNotification
  }
}

// Hook for notification sound effects
export function useNotificationSounds() {
  const [enabled, setEnabled] = useState(true)
  const [volume, setVolume] = useState(0.5)

  const playNotificationSound = (type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    if (!enabled) return

    // Create audio context for notification sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Generate different tones for different notification types
    const frequencies = {
      success: [523.25, 659.25, 783.99], // C5, E5, G5
      error: [349.23, 293.66], // F4, D4
      warning: [440, 554.37], // A4, C#5
      info: [523.25, 659.25] // C5, E5
    }

    const freq = frequencies[type]
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime)
    if (freq[1]) {
      oscillator.frequency.setValueAtTime(freq[1], audioContext.currentTime + 0.1)
    }
    if (freq[2]) {
      oscillator.frequency.setValueAtTime(freq[2], audioContext.currentTime + 0.2)
    }

    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  return {
    enabled,
    setEnabled,
    volume,
    setVolume,
    playNotificationSound
  }
}
