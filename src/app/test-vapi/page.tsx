'use client'

import { useState, useEffect, useRef } from 'react'
import { createVapi } from '@/lib/vapiConfig'

export default function TestVapiPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const vapiRef = useRef<any>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[${timestamp}] ${message}`)
  }

  useEffect(() => {
    // Initialize Vapi
    const initVapi = async () => {
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY

      if (!publicKey) {
        addLog('❌ No public key found in environment')
        return
      }

      addLog(`🔧 Initializing Vapi with key: ${publicKey.substring(0, 8)}...`)

      try {
        const vapi = await createVapi(publicKey)
        vapiRef.current = vapi
        addLog('✅ Vapi instance created successfully')

      // Set up event listeners
      vapi.on('call-start', () => {
        addLog('📞 Call started')
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
      })

      vapi.on('call-end', () => {
        addLog('📞 Call ended')
        setIsConnected(false)
        setIsConnecting(false)
      })

      vapi.on('error', (error: any) => {
        // Better error formatting
        const errorDetails = {
          message: error.message,
          type: error.type,
          code: error.code,
          name: error.name,
          toString: error.toString(),
          full: JSON.stringify(error, null, 2)
        }

        addLog(`❌ Vapi error details: ${JSON.stringify(errorDetails, null, 2)}`)

        // Only set as critical error if it's actually blocking functionality
        if (error.message && !error.message.includes('speech') && !error.message.includes('update')) {
          setError(error.message || 'Unknown error')
          setIsConnecting(false)
          setIsConnected(false)
        } else {
          addLog('ℹ️ This appears to be a non-critical status update, not a blocking error')
        }
      })

      vapi.on('speech-start', () => {
        addLog('🗣️ Assistant started speaking')
      })

      vapi.on('speech-end', () => {
        addLog('🤐 Assistant stopped speaking')
      })

      vapi.on('message', (message: any) => {
        addLog(`💬 Message: ${JSON.stringify(message)}`)
      })

      addLog('✅ Event listeners configured')

      } catch (initError: any) {
        addLog(`❌ Failed to initialize Vapi: ${initError.message}`)
        setError(initError.message)
      }
    }

    initVapi()
  }, [])

  const testFrontendIntegration = async () => {
    addLog('🧪 Testing frontend integration...')

    try {
      const response = await fetch('/api/test-vapi-frontend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistantId: '5d666b03-7575-48ce-817a-f0e2cbefa6de', // ZyxAI Customer Support Preset
          publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
        })
      })

      const result = await response.json()
      addLog(`🧪 Frontend test result: ${JSON.stringify(result, null, 2)}`)

    } catch (error: any) {
      addLog(`❌ Frontend test failed: ${error.message}`)
    }
  }

  const testDailyConnectivity = async () => {
    addLog('🌐 Testing Daily.co connectivity...')

    try {
      // Test server-side connectivity
      const response = await fetch('/api/test-daily-connectivity')
      const result = await response.json()
      addLog(`🌐 Server-side Daily.co test: ${JSON.stringify(result, null, 2)}`)

      // Test browser-side connectivity
      addLog('🌐 Testing browser-side Daily.co access...')

      const bundleUrl = 'https://c.daily.co/call-machine/versioned/0.79.0/static/call-machine-object-bundle.js'

      try {
        const browserResponse = await fetch(bundleUrl, {
          method: 'HEAD',
          mode: 'cors'
        })

        addLog(`✅ Browser can access Daily.co bundle (status: ${browserResponse.status})`)

      } catch (browserError: any) {
        addLog(`❌ Browser cannot access Daily.co bundle: ${browserError.message}`)
        addLog('🔧 This is likely the root cause of the Vapi error')

        // Try with no-cors mode
        try {
          await fetch(bundleUrl, {
            method: 'HEAD',
            mode: 'no-cors'
          })
          addLog('✅ Bundle accessible with no-cors mode')
        } catch (noCorsError: any) {
          addLog(`❌ Bundle not accessible even with no-cors: ${noCorsError.message}`)
        }
      }

      if (!result.success || !result.tests.bundleReachable) {
        addLog('❌ Daily.co bundle not accessible - this is likely the cause of the "Failed to fetch" error')
        addLog('💡 Recommendations:')
        result.recommendations?.forEach((rec: string) => addLog(`   • ${rec}`))
      }

    } catch (error: any) {
      addLog(`❌ Daily.co test failed: ${error.message}`)
    }
  }

  const startTestCall = async () => {
    if (!vapiRef.current) {
      addLog('❌ Vapi not initialized')
      return
    }

    setIsConnecting(true)
    setError(null)
    addLog('🎤 Starting test call...')

    try {
      // Use a known working assistant ID
      const assistantId = '5d666b03-7575-48ce-817a-f0e2cbefa6de' // ZyxAI Customer Support Preset
      addLog(`🤖 Using assistant ID: ${assistantId}`)

      await vapiRef.current.start(assistantId)
      addLog('✅ Call start request sent')

    } catch (error: any) {
      addLog(`❌ Failed to start call: ${error.message}`)
      addLog(`🔧 Error details: ${JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n')[0]
      })}`)
      setError(error.message)
      setIsConnecting(false)
    }
  }

  const stopCall = () => {
    if (vapiRef.current) {
      addLog('🛑 Stopping call...')
      vapiRef.current.stop()
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const testDirectScriptLoad = () => {
    addLog('🔄 Testing direct script injection...')

    const bundleUrl = 'https://c.daily.co/call-machine/versioned/0.79.0/static/call-machine-object-bundle.js'
    const script = document.createElement('script')
    script.src = bundleUrl
    script.async = true
    script.crossOrigin = 'anonymous'

    script.onload = () => {
      addLog('✅ Daily.co bundle loaded successfully via script injection!')
      addLog('🎯 This suggests the issue might be with how Vapi loads the bundle')
    }

    script.onerror = (error) => {
      addLog(`❌ Script injection failed: ${error}`)
      addLog('🎯 This confirms the browser cannot load Daily.co resources')
    }

    document.head.appendChild(script)
    addLog('📝 Script tag added to document head, waiting for result...')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Vapi Integration Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>

            <div className="space-y-4">
              <button
                onClick={testFrontendIntegration}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Test Frontend Integration
              </button>

              <button
                onClick={testDailyConnectivity}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Test Daily.co Connectivity
              </button>

              <button
                onClick={testDirectScriptLoad}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
              >
                Test Direct Script Load
              </button>

              <button
                onClick={startTestCall}
                disabled={isConnecting || isConnected}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {isConnecting ? 'Connecting...' : isConnected ? 'Call Active' : 'Start Test Call'}
              </button>

              <button
                onClick={stopCall}
                disabled={!isConnected}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                Stop Call
              </button>

              <button
                onClick={clearLogs}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Clear Logs
              </button>
            </div>

            {/* Status */}
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Status</h3>
              <div className="space-y-1 text-sm">
                <div>Connection: <span className={isConnected ? 'text-green-600' : 'text-gray-600'}>{isConnected ? 'Connected' : 'Disconnected'}</span></div>
                <div>Connecting: <span className={isConnecting ? 'text-yellow-600' : 'text-gray-600'}>{isConnecting ? 'Yes' : 'No'}</span></div>
                {error && <div>Error: <span className="text-red-600">{error}</span></div>}
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
            <div className="bg-black text-green-400 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
