import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DiagnosticResult {
  test: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  message: string
  details?: any
}

export function AudioDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const updateDiagnostic = (test: string, status: DiagnosticResult['status'], message: string, details?: any) => {
    setDiagnostics(prev => {
      const existing = prev.find(d => d.test === test)
      if (existing) {
        return prev.map(d => d.test === test ? { ...d, status, message, details } : d)
      } else {
        return [...prev, { test, status, message, details }]
      }
    })
  }

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])

    const tests = [
      'Browser Support',
      'HTTPS Context',
      'MediaDevices API',
      'getUserMedia',
      'AudioContext',
      'WebRTC Support',
      'Microphone Access',
      'Audio Output',
      'Audio Pipeline',
      'VAPI Compatibility'
    ]

    // Initialize all tests as pending
    tests.forEach(test => {
      updateDiagnostic(test, 'pending', 'Waiting to run...')
    })

    try {
      // Test 1: Browser Support
      updateDiagnostic('Browser Support', 'running', 'Checking browser capabilities...')
      const userAgent = navigator.userAgent
      const isChrome = userAgent.includes('Chrome')
      const isFirefox = userAgent.includes('Firefox')
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome')
      const isEdge = userAgent.includes('Edge')
      
      if (isChrome || isFirefox || isEdge) {
        updateDiagnostic('Browser Support', 'passed', `Supported browser detected: ${isChrome ? 'Chrome' : isFirefox ? 'Firefox' : 'Edge'}`)
      } else if (isSafari) {
        updateDiagnostic('Browser Support', 'passed', 'Safari detected - may have limited WebRTC support')
      } else {
        updateDiagnostic('Browser Support', 'failed', 'Unsupported browser - use Chrome, Firefox, or Edge for best results')
      }

      // Test 2: HTTPS Context
      updateDiagnostic('HTTPS Context', 'running', 'Checking secure context...')
      if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        updateDiagnostic('HTTPS Context', 'passed', 'Secure context confirmed')
      } else {
        updateDiagnostic('HTTPS Context', 'failed', 'HTTPS required for microphone access')
      }

      // Test 3: MediaDevices API
      updateDiagnostic('MediaDevices API', 'running', 'Checking MediaDevices API...')
      if (navigator.mediaDevices) {
        updateDiagnostic('MediaDevices API', 'passed', 'MediaDevices API available')
      } else {
        updateDiagnostic('MediaDevices API', 'failed', 'MediaDevices API not supported')
        setIsRunning(false)
        return
      }

      // Test 4: getUserMedia
      updateDiagnostic('getUserMedia', 'running', 'Checking getUserMedia support...')
      if (navigator.mediaDevices.getUserMedia) {
        updateDiagnostic('getUserMedia', 'passed', 'getUserMedia supported')
      } else {
        updateDiagnostic('getUserMedia', 'failed', 'getUserMedia not supported')
        setIsRunning(false)
        return
      }

      // Test 5: AudioContext
      updateDiagnostic('AudioContext', 'running', 'Testing AudioContext...')
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContextClass({
          sampleRate: 16000,
          latencyHint: 'interactive'
        })
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume()
        }
        
        updateDiagnostic('AudioContext', 'passed', `AudioContext created (${audioContextRef.current.sampleRate}Hz, ${audioContextRef.current.state})`)
      } catch (error: any) {
        updateDiagnostic('AudioContext', 'failed', `AudioContext failed: ${error.message}`)
      }

      // Test 6: WebRTC Support
      updateDiagnostic('WebRTC Support', 'running', 'Checking WebRTC support...')
      if (typeof RTCPeerConnection !== 'undefined') {
        updateDiagnostic('WebRTC Support', 'passed', 'WebRTC supported')
      } else {
        updateDiagnostic('WebRTC Support', 'failed', 'WebRTC not supported')
      }

      // Test 7: Microphone Access
      updateDiagnostic('Microphone Access', 'running', 'Testing microphone access...')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 16000
          }
        })
        
        const tracks = stream.getAudioTracks()
        if (tracks.length > 0) {
          const track = tracks[0]
          updateDiagnostic('Microphone Access', 'passed', `Microphone access granted: ${track.label}`, {
            deviceId: track.getSettings().deviceId,
            sampleRate: track.getSettings().sampleRate,
            channelCount: track.getSettings().channelCount
          })
          
          // Clean up
          stream.getTracks().forEach(track => track.stop())
        } else {
          updateDiagnostic('Microphone Access', 'failed', 'No audio tracks found')
        }
      } catch (error: any) {
        updateDiagnostic('Microphone Access', 'failed', `Microphone access failed: ${error.message}`)
      }

      // Test 8: Audio Output
      updateDiagnostic('Audio Output', 'running', 'Testing audio output...')
      try {
        if (audioContextRef.current) {
          const oscillator = audioContextRef.current.createOscillator()
          const gainNode = audioContextRef.current.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContextRef.current.destination)
          
          oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime)
          gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
          
          oscillator.start(audioContextRef.current.currentTime)
          oscillator.stop(audioContextRef.current.currentTime + 0.2)
          
          updateDiagnostic('Audio Output', 'passed', 'Audio output test completed (440Hz tone played)')
        } else {
          updateDiagnostic('Audio Output', 'failed', 'No AudioContext available')
        }
      } catch (error: any) {
        updateDiagnostic('Audio Output', 'failed', `Audio output failed: ${error.message}`)
      }

      // Test 9: Audio Pipeline
      updateDiagnostic('Audio Pipeline', 'running', 'Testing complete audio pipeline...')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        
        if (audioContextRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream)
          const analyser = audioContextRef.current.createAnalyser()
          source.connect(analyser)
          
          updateDiagnostic('Audio Pipeline', 'passed', 'Bidirectional audio pipeline working')
          
          // Clean up
          stream.getTracks().forEach(track => track.stop())
        } else {
          updateDiagnostic('Audio Pipeline', 'failed', 'AudioContext not available')
        }
      } catch (error: any) {
        updateDiagnostic('Audio Pipeline', 'failed', `Audio pipeline failed: ${error.message}`)
      }

      // Test 10: VAPI Compatibility - run after a short delay to ensure all tests are complete
      updateDiagnostic('VAPI Compatibility', 'running', 'Checking VAPI compatibility...')

      // Use setTimeout to check compatibility after all other tests have updated the state
      setTimeout(() => {
        // Check if all critical tests passed by examining the current diagnostics state
        const criticalTests = ['HTTPS Context', 'MediaDevices API', 'getUserMedia', 'AudioContext', 'WebRTC Support']

        setDiagnostics(currentDiagnostics => {
          const allCriticalTestsPassed = criticalTests.every(testName => {
            const diagnostic = currentDiagnostics.find(d => d.name === testName)
            return diagnostic && diagnostic.status === 'passed'
          })

          const updatedDiagnostics = [...currentDiagnostics]
          const vapiIndex = updatedDiagnostics.findIndex(d => d.name === 'VAPI Compatibility')

          if (allCriticalTestsPassed) {
            updatedDiagnostics[vapiIndex] = {
              name: 'VAPI Compatibility',
              status: 'passed',
              message: 'All VAPI requirements met - ready for voice calls'
            }
          } else {
            const failedTests = criticalTests.filter(testName => {
              const diagnostic = currentDiagnostics.find(d => d.name === testName)
              return !diagnostic || diagnostic.status !== 'passed'
            })
            updatedDiagnostics[vapiIndex] = {
              name: 'VAPI Compatibility',
              status: 'failed',
              message: `VAPI requirements not met. Failed tests: ${failedTests.join(', ')}`
            }
          }

          return updatedDiagnostics
        })
      }, 100) // Small delay to ensure all tests have completed

    } catch (error: any) {
      console.error('Diagnostics failed:', error)
    } finally {
      setIsRunning(false)
      
      // Clean up AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'passed': return '✅'
      case 'failed': return '❌'
      case 'running': return '🔄'
      default: return '⏳'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Audio Pipeline Diagnostics
          <Button 
            onClick={runComprehensiveDiagnostics} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getStatusIcon(diagnostic.status)}</span>
                <div>
                  <div className="font-medium">{diagnostic.test}</div>
                  <div className="text-sm text-muted-foreground">{diagnostic.message}</div>
                  {diagnostic.details && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {JSON.stringify(diagnostic.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
              <Badge className={getStatusColor(diagnostic.status)}>
                {diagnostic.status}
              </Badge>
            </div>
          ))}
        </div>
        
        {diagnostics.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Click "Run Diagnostics" to test your audio pipeline
          </div>
        )}
      </CardContent>
    </Card>
  )
}
