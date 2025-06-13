'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Clock, AlertTriangle } from 'lucide-react'
/**
 * Session Timeout Warning Component
 * Warns users before their session expires and provides option to extend
 */
interface SessionTimeoutWarningProps {
  warningTimeMinutes?: number // Show warning X minutes before expiry
  sessionDurationMinutes?: number // Total session duration
}
export function SessionTimeoutWarning({
  warningTimeMinutes = 5,
  sessionDurationMinutes = 60
}: SessionTimeoutWarningProps) {
  // TEMPORARILY DISABLED: Complex session timeout functionality
  // This component requires complex session refresh logic that we've simplified
  console.log('🔐 SessionTimeoutWarning: DISABLED for simplicity')
  return null
  // const { session, refreshSession, signOut } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isExtending, setIsExtending] = useState(false)
  // Calculate session expiry time
  const getSessionExpiryTime = useCallback(() => {
    if (!session?.expires_at) return null
    return new Date(session.expires_at * 1000)
  }, [session])
  // Check if session is close to expiry
  const checkSessionExpiry = useCallback(() => {
    const expiryTime = getSessionExpiryTime()
    if (!expiryTime) return
    const now = new Date()
    const timeUntilExpiry = expiryTime.getTime() - now.getTime()
    const warningThreshold = warningTimeMinutes * 60 * 1000
    if (timeUntilExpiry <= warningThreshold && timeUntilExpiry > 0) {
      setTimeRemaining(Math.floor(timeUntilExpiry / 1000))
      setShowWarning(true)
    } else if (timeUntilExpiry <= 0) {
      // Session has expired
      handleSessionExpired()
    } else {
      setShowWarning(false)
    }
  }, [getSessionExpiryTime, warningTimeMinutes])
  // Handle session expiry
  const handleSessionExpired = useCallback(async () => {
    setShowWarning(false)
    await signOut()
  }, [signOut])
  // Extend session
  const handleExtendSession = async () => {
    try {
      setIsExtending(true)
      await refreshSession()
      setShowWarning(false)
    } catch (error) {
      // If refresh fails, sign out
      await signOut()
    } finally {
      setIsExtending(false)
    }
  }
  // Sign out immediately
  const handleSignOut = async () => {
    setShowWarning(false)
    await signOut()
  }
  // Set up interval to check session expiry
  useEffect(() => {
    if (!session) return
    const interval = setInterval(checkSessionExpiry, 30000) // Check every 30 seconds
    checkSessionExpiry() // Check immediately
    return () => clearInterval(interval)
  }, [session, checkSessionExpiry])
  // Update countdown timer
  useEffect(() => {
    if (!showWarning) return
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSessionExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showWarning, handleSessionExpired])
  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  // Calculate progress percentage
  const progressPercentage = Math.max(0, (timeRemaining / (warningTimeMinutes * 60)) * 100)
  if (!showWarning) return null
  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire in {formatTimeRemaining(timeRemaining)}.
            Would you like to extend your session?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Time remaining: {formatTimeRemaining(timeRemaining)}
          </div>
          <Progress
            value={progressPercentage}
            className="w-full"
            aria-label={`Session expires in ${formatTimeRemaining(timeRemaining)}`}
          />
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={isExtending}
            className="w-full sm:w-auto"
          >
            Sign Out
          </Button>
          <Button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="w-full sm:w-auto"
          >
            {isExtending ? 'Extending...' : 'Extend Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
/**
 * Hook for session timeout management
 */
export function useSessionTimeout(warningMinutes: number = 5) {
  // TEMPORARILY DISABLED: Complex session timeout functionality
  const [isNearExpiry, setIsNearExpiry] = useState(false)
  // DISABLED: Complex session expiry checking
  // useEffect(() => {
  //   if (!session?.expires_at) return
  //   ...
  // }, [session, warningMinutes])
  return { isNearExpiry }
}
