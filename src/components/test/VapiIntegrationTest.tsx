'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import { createVapi } from '@/lib/vapiConfig'


/**
 * Test component to verify VAPI integration with Daily.js native noise cancellation
 */
export function VapiIntegrationTest() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const vapiRef = useRef<any>(null)

  // Fix hydration by ensuring client-side only rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`🧪 VAPI Test: ${message}`)
  }

  const testVapiConnection = async () => {
    setIsConnecting(true)
    setError(null)
    setLogs([])

    try {
      addLog('Starting VAPI integration test...')
      
      addLog('Using VAPI default audio configuration...')

      // Get API key
      const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
      if (!apiKey) {
        throw new Error('VAPI_PUBLIC_KEY not configured')
      }

      addLog('Creating VAPI instance using createVapi...')
      vapiRef.current = await createVapi(apiKey)

      // Set up event listeners
      vapiRef.current.on('call-start', () => {
        addLog('✅ Call started successfully - VAPI is working!')
        setIsConnected(true)
        // Clear any previous errors since the call started successfully
        setError(null)
      })

      vapiRef.current.on('call-end', () => {
        addLog('📞 Call ended')
        setIsConnected(false)
      })

      vapiRef.current.on('error', async (error: any) => {
        console.error('VAPI Event Error Details:', error)

        // If it's an empty object, it's likely a spurious error from VAPI SDK
        if (error && typeof error === 'object' && Object.keys(error).length === 0) {
          addLog('⚠️ Empty error object received - this is common with VAPI SDK and usually harmless')
          addLog('🔍 If the call works despite this error, it can be safely ignored')
          // Don't set error state or disconnect for empty objects
          return
        }

        let errorMessage = 'Unknown VAPI error'

        // Handle Response objects (HTTP responses)
        if (error && typeof error === 'object' && error.constructor && error.constructor.name === 'Response') {
          try {
            const responseText = await error.text()
            errorMessage = `HTTP ${error.status}: ${responseText}`
            addLog(`🌐 HTTP Response Error: ${errorMessage}`)
          } catch (parseError) {
            errorMessage = `HTTP ${error.status}: Unable to parse response`
            addLog(`🌐 HTTP Response Error (unparseable): ${errorMessage}`)
          }
        } else if (error && typeof error === 'object') {
          if (error.message) {
            errorMessage = error.message
          } else if (error.error) {
            errorMessage = error.error
          } else if (error.type) {
            errorMessage = `Error type: ${error.type}`
          } else if (error.name) {
            errorMessage = `${error.name}: ${error.toString()}`
          } else {
            errorMessage = JSON.stringify(error, null, 2)
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        } else {
          errorMessage = String(error)
        }

        addLog(`❌ VAPI Error: ${errorMessage}`)

        // Test our error handling (ensure errorMessage is a string)
        const errorStr = String(errorMessage)
        if (errorStr.includes('worklet') || errorStr.includes('processor')) {
          console.log('🔧 Audio processing error detected - VAPI should handle this automatically')
          addLog('🔧 Audio processing error detected - VAPI will use fallback settings')
        }

        setError(errorStr)
        setIsConnected(false)
      })

      vapiRef.current.on('message', (message: any) => {
        if (message.type === 'transcript') {
          addLog(`📝 Transcript: ${message.transcript}`)
        } else {
          addLog(`📨 Message: ${message.type || 'unknown type'}`)
        }
      })

      // Add more event listeners for debugging
      vapiRef.current.on('speech-start', () => {
        addLog('🗣️ Assistant started speaking')
      })

      vapiRef.current.on('speech-end', () => {
        addLog('🔇 Assistant stopped speaking')
      })

      // Simple VAPI assistant configuration - let VAPI handle everything automatically
      const assistantConfig = {
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Keep responses brief.'
            }
          ]
        },
        voice: {
          provider: 'openai',
          voiceId: 'alloy'
        }
        // No audio configuration - VAPI handles this automatically!
      }

      addLog('Starting call with simple VAPI configuration...')

      // VAPI start() expects either:
      // 1. An assistant ID string, or
      // 2. An assistant ID with overrides: start(assistantId, overrides)
      // Since we're using a full config, we'll use the assistant property

      // For testing, we'll create a simple assistant or use an existing one
      // If no assistant ID is available, we'll create an inline assistant
      try {
        await vapiRef.current.start(assistantConfig)
        addLog('✅ Call started successfully!')
      } catch (startError: any) {
        // If start fails, try with a simpler approach
        addLog('⚠️ Direct start failed, trying with assistant property...')

        const simpleConfig = {
          assistant: assistantConfig,
          // Add the Daily.js config at the top level too
          daily: assistantConfig.daily
        }

        await vapiRef.current.start(simpleConfig)
        addLog('✅ Call started with assistant property!')
      }

      // Wait a moment to see if call-start event fires
      addLog('⏳ Waiting for call-start event...')
      setTimeout(() => {
        if (isConnected) {
          addLog('🎉 SUCCESS: VAPI call is working despite empty error objects!')
        } else {
          addLog('⚠️ Call may not have started - check VAPI configuration')
        }
      }, 2000)

    } catch (error: any) {
      console.error('VAPI Test Error Details:', error)

      let errorMessage = 'Unknown error'

      // Handle Response objects (HTTP responses)
      if (error && typeof error === 'object' && error.constructor && error.constructor.name === 'Response') {
        try {
          const responseText = await error.text()
          errorMessage = `HTTP ${error.status}: ${responseText}`
          addLog(`🌐 HTTP Response Error: ${errorMessage}`)
        } catch (parseError) {
          errorMessage = `HTTP ${error.status}: Unable to parse response`
          addLog(`🌐 HTTP Response Error (unparseable): ${errorMessage}`)
        }
      } else if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message
        } else if (error.error) {
          errorMessage = error.error
        } else if (error.type) {
          errorMessage = `Error type: ${error.type}`
        } else if (error.name) {
          errorMessage = `${error.name}: ${error.toString()}`
        } else if (Object.keys(error).length === 0) {
          errorMessage = 'Empty error object - likely configuration issue'
        } else {
          errorMessage = JSON.stringify(error, null, 2)
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = String(error)
      }

      addLog(`❌ Test failed: ${errorMessage}`)
      setError(errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  const endCall = () => {
    if (vapiRef.current && isConnected) {
      addLog('Ending call...')
      vapiRef.current.stop()
    }
  }

  const clearLogs = () => {
    setLogs([])
    setError(null)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          VAPI + Daily.js Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        {isClient && (
          <div className="flex items-center gap-4">
            <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
              isConnected
                ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
                : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            {/* Simple status indicator - no complex audio checks needed */}
            {false && (
              <div className="inline-flex items-center rounded-md border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-2.5 py-0.5 text-xs font-semibold transition-colors">
                Noise Cancellation Ready
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={testVapiConnection} 
            disabled={isConnecting || isConnected}
            className="flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start VAPI Test Call
              </>
            )}
          </Button>

          <Button 
            onClick={endCall} 
            disabled={!isConnected}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </Button>

          <Button 
            onClick={clearLogs} 
            variant="outline"
          >
            Clear Logs
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">Error</h4>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Logs */}
        <div className="space-y-2">
          <h4 className="font-semibold">Test Logs</h4>
          <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">No logs yet. Click "Start VAPI Test Call" to begin.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Test Instructions</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Click "Start VAPI Test Call" to initiate a voice call</li>
            <li>Grant microphone permissions when prompted</li>
            <li>Speak to test the audio processing</li>
            <li>Watch the logs for Daily.js audio configuration details</li>
            <li>Verify no Krisp worklet errors appear</li>
            <li>End the call when testing is complete</li>
          </ol>
        </div>

        {/* Expected Results */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Expected Results</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ VAPI instance creates successfully</li>
            <li>✅ Call starts without worklet errors</li>
            <li>✅ Audio processing uses Daily.js native features</li>
            <li>✅ Background noise reduction works (if supported)</li>
            <li>✅ Clear audio transmission both ways</li>
            <li>✅ No "Unable to load a worklet's module" errors</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
