/**
 * Notification Store - Zustand
 * Manages in-app notifications, toasts, and notification preferences
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

// Types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'call' | 'lead' | 'system'
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
  expires_at?: string
}

export interface Toast {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface NotificationPreferences {
  email: {
    calls: boolean
    leads: boolean
    campaigns: boolean
    system: boolean
    billing: boolean
  }
  push: {
    calls: boolean
    leads: boolean
    campaigns: boolean
    system: boolean
    billing: boolean
  }
  inApp: {
    calls: boolean
    leads: boolean
    campaigns: boolean
    system: boolean
    billing: boolean
  }
}

export interface NotificationState {
  // Notifications
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  
  // Toasts
  toasts: Toast[]
  
  // Preferences
  preferences: NotificationPreferences
  
  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  removeNotification: (notificationId: string) => void
  clearNotifications: () => void
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (toastId: string) => void
  clearToasts: () => void
  
  // Preference actions
  setPreferences: (preferences: NotificationPreferences) => void
  updatePreference: (category: keyof NotificationPreferences, type: string, enabled: boolean) => void
  
  // Async actions
  fetchNotifications: () => Promise<void>
  refreshNotifications: () => Promise<void>
  
  // Utilities
  getUnreadCount: () => number
  reset: () => void
}

// Default preferences
const defaultPreferences: NotificationPreferences = {
  email: {
    calls: true,
    leads: true,
    campaigns: true,
    system: true,
    billing: true,
  },
  push: {
    calls: true,
    leads: true,
    campaigns: false,
    system: true,
    billing: true,
  },
  inApp: {
    calls: true,
    leads: true,
    campaigns: true,
    system: true,
    billing: true,
  },
}

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  toasts: [],
  preferences: defaultPreferences,
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Notification actions
        setNotifications: (notifications) => {
          const unreadCount = notifications.filter(n => !n.is_read).length
          set({ notifications, unreadCount }, false, 'setNotifications')
        },
        
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          }
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }), false, 'addNotification')
        },
        
        markAsRead: (notificationId) => {
          set((state) => {
            const notifications = state.notifications.map(n =>
              n.id === notificationId ? { ...n, is_read: true } : n
            )
            const unreadCount = notifications.filter(n => !n.is_read).length
            return { notifications, unreadCount }
          }, false, 'markAsRead')
          
          // Update in database
          if (supabase) {
            supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('id', notificationId)
              .then(({ error }) => {
                if (error) console.error('Failed to mark notification as read:', error)
              })
          }
        },
        
        markAllAsRead: () => {
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadCount: 0
          }), false, 'markAllAsRead')
          
          // Update in database
          if (supabase) {
            const unreadIds = get().notifications
              .filter(n => !n.is_read)
              .map(n => n.id)
            
            if (unreadIds.length > 0) {
              supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds)
                .then(({ error }) => {
                  if (error) console.error('Failed to mark notifications as read:', error)
                })
            }
          }
        },
        
        removeNotification: (notificationId) => {
          set((state) => {
            const notifications = state.notifications.filter(n => n.id !== notificationId)
            const unreadCount = notifications.filter(n => !n.is_read).length
            return { notifications, unreadCount }
          }, false, 'removeNotification')
        },
        
        clearNotifications: () => {
          set({ notifications: [], unreadCount: 0 }, false, 'clearNotifications')
        },
        
        // Toast actions
        addToast: (toast) => {
          const newToast: Toast = {
            ...toast,
            id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            duration: toast.duration || 5000,
          }
          
          set((state) => ({
            toasts: [...state.toasts, newToast]
          }), false, 'addToast')
          
          // Auto-remove toast after duration
          if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
              get().removeToast(newToast.id)
            }, newToast.duration)
          }
        },
        
        removeToast: (toastId) => {
          set((state) => ({
            toasts: state.toasts.filter(t => t.id !== toastId)
          }), false, 'removeToast')
        },
        
        clearToasts: () => {
          set({ toasts: [] }, false, 'clearToasts')
        },
        
        // Preference actions
        setPreferences: (preferences) => 
          set({ preferences }, false, 'setPreferences'),
        
        updatePreference: (category, type, enabled) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              [category]: {
                ...state.preferences[category],
                [type]: enabled
              }
            }
          }), false, `updatePreference:${category}.${type}`)
        },
        
        // Async actions
        fetchNotifications: async () => {
          if (!supabase) return
          
          try {
            set({ loading: true }, false, 'fetchNotifications:start')
            
            const { data, error } = await supabase
              .from('notifications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50)
            
            if (error) throw error
            
            if (data) {
              const notifications = data as Notification[]
              const unreadCount = notifications.filter(n => !n.is_read).length
              set({ notifications, unreadCount, loading: false }, false, 'fetchNotifications:success')
            }
          } catch (error) {
            console.error('Failed to fetch notifications:', error)
            set({ loading: false }, false, 'fetchNotifications:error')
          }
        },
        
        refreshNotifications: async () => {
          // Silent refresh without loading state
          if (!supabase) return
          
          try {
            const { data, error } = await supabase
              .from('notifications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50)
            
            if (error) throw error
            
            if (data) {
              const notifications = data as Notification[]
              const unreadCount = notifications.filter(n => !n.is_read).length
              set({ notifications, unreadCount }, false, 'refreshNotifications')
            }
          } catch (error) {
            console.error('Failed to refresh notifications:', error)
          }
        },
        
        // Utilities
        getUnreadCount: () => get().unreadCount,
        
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'zyxai-notification-store',
        partialize: (state) => ({
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'notification-store',
    }
  )
)
