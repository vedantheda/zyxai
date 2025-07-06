'use client'
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { LoadingOverlay } from '@/components/ui/loading-with-retry'
interface LoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean, message?: string) => void
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>
  forceStopLoading: () => void
}
const LoadingContext = createContext<LoadingContextType | undefined>(undefined)
interface LoadingProviderProps {
  children: React.ReactNode
  maxLoadingTime?: number // Maximum time to show loading before auto-stopping
}
export function LoadingProvider({
  children,
  maxLoadingTime = 15000 // 15 seconds max
}: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Loading...')
  const timeoutRef = useRef<NodeJS.Timeout>()
  const loadingStartRef = useRef<number>()
  // Auto-stop loading after max time to prevent stuck states
  const startLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    loadingStartRef.current = Date.now()
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false)
      setLoadingMessage('Loading...')
    }, maxLoadingTime)
  }, [maxLoadingTime])
  const stopLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (loadingStartRef.current) {
      const duration = Date.now() - loadingStartRef.current
      console.log(`🔄 Loading completed in ${duration}ms`)
      loadingStartRef.current = undefined
    }
  }, [])
  const setLoading = useCallback((loading: boolean, message = 'Loading...') => {
    console.log(`🔄 Loading state: ${loading ? 'START' : 'STOP'}`, { message })
    if (loading) {
      setIsLoading(true)
      setLoadingMessage(message)
      startLoadingTimeout()
    } else {
      setIsLoading(false)
      setLoadingMessage('Loading...')
      stopLoadingTimeout()
    }
  }, [startLoadingTimeout, stopLoadingTimeout])
  const withLoading = useCallback(<T,>(
    promise: Promise<T>,
    message = 'Loading...'
  ): Promise<T> => {
    setLoading(true, message)
    return promise.then(
      (result) => {
        setLoading(false)
        return result
      },
      (error) => {
        setLoading(false)
        throw error
      }
    )
  }, [setLoading])
  const forceStopLoading = useCallback(() => {
    setLoading(false)
  }, [setLoading])
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  // Monitor for stuck loading states
  useEffect(() => {
    if (isLoading) {
      const checkInterval = setInterval(() => {
        if (loadingStartRef.current) {
          const duration = Date.now() - loadingStartRef.current
          if (duration > maxLoadingTime * 0.8) { // Warn at 80% of max time
            console.warn(`Loading taking longer than expected (${duration / 1000}s)`)
          }
        }
      }, 2000)
      return () => clearInterval(checkInterval)
    }
  }, [isLoading, maxLoadingTime])
  const value = {
    isLoading,
    setLoading,
    withLoading,
    forceStopLoading
  }
  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </LoadingContext.Provider>
  )
}
export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
// Hook for automatic loading management with retry
export function useAsyncWithLoading() {
  const { withLoading } = useLoading()
  const [error, setError] = useState<Error | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const retryCountRef = useRef(0)
  const execute = useCallback(<T,>(
    asyncFn: () => Promise<T>,
    options: {
      message?: string
      maxRetries?: number
      retryDelay?: number
      onError?: (error: Error, attempt: number) => void
    } = {}
  ): Promise<T | null> => {
    return (async (): Promise<T | null> => {
    const {
      message = 'Loading...',
      maxRetries = 2,
      retryDelay = 1000,
      onError
    } = options
    setError(null)
    retryCountRef.current = 0
    const attemptExecution = async (): Promise<T> => {
      retryCountRef.current++
      const isRetry = retryCountRef.current > 1
      if (isRetry) {
        setIsRetrying(true)
      }
      try {
        const loadingMessage = isRetry
          ? `${message} (Attempt ${retryCountRef.current}/${maxRetries + 1})`
          : message
        const result = await withLoading(asyncFn(), loadingMessage)
        // Success - reset retry state
        setIsRetrying(false)
        retryCountRef.current = 0
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        console.error(`Execution failed:`, error.message)
        onError?.(error, retryCountRef.current)
        if (retryCountRef.current <= maxRetries) {
          console.log(`Retrying in ${retryDelay}ms... (${retryCountRef.current}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current))
          return attemptExecution()
        } else {
          setError(error)
          setIsRetrying(false)
          throw error
        }
      }
    }
    try {
      return await attemptExecution()
    } catch (err) {
      return null
    }
    })()
  }, [withLoading])
  const retry = useCallback(<T,>(
    asyncFn: () => Promise<T>,
    message = 'Retrying...'
  ): Promise<T | null> => {
    return execute(asyncFn, { message, maxRetries: 1 })
  }, [execute])
  return {
    execute,
    retry,
    error,
    isRetrying,
    currentAttempt: retryCountRef.current
  }
}
