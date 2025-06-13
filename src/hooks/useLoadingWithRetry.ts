'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
interface UseLoadingWithRetryOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  onError?: (error: Error, attempt: number) => void
  onSuccess?: () => void
  onTimeout?: () => void
}
interface LoadingState {
  isLoading: boolean
  error: Error | null
  attempt: number
  isRetrying: boolean
  hasTimedOut: boolean
}
export function useLoadingWithRetry(options: UseLoadingWithRetryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 10000,
    onError,
    onSuccess,
    onTimeout
  } = options
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    attempt: 0,
    isRetrying: false,
    hasTimedOut: false
  })
  const timeoutRef = useRef<NodeJS.Timeout>()
  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()
  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = undefined
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = undefined
    }
  }, [])
  // Execute function with retry logic
  const execute = useCallback(async <T>(
    asyncFunction: (signal?: AbortSignal) => Promise<T>
  ): Promise<T> => {
    cleanup()
    return new Promise<T>((resolve, reject) => {
      const attemptExecution = async (attemptNumber: number) => {
        console.log(`🔄 Loading attempt ${attemptNumber}/${maxRetries + 1}`)
        setState(prev => ({
          ...prev,
          isLoading: true,
          error: null,
          attempt: attemptNumber,
          isRetrying: attemptNumber > 1,
          hasTimedOut: false
        }))
        // Create new abort controller for this attempt
        abortControllerRef.current = new AbortController()
        const signal = abortControllerRef.current.signal
        // Set timeout for this attempt
        timeoutRef.current = setTimeout(() => {
          `)
          setState(prev => ({
            ...prev,
            hasTimedOut: true,
            isLoading: false
          }))
          if (abortControllerRef.current) {
            abortControllerRef.current.abort()
          }
          if (attemptNumber <= maxRetries) {
            console.log(`🔄 Retrying due to timeout... (${attemptNumber}/${maxRetries})`)
            retryTimeoutRef.current = setTimeout(() => {
              attemptExecution(attemptNumber + 1)
            }, retryDelay * attemptNumber) // Exponential backoff
          } else {
            const timeoutError = new Error(`Operation timed out after ${maxRetries + 1} attempts`)
            onTimeout?.()
            onError?.(timeoutError, attemptNumber)
            reject(timeoutError)
          }
        }, timeout)
        try {
          const result = await asyncFunction(signal)
          // Success - cleanup and resolve
          cleanup()
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: null,
            isRetrying: false,
            hasTimedOut: false
          }))
          onSuccess?.()
          resolve(result)
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error')
          // If aborted, don't retry
          if (signal.aborted) {
            console.log('🛑 Operation was aborted')
            return
          }
          setState(prev => ({
            ...prev,
            error: err,
            isLoading: false,
            isRetrying: false
          }))
          onError?.(err, attemptNumber)
          // Retry if we haven't exceeded max attempts
          if (attemptNumber <= maxRetries) {
            console.log(`🔄 Retrying due to error... (${attemptNumber}/${maxRetries})`)
            setState(prev => ({
              ...prev,
              isRetrying: true
            }))
            retryTimeoutRef.current = setTimeout(() => {
              attemptExecution(attemptNumber + 1)
            }, retryDelay * attemptNumber) // Exponential backoff
          } else {
            `)
            reject(err)
          }
        }
      }
      // Start first attempt
      attemptExecution(1)
    })
  }, [maxRetries, retryDelay, timeout, onError, onSuccess, onTimeout, cleanup])
  // Reset function
  const reset = useCallback(() => {
    cleanup()
    setState({
      isLoading: false,
      error: null,
      attempt: 0,
      isRetrying: false,
      hasTimedOut: false
    })
  }, [cleanup])
  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])
  return {
    ...state,
    execute,
    reset,
    canRetry: state.attempt <= maxRetries && !state.isLoading
  }
}
