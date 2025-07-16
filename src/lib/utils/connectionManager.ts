'use client'

import React from 'react'
import { supabase } from '@/lib/supabase'

interface ConnectionState {
  isOnline: boolean
  lastCheck: number
  retryCount: number
  maxRetries: number
}

class ConnectionManager {
  private state: ConnectionState = {
    isOnline: true,
    lastCheck: Date.now(),
    retryCount: 0,
    maxRetries: 3
  }

  private listeners: Set<(isOnline: boolean) => void> = new Set()
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    this.setupEventListeners()
    this.startHealthCheck()
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Browser came online')
      this.handleConnectionChange(true)
    })

    window.addEventListener('offline', () => {
      console.log('🌐 Browser went offline')
      this.handleConnectionChange(false)
    })

    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('👁️ Tab became visible, checking connection')
        this.checkConnection()
      }
    })

    // Listen for window focus
    window.addEventListener('focus', () => {
      console.log('🎯 Window focused, checking connection')
      this.checkConnection()
    })
  }

  private startHealthCheck() {
    // Check connection every 30 seconds when tab is visible
    this.checkInterval = setInterval(() => {
      if (!document.hidden) {
        this.checkConnection()
      }
    }, 30000)
  }

  private async checkConnection(): Promise<boolean> {
    if (!supabase) {
      this.handleConnectionChange(false)
      return false
    }

    try {
      // Simple health check query
      const { error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1)
        .single()

      const isOnline = !error
      this.handleConnectionChange(isOnline)
      
      if (isOnline) {
        this.state.retryCount = 0
      }

      return isOnline
    } catch (error) {
      console.warn('🔌 Connection check failed:', error)
      this.handleConnectionChange(false)
      return false
    }
  }

  private handleConnectionChange(isOnline: boolean) {
    const wasOnline = this.state.isOnline
    this.state.isOnline = isOnline
    this.state.lastCheck = Date.now()

    // Notify listeners if state changed
    if (wasOnline !== isOnline) {
      console.log(`🔌 Connection state changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`)
      this.listeners.forEach(listener => listener(isOnline))
    }

    // If we're offline, start retry logic
    if (!isOnline && this.state.retryCount < this.state.maxRetries) {
      this.scheduleRetry()
    }
  }

  private scheduleRetry() {
    this.state.retryCount++
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000) // Exponential backoff, max 10s

    console.log(`🔄 Scheduling connection retry ${this.state.retryCount}/${this.state.maxRetries} in ${delay}ms`)

    setTimeout(() => {
      this.checkConnection()
    }, delay)
  }

  // Public methods
  public isOnline(): boolean {
    return this.state.isOnline
  }

  public addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public async forceCheck(): Promise<boolean> {
    return await this.checkConnection()
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.listeners.clear()
  }
}

// Singleton instance
let connectionManager: ConnectionManager | null = null

export function getConnectionManager(): ConnectionManager {
  if (typeof window === 'undefined') {
    // Return a mock for server-side rendering
    return {
      isOnline: () => true,
      addListener: () => () => {},
      forceCheck: async () => true,
      destroy: () => {}
    } as ConnectionManager
  }

  if (!connectionManager) {
    connectionManager = new ConnectionManager()
  }

  return connectionManager
}

// Hook for React components
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    const manager = getConnectionManager()
    setIsOnline(manager.isOnline())

    const unsubscribe = manager.addListener(setIsOnline)
    return unsubscribe
  }, [])

  return {
    isOnline,
    forceCheck: () => getConnectionManager().forceCheck()
  }
}

// For non-React usage
export { ConnectionManager }
