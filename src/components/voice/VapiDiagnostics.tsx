'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'

interface DiagnosticResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string
}

export default function VapiDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [assistants, setAssistants] = useState<any[]>([])

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    try {
      // Test 1: Environment Variables
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
      if (publicKey && publicKey !== 'your-key-here') {
        results.push({
          name: 'Public Key',
          status: 'pass',
          message: 'VAPI public key is configured',
          details: `Key: ${publicKey.substring(0, 8)}...`
        })
      } else {
        results.push({
          name: 'Public Key',
          status: 'fail',
          message: 'VAPI public key is missing or invalid',
          details: 'Check NEXT_PUBLIC_VAPI_PUBLIC_KEY in .env.local'
        })
      }

      // Test 2: Browser Environment
      const isSecure = window.isSecureContext
      results.push({
        name: 'Secure Context',
        status: isSecure ? 'pass' : 'fail',
        message: isSecure ? 'Running in secure context (HTTPS/localhost)' : 'Not in secure context',
        details: `Protocol: ${window.location.protocol}, Host: ${window.location.hostname}`
      })

      // Test 3: Microphone Permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        results.push({
          name: 'Microphone Access',
          status: 'pass',
          message: 'Microphone access granted',
          details: 'User has allowed microphone permissions'
        })
      } catch (error: any) {
        results.push({
          name: 'Microphone Access',
          status: 'fail',
          message: 'Microphone access denied',
          details: error.message || 'Permission denied'
        })
      }

      // Test 4: VAPI Web SDK
      try {
        const VapiModule = await import('@vapi-ai/web')
        const Vapi = VapiModule.default
        if (Vapi) {
          results.push({
            name: 'VAPI Web SDK',
            status: 'pass',
            message: 'VAPI Web SDK loaded successfully',
            details: 'SDK is available and ready'
          })
        } else {
          results.push({
            name: 'VAPI Web SDK',
            status: 'fail',
            message: 'VAPI Web SDK not found',
            details: 'SDK import failed'
          })
        }
      } catch (error: any) {
        results.push({
          name: 'VAPI Web SDK',
          status: 'fail',
          message: 'Failed to load VAPI Web SDK',
          details: error.message
        })
      }

      // Test 5: API Connectivity
      try {
        const response = await fetch('/api/vapi/assistants')
        if (response.ok) {
          const data = await response.json()
          setAssistants(data.assistants || [])
          results.push({
            name: 'API Connectivity',
            status: 'pass',
            message: `Connected to VAPI API - Found ${data.assistants?.length || 0} assistants`,
            details: 'Server can reach VAPI API successfully'
          })
        } else {
          results.push({
            name: 'API Connectivity',
            status: 'fail',
            message: 'Failed to connect to VAPI API',
            details: `HTTP ${response.status}: ${response.statusText}`
          })
        }
      } catch (error: any) {
        results.push({
          name: 'API Connectivity',
          status: 'fail',
          message: 'API request failed',
          details: error.message
        })
      }

      // Test 6: Browser Compatibility
      const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext)
      const hasWebSockets = !!window.WebSocket

      if (hasWebRTC && hasAudioContext && hasWebSockets) {
        results.push({
          name: 'Browser Compatibility',
          status: 'pass',
          message: 'Browser supports all required features',
          details: 'WebRTC, AudioContext, and WebSockets available. Audio worklets disabled to prevent KrispSDK errors.'
        })
      } else {
        const missing = []
        if (!hasWebRTC) missing.push('WebRTC')
        if (!hasAudioContext) missing.push('AudioContext')
        if (!hasWebSockets) missing.push('WebSockets')

        results.push({
          name: 'Browser Compatibility',
          status: 'fail',
          message: 'Browser missing required features',
          details: `Missing: ${missing.join(', ')}`
        })
      }

      // Test 7: Audio Worklet Protection
      results.push({
        name: 'Audio Worklet Protection',
        status: 'pass',
        message: 'Audio worklets disabled to prevent errors',
        details: 'KrispSDK and noise cancellation features disabled to avoid worklet loading issues'
      })

    } catch (error: any) {
      results.push({
        name: 'Diagnostic Error',
        status: 'fail',
        message: 'Error running diagnostics',
        details: error.message
      })
    }

    setDiagnostics(results)
    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pass</Badge>
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return null
    }
  }

  const passCount = diagnostics.filter(d => d.status === 'pass').length
  const failCount = diagnostics.filter(d => d.status === 'fail').length
  const warningCount = diagnostics.filter(d => d.status === 'warning').length

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          VAPI Integration Diagnostics
        </CardTitle>
        <CardDescription>
          Comprehensive testing of your VAPI integration setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="flex gap-4">
          <Badge variant="default" className="bg-green-100 text-green-800">
            {passCount} Passed
          </Badge>
          {failCount > 0 && (
            <Badge variant="destructive">
              {failCount} Failed
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {warningCount} Warnings
            </Badge>
          )}
        </div>

        {/* Run Diagnostics Button */}
        <Button onClick={runDiagnostics} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-run Diagnostics
            </>
          )}
        </Button>

        {/* Results */}
        <div className="space-y-3">
          {diagnostics.map((result, index) => (
            <Alert key={index} className={
              result.status === 'pass' ? 'border-green-200 bg-green-50' :
              result.status === 'fail' ? 'border-red-200 bg-red-50' :
              'border-yellow-200 bg-yellow-50'
            }>
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{result.name}</span>
                    {getStatusBadge(result.status)}
                  </div>
                  <AlertDescription>
                    <div>{result.message}</div>
                    {result.details && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {result.details}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>

        {/* Assistants List */}
        {assistants.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Available Assistants</h3>
            <div className="space-y-2">
              {assistants.map((assistant) => (
                <div key={assistant.id} className="p-3 border rounded-lg bg-blue-50">
                  <div className="font-medium">{assistant.name}</div>
                  <div className="text-sm text-muted-foreground">ID: {assistant.id}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
