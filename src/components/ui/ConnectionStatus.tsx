'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { getConnectionManager } from '@/lib/utils/connectionManager'
import { cn } from '@/lib/utils'

interface ConnectionStatusProps {
  className?: string
  showText?: boolean
}

export function ConnectionStatus({ className, showText = false }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const manager = getConnectionManager()
    setIsOnline(manager.isOnline())

    const unsubscribe = manager.addListener(setIsOnline)
    return unsubscribe
  }, [])

  const handleForceCheck = async () => {
    setIsChecking(true)
    const manager = getConnectionManager()
    await manager.forceCheck()
    setIsChecking(false)
  }

  if (isOnline) {
    return showText ? (
      <div className={cn("flex items-center space-x-2 text-green-600", className)}>
        <Wifi className="h-4 w-4" />
        <span className="text-sm">Connected</span>
      </div>
    ) : null // Don't show anything when online unless text is requested
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex items-center space-x-2 text-red-600">
        <WifiOff className="h-4 w-4" />
        {showText && <span className="text-sm">Disconnected</span>}
      </div>
      <button
        onClick={handleForceCheck}
        disabled={isChecking}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Retry connection"
      >
        <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
      </button>
    </div>
  )
}

// Toast notification for connection changes
export function ConnectionToast() {
  const [isOnline, setIsOnline] = useState(true)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const manager = getConnectionManager()
    setIsOnline(manager.isOnline())

    const unsubscribe = manager.addListener((online) => {
      const wasOnline = isOnline
      setIsOnline(online)
      
      // Show toast when connection state changes
      if (wasOnline !== online) {
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }
    })

    return unsubscribe
  }, [isOnline])

  if (!showToast) return null

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300",
      isOnline 
        ? "bg-green-100 border border-green-200 text-green-800"
        : "bg-red-100 border border-red-200 text-red-800"
    )}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="h-5 w-5" />
        ) : (
          <WifiOff className="h-5 w-5" />
        )}
        <span className="font-medium">
          {isOnline ? 'Connection restored' : 'Connection lost'}
        </span>
      </div>
    </div>
  )
}
