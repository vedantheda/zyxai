'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'

export function useUnreadMessages() {
  const { session } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.access_token) return

    try {
      setLoading(true)
      
      const response = await fetch('/api/messages/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const stats = await response.json()
        setUnreadCount(stats.unreadMessages || 0)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  // Real-time subscription for unread count updates
  useEffect(() => {
    if (!session?.user?.id) return

    // Initial fetch
    fetchUnreadCount()

    // Subscribe to message changes
    const channel = supabase.channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as any
          // If message is not from current user, increment unread count
          if (newMessage.sender_id !== session.user.id) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const updatedMessage = payload.new as any
          const oldMessage = payload.old as any
          
          // If message was marked as read and it wasn't read before
          if (updatedMessage.is_read && !oldMessage.is_read && updatedMessage.sender_id !== session.user.id) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id, fetchUnreadCount])

  const markAllAsRead = useCallback(async () => {
    if (!session?.access_token) return

    try {
      await fetch('/api/messages/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }, [session?.access_token])

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount,
    markAllAsRead
  }
}
