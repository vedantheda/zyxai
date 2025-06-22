'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'

export interface UserPresence {
  userId: string
  isOnline: boolean
  lastSeen: Date
  userName?: string
}

export function useUserPresence() {
  const { session } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(new Map())
  const [isOnline, setIsOnline] = useState(true)
  const presenceChannelRef = useRef<any>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()

  // Update user's online status
  const updatePresence = useCallback(async (online: boolean) => {
    if (!session?.user?.id) return

    try {
      // Send presence update through real-time channel
      if (presenceChannelRef.current) {
        presenceChannelRef.current.send({
          type: 'broadcast',
          event: 'presence',
          payload: {
            userId: session.user.id,
            userName: session.user.user_metadata?.full_name || session.user.email,
            isOnline: online,
            lastSeen: new Date().toISOString()
          }
        })
      }
    } catch (error) {
      console.error('Failed to update presence:', error)
    }
  }, [session?.user?.id, session?.user?.user_metadata?.full_name, session?.user?.email])

  // Handle presence updates from other users
  const handlePresenceUpdate = useCallback((payload: any) => {
    const { userId, userName, isOnline, lastSeen } = payload

    setOnlineUsers(prev => {
      const newMap = new Map(prev)
      newMap.set(userId, {
        userId,
        userName,
        isOnline,
        lastSeen: new Date(lastSeen)
      })
      return newMap
    })

    // Auto-remove offline users after 5 minutes
    if (!isOnline) {
      setTimeout(() => {
        setOnlineUsers(prev => {
          const newMap = new Map(prev)
          const user = newMap.get(userId)
          if (user && !user.isOnline) {
            newMap.delete(userId)
          }
          return newMap
        })
      }, 5 * 60 * 1000) // 5 minutes
    }
  }, [])

  // Setup presence tracking
  useEffect(() => {
    if (!session?.user?.id) return

    // Clean up existing channel first
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current)
      presenceChannelRef.current = null
    }

    // Create unique presence channel
    const channelName = `user-presence-${session.user.id}-${Date.now()}`
    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'presence' }, (payload) => {
        handlePresenceUpdate(payload.payload)
      })
      .subscribe()

    presenceChannelRef.current = channel

    // Send initial presence
    updatePresence(true)

    // Send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      updatePresence(true)
    }, 30000)

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      const online = !document.hidden
      setIsOnline(online)
      updatePresence(online)
    }

    // Handle beforeunload to mark as offline
    const handleBeforeUnload = () => {
      updatePresence(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      // Cleanup
      if (presenceChannelRef.current) {
        updatePresence(false)
        supabase.removeChannel(presenceChannelRef.current)
        presenceChannelRef.current = null
      }

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [session?.user?.id, updatePresence, handlePresenceUpdate])

  // Get online status for specific user
  const getUserPresence = useCallback((userId: string): UserPresence | null => {
    return onlineUsers.get(userId) || null
  }, [onlineUsers])

  // Check if user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    const presence = onlineUsers.get(userId)
    return presence?.isOnline || false
  }, [onlineUsers])

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    isOnline,
    getUserPresence,
    isUserOnline,
    updatePresence
  }
}
