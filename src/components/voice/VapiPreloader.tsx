'use client'

import { useEffect, useState } from 'react'

interface VapiPreloaderProps {
  onPreloadComplete?: (success: boolean) => void
}

export function VapiPreloader({ onPreloadComplete }: VapiPreloaderProps) {
  const [preloadStatus, setPreloadStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  useEffect(() => {
    const preloadDailyBundle = async () => {
      try {
        console.log('🔄 Preloading Daily.co bundle...')
        
        // Try to preload the Daily.co bundle that Vapi needs
        const bundleUrl = 'https://c.daily.co/call-machine/versioned/0.79.0/static/call-machine-object-bundle.js'
        
        const response = await fetch(bundleUrl, {
          method: 'HEAD',
          mode: 'no-cors' // Try to bypass CORS for preload
        })
        
        console.log('✅ Daily.co bundle preload successful')
        setPreloadStatus('success')
        onPreloadComplete?.(true)
        
      } catch (error: any) {
        console.error('❌ Daily.co bundle preload failed:', error)
        setErrorDetails(error.message)
        setPreloadStatus('error')
        onPreloadComplete?.(false)
        
        // Try alternative approach - inject script tag
        try {
          console.log('🔄 Trying alternative script injection...')
          
          const script = document.createElement('script')
          script.src = 'https://c.daily.co/call-machine/versioned/0.79.0/static/call-machine-object-bundle.js'
          script.async = true
          script.crossOrigin = 'anonymous'
          
          script.onload = () => {
            console.log('✅ Daily.co bundle loaded via script injection')
            setPreloadStatus('success')
            onPreloadComplete?.(true)
          }
          
          script.onerror = () => {
            console.error('❌ Script injection also failed')
            setPreloadStatus('error')
            onPreloadComplete?.(false)
          }
          
          document.head.appendChild(script)
          
        } catch (scriptError: any) {
          console.error('❌ Script injection failed:', scriptError)
          setPreloadStatus('error')
          onPreloadComplete?.(false)
        }
      }
    }

    preloadDailyBundle()
  }, [onPreloadComplete])

  if (preloadStatus === 'loading') {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Loading voice components...</span>
      </div>
    )
  }

  if (preloadStatus === 'error') {
    return (
      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
        <div className="font-medium">Voice components failed to load</div>
        <div className="text-xs mt-1">
          Network issue detected. Voice features may not work properly.
          {errorDetails && <div className="mt-1">Error: {errorDetails}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
      ✅ Voice components loaded successfully
    </div>
  )
}
