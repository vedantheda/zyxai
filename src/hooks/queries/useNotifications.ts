/**
 * Notification Queries - React Query hooks for notifications
 */

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys, invalidateQueries } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthProvider'
import { useNotificationStore } from '@/stores/notificationStore'
import type { Notification } from '@/stores/notificationStore'

// Fetch all notifications for the current user
export function useNotifications() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async (): Promise<Notification[]> => {
      if (!supabase || !user?.id) {
        return []
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},organization_id.eq.${user.organization_id}`)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) {
        throw new Error(`Failed to fetch notifications: ${error.message}`)
      }
      
      return data || []
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds (notifications should be fresh)
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Fetch unread notifications count
export function useUnreadNotificationsCount() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: async (): Promise<number> => {
      if (!supabase || !user?.id) {
        return 0
      }
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},organization_id.eq.${user.organization_id}`)
        .eq('is_read', false)
      
      if (error) {
        throw new Error(`Failed to fetch unread count: ${error.message}`)
      }
      
      return count || 0
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}

// Mark a notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
      
      if (error) {
        throw new Error(`Failed to mark notification as read: ${error.message}`)
      }
    },
    onSuccess: (_, notificationId) => {
      // Update the notification in cache
      queryClient.setQueryData(
        queryKeys.notifications.all,
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData
          
          return oldData.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        }
      )
      
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread
      })
    },
    onError: (error: Error) => {
      console.error('Failed to mark notification as read:', error)
    },
  })
}

// Mark all notifications as read
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!supabase || !user?.id) {
        throw new Error('Authentication required')
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .or(`user_id.eq.${user.id},organization_id.eq.${user.organization_id}`)
        .eq('is_read', false)
      
      if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`)
      }
    },
    onSuccess: () => {
      // Update all notifications in cache
      queryClient.setQueryData(
        queryKeys.notifications.all,
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData
          
          return oldData.map(notification => ({
            ...notification,
            is_read: true
          }))
        }
      )
      
      // Update unread count to 0
      queryClient.setQueryData(queryKeys.notifications.unread, 0)
    },
    onError: (error: Error) => {
      console.error('Failed to mark all notifications as read:', error)
    },
  })
}

// Delete a notification
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      
      if (error) {
        throw new Error(`Failed to delete notification: ${error.message}`)
      }
    },
    onSuccess: (_, notificationId) => {
      // Remove notification from cache
      queryClient.setQueryData(
        queryKeys.notifications.all,
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData
          
          return oldData.filter(notification => notification.id !== notificationId)
        }
      )
      
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread
      })
    },
    onError: (error: Error) => {
      console.error('Failed to delete notification:', error)
    },
  })
}

// Create a new notification (for system use)
export function useCreateNotification() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (notificationData: {
      type: string
      title: string
      message: string
      data?: any
      user_id?: string
      organization_id?: string
    }): Promise<Notification> => {
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notificationData,
          organization_id: notificationData.organization_id || user?.organization_id,
          is_read: false,
        }])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create notification: ${error.message}`)
      }
      
      return data
    },
    onSuccess: (newNotification) => {
      // Add notification to cache
      queryClient.setQueryData(
        queryKeys.notifications.all,
        (oldData: Notification[] | undefined) => {
          if (!oldData) return [newNotification]
          
          return [newNotification, ...oldData]
        }
      )
      
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread
      })
    },
    onError: (error: Error) => {
      console.error('Failed to create notification:', error)
    },
  })
}

// Hook to sync notifications with Zustand store
export function useSyncNotifications() {
  const { data: notifications } = useNotifications()
  const { data: unreadCount } = useUnreadNotificationsCount()
  const setNotifications = useNotificationStore((state) => state.setNotifications)
  
  // Sync with Zustand store when data changes
  React.useEffect(() => {
    if (notifications) {
      setNotifications(notifications)
    }
  }, [notifications, setNotifications])
  
  return {
    notifications,
    unreadCount,
  }
}
