'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneCall, PhoneOff, Settings, User, Clock, CheckCircle, XCircle, AlertCircle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AudioDiagnostics } from './AudioDiagnostics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createVapi } from '@/lib/vapiConfig'

interface VapiAssistant {
  id: string
  name: string
  firstMessage?: string
}

interface VapiPhoneNumber {
  id: string
  number: string
  provider: string
}

interface CallStatus {
  id: string
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  startedAt?: string
  endedAt?: string
  duration?: number
}

interface WebCallState {
  isConnected: boolean
  isMuted: boolean
  volume: number
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
  }>
}

export default function VapiDemoCall() {
  const [assistants, setAssistants] = useState<VapiAssistant[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<VapiPhoneNumber[]>([])
  const [selectedAssistant, setSelectedAssistant] = useState<string>('')
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<'web' | 'phone'>('web')
  const [isWebSdkReady, setIsWebSdkReady] = useState(false)

  // Web call state
  const [webCallState, setWebCallState] = useState<WebCallState>({
    isConnected: false,
    isMuted: false,
    volume: 0,
    messages: []
  })
  const vapiRef = useRef<any>(null)
  const [microphoneStatus, setMicrophoneStatus] = useState<string>('unknown')
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Test microphone input levels
  const testMicrophoneInput = async () => {
    console.log('🚀 testMicrophoneInput function called')
    try {
      console.log('🎤 Testing microphone input...')
      setMicrophoneStatus('testing - requesting access')

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser')
      }

      console.log('🌐 Browser support confirmed, requesting microphone access...')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      console.log('✅ Microphone stream obtained')
      setMicrophoneStatus('testing - analyzing input')

      // Store stream reference for cleanup
      mediaStreamRef.current = stream

      // Use managed AudioContext
      const audioContext = await ensureAudioContextReady()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)

      microphone.connect(analyser)
      analyser.fftSize = 256

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      let testCount = 0
      const maxTests = 50 // Test for ~1 second
      let maxLevel = 0

      const checkInput = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / bufferLength
        maxLevel = Math.max(maxLevel, average)

        console.log(`🔊 Microphone level: ${average.toFixed(2)} (max: ${maxLevel.toFixed(2)})`)

        if (average > 10) {
          setMicrophoneStatus('active - input detected')
          console.log('✅ Microphone is working - input detected!')
          // Clean up immediately when we detect input
          setTimeout(() => {
            stream.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
            // Don't close AudioContext here - keep it for VAPI
          }, 500)
          return
        } else if (testCount < maxTests) {
          testCount++
          setTimeout(checkInput, 20)
        } else {
          if (maxLevel > 0) {
            setMicrophoneStatus(`quiet - max level ${maxLevel.toFixed(1)} (try speaking louder)`)
          } else {
            setMicrophoneStatus('silent - no input detected')
          }
          console.log(`⚠️ No significant microphone input detected after 1 second (max level: ${maxLevel.toFixed(2)})`)
          // Clean up
          stream.getTracks().forEach(track => track.stop())
          mediaStreamRef.current = null
          // Keep AudioContext for VAPI usage
        }
      }

      checkInput()

      // Clean up after 2 seconds
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
        // Keep AudioContext for VAPI usage
      }, 2000)

    } catch (error: any) {
      console.error('❌ Microphone test failed:', error)
      if (error.name === 'NotAllowedError') {
        setMicrophoneStatus('error - permission denied')
      } else if (error.name === 'NotFoundError') {
        setMicrophoneStatus('error - no microphone found')
      } else {
        setMicrophoneStatus(`error - ${error.message || 'unknown error'}`)
      }
    }
  }

  // Test audio output (speakers/headphones)
  const testAudioOutput = async () => {
    console.log('🔊 Testing audio output...')
    try {
      // Use managed AudioContext
      const audioContext = await ensureAudioContextReady()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Set up a 440Hz tone (A note) at low volume
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)

      // Play for 500ms
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      console.log('✅ Audio output test tone played')
      return true
    } catch (error) {
      console.error('❌ Audio output test failed:', error)
      return false
    }
  }

  // Comprehensive audio pipeline test
  const testFullAudioPipeline = async () => {
    console.log('🧪 Testing complete audio pipeline...')

    // Test audio output first
    const outputWorking = await testAudioOutput()
    if (!outputWorking) {
      setError('Audio output test failed. Check your speakers/headphones.')
      return false
    }

    // Test microphone input
    await testMicrophoneInput()

    return true
  }

  // Test VAPI configuration without starting a call
  const testVapiConfiguration = async () => {
    console.log('🧪 Testing VAPI configuration...')
    setError('')
    setSuccess('')

    try {
      // Test 1: Environment variables
      console.log('1️⃣ Testing environment variables...')
      if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
        throw new Error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is missing')
      }
      console.log('✅ Public key found:', process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY.substring(0, 8) + '...')

      // Test 2: Public key format
      console.log('2️⃣ Testing public key format...')
      if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
        throw new Error('Public key format is invalid (should be UUID)')
      }
      console.log('✅ Public key format is valid')

      // Test 3: VAPI SDK instance
      console.log('3️⃣ Testing VAPI SDK instance...')
      if (!vapiRef.current) {
        throw new Error('VAPI SDK not initialized')
      }
      console.log('✅ VAPI SDK instance exists')

      // Test 4: VAPI SDK methods
      console.log('4️⃣ Testing VAPI SDK methods...')
      if (typeof vapiRef.current.start !== 'function') {
        throw new Error('VAPI start method missing')
      }
      if (typeof vapiRef.current.stop !== 'function') {
        throw new Error('VAPI stop method missing')
      }
      console.log('✅ VAPI SDK methods available')

      // Test 5: Selected assistant
      console.log('5️⃣ Testing selected assistant...')
      if (!selectedAssistant) {
        throw new Error('No assistant selected')
      }
      if (!selectedAssistant.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
        throw new Error('Assistant ID format is invalid (should be UUID)')
      }
      console.log('✅ Assistant ID is valid:', selectedAssistant)

      // Test 6: Browser environment
      console.log('6️⃣ Testing browser environment...')
      if (!window.isSecureContext) {
        throw new Error('Not in secure context (HTTPS required)')
      }
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API not available')
      }
      console.log('✅ Browser environment is compatible')

      setSuccess('✅ All VAPI configuration tests passed! Ready to start calls.')
      console.log('🎉 VAPI configuration test completed successfully')

    } catch (error: any) {
      const errorMsg = `VAPI Configuration Error: ${error.message}`
      setError(errorMsg)
      console.error('❌ VAPI configuration test failed:', error)
    }
  }

  // AudioContext management for proper audio pipeline
  const initializeAudioContext = async () => {
    try {
      // Clean up existing context if any
      if (audioContextRef.current) {
        await audioContextRef.current.close()
      }

      // Create new AudioContext with optimal settings
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContextClass({
        sampleRate: 16000, // VAPI prefers 16kHz
        latencyHint: 'interactive' // Low latency for real-time communication
      })

      console.log('🎵 AudioContext initialized:', {
        state: audioContextRef.current.state,
        sampleRate: audioContextRef.current.sampleRate,
        baseLatency: audioContextRef.current.baseLatency
      })

      // Resume context if suspended (required by some browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
        console.log('▶️ AudioContext resumed')
      }

      return audioContextRef.current
    } catch (error) {
      console.error('❌ Failed to initialize AudioContext:', error)
      throw error
    }
  }

  const cleanupAudioResources = async () => {
    console.log('🧹 Cleaning up audio resources...')

    try {
      // Stop media stream tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop()
          console.log(`🛑 Stopped ${track.kind} track`)
        })
        mediaStreamRef.current = null
      }

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close()
        console.log('🔇 AudioContext closed')
        audioContextRef.current = null
      }
    } catch (error) {
      console.error('⚠️ Error cleaning up audio resources:', error)
    }
  }

  const ensureAudioContextReady = async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      await initializeAudioContext()
    }

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    return audioContextRef.current
  }

  // Load assistants and phone numbers on component mount
  useEffect(() => {
    loadVapiData()
    initializeWebVapi()

    // Initialize AudioContext
    initializeAudioContext().catch(console.error)

    // Test microphone on component mount
    setTimeout(() => {
      console.log('🎤 Auto-testing microphone on component mount...')
      testMicrophoneInput()
    }, 2000)

    // Cleanup on unmount
    return () => {
      console.log('🧹 Component unmounting - cleaning up audio resources')
      cleanupAudioResources()
    }
  }, [])

  const initializeWebVapi = async () => {
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        return
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY

      if (!publicKey) {
        console.warn('VAPI public key not found')
        return
      }

      console.log('🏗️ Creating VAPI instance with public key...')
      const vapi = await createVapi(publicKey)
      console.log('✅ VAPI instance created:', !!vapi)
      console.log('🔍 VAPI instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(vapi)))

      // Test that essential methods exist
      if (typeof vapi.start !== 'function') {
        throw new Error('VAPI instance missing start method')
      }
      if (typeof vapi.stop !== 'function') {
        throw new Error('VAPI instance missing stop method')
      }
      if (typeof vapi.on !== 'function') {
        throw new Error('VAPI instance missing on method')
      }

      console.log('✅ VAPI instance validation passed')
      vapiRef.current = vapi
      setIsWebSdkReady(true)

      // Set up event listeners
      vapi.on('call-start', () => {
        console.log('✅ VAPI call started - running diagnostics...')
        setWebCallState(prev => ({ ...prev, isConnected: true }))
        setSuccess('Web call started successfully!')
        setError('')
        setMicrophoneStatus('listening - waiting for input')

        // Test full audio pipeline after call starts
        setTimeout(() => {
          console.log('🧪 Testing complete audio pipeline...')
          testFullAudioPipeline()
        }, 1000)

        // Test assistant speech after 3 seconds to verify audio output
        setTimeout(() => {
          console.log('🧪 Testing assistant speech output...')
          if (vapiRef.current) {
            vapiRef.current.say('Hello! I can hear you. The audio pipeline is working. Please speak now and I will respond.')
          }
        }, 3000)
      })

      vapi.on('call-end', () => {
        console.log('📞 VAPI call ended')
        setWebCallState(prev => ({
          ...prev,
          isConnected: false,
          isMuted: false,
          volume: 0
        }))
        setSuccess('Web call ended')
        setMicrophoneStatus('disconnected')
      })

      // Assistant speech events (critical for audio output debugging)
      vapi.on('speech-start', () => {
        console.log('🗣️ Assistant started speaking')
        setMicrophoneStatus('listening - assistant speaking')
      })

      vapi.on('speech-end', () => {
        console.log('🔇 Assistant stopped speaking')
        setMicrophoneStatus('listening - ready for input')
      })

      // Add comprehensive speech detection events
      vapi.on('user-speech-start', () => {
        console.log('🎤 User started speaking')
        setMicrophoneStatus('speaking - user input detected')
      })

      vapi.on('user-speech-end', () => {
        console.log('🔇 User stopped speaking - processing...')
        setMicrophoneStatus('processing - speech to text')
      })

      // Additional VAPI events for debugging
      vapi.on('user-interrupted', () => {
        console.log('⚠️ User interrupted assistant')
      })

      vapi.on('assistant-request', (request: any) => {
        console.log('🤖 Assistant request:', request)
      })

      vapi.on('assistant-response', (response: any) => {
        console.log('🤖 Assistant response:', response)
      })

      vapi.on('tool-calls', (toolCalls: any) => {
        console.log('🔧 Tool calls:', toolCalls)
      })

      // CRITICAL: Volume level events for audio output debugging
      vapi.on('volume-level', (volume: number) => {
        console.log(`🔊 Assistant volume level: ${volume}`)
        setWebCallState(prev => ({ ...prev, volume }))

        // If we're getting volume levels, audio output is working
        if (volume > 0) {
          console.log('✅ Audio output confirmed - receiving assistant volume levels')
        }
      })

      // Audio pipeline events (CRITICAL for debugging audio issues)
      vapi.on('audio-start', () => {
        console.log('🎵 Audio pipeline started')
      })

      vapi.on('audio-end', () => {
        console.log('🔇 Audio pipeline ended')
      })

      // Connection and transport events
      vapi.on('transport-start', () => {
        console.log('🚀 Transport layer started')
      })

      vapi.on('transport-end', () => {
        console.log('🛑 Transport layer ended')
      })

      // Media stream events
      vapi.on('media-stream-start', () => {
        console.log('📺 Media stream started')
      })

      vapi.on('media-stream-end', () => {
        console.log('📺 Media stream ended')
      })

      vapi.on('message', (message: any) => {
        console.log('📨 VAPI Message received:', message)

        if (message.type === 'transcript') {
          console.log(`📝 Transcript (${message.role}): "${message.transcript}"`)
          console.log(`📊 Transcript metadata:`, {
            role: message.role,
            transcript: message.transcript,
            transcriptType: message.transcriptType,
            isFinal: message.isFinal,
            timestamp: message.timestamp
          })

          setWebCallState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              role: message.role,
              content: message.transcript,
              timestamp: new Date(),
              isFinal: message.isFinal,
              transcriptType: message.transcriptType
            }]
          }))

          // Update microphone status based on transcript activity
          if (message.role === 'user') {
            setMicrophoneStatus(`active - "${message.transcript}" (${message.isFinal ? 'final' : 'partial'})`)
            console.log(`🎯 USER SPEECH TRANSCRIBED: "${message.transcript}" (${message.isFinal ? 'FINAL' : 'PARTIAL'})`)
          }
        } else if (message.type === 'function-call') {
          console.log('🔧 Function call:', message)
        } else if (message.type === 'hang') {
          console.log('📞 Call ended by assistant')
        } else if (message.type === 'conversation-update') {
          console.log('💬 Conversation update:', message)
        } else {
          console.log(`📋 Other message type (${message.type}):`, message)
        }
      })

      vapi.on('error', (error: any) => {
        console.error('❌ VAPI Web Error:', error)
        console.error('❌ Error type:', typeof error)
        console.error('❌ Error keys:', error ? Object.keys(error) : 'null/undefined')
        console.error('❌ Error stringified:', JSON.stringify(error, null, 2))

        let errorMessage = 'Unknown error occurred'

        if (error && typeof error === 'object') {
          // Handle VAPI-specific error structure
          if (error.error && error.error.error && error.error.error.message) {
            // Extract the actual error message from VAPI error structure
            const messages = error.error.error.message
            if (Array.isArray(messages)) {
              errorMessage = `VAPI API Error: ${messages.join(', ')}`
            } else {
              errorMessage = `VAPI API Error: ${messages}`
            }
          } else if (error.message) {
            errorMessage = error.message
          } else if (error.type) {
            errorMessage = `Error type: ${error.type}`
          } else if (error.code) {
            errorMessage = `Error code: ${error.code}`
          } else if (error.name) {
            errorMessage = `Error name: ${error.name}`
          } else if (Object.keys(error).length === 0) {
            errorMessage = 'Empty error object - likely a configuration issue. Check: 1) VAPI public key is valid, 2) Assistant ID exists, 3) Browser permissions, 4) Network connectivity'
          } else {
            errorMessage = `Error details: ${JSON.stringify(error)}`
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        } else if (error === null || error === undefined) {
          errorMessage = 'Null/undefined error - likely a VAPI SDK initialization issue'
        }

        // Provide specific guidance for common audio errors
        if (errorMessage.includes('microphone') || errorMessage.includes('audio input')) {
          errorMessage += '\n🎤 Try: Check microphone permissions, test microphone first'
        } else if (errorMessage.includes('speaker') || errorMessage.includes('audio output')) {
          errorMessage += '\n🔊 Try: Check speaker/headphone connection, test speakers first'
        } else if (errorMessage.includes('worklet') || errorMessage.includes('audio context')) {
          errorMessage += '\n🔧 Try: Audio worklets disabled - this should work in compatibility mode'
        } else if (errorMessage.includes('transport') || errorMessage.includes('connection')) {
          errorMessage += '\n🌐 Try: Check internet connection, try refreshing the page'
        } else if (errorMessage.includes('permission')) {
          errorMessage += '\n🔐 Try: Allow microphone permissions in browser settings'
        }

        setError(`Web call error: ${errorMessage}`)
        setWebCallState(prev => ({ ...prev, isConnected: false }))
        setMicrophoneStatus('error - call failed')
        setIsLoading(false)
      })

      // Additional critical VAPI events for comprehensive debugging
      vapi.on('conversation-update', (update: any) => {
        console.log('💬 Conversation update:', update)

        // Track conversation state for audio debugging
        if (update.conversation) {
          console.log('📝 Conversation messages:', update.conversation.messages?.length || 0)
        }
      })

      vapi.on('function-call', (functionCall: any) => {
        console.log('🔧 Function call:', functionCall)
      })

      // Connection state events
      vapi.on('connection-update', (update: any) => {
        console.log('🔗 Connection update:', update)
      })

      // Audio quality events (if supported)
      vapi.on('audio-quality', (quality: any) => {
        console.log('📊 Audio quality:', quality)
      })

      // Latency monitoring (if supported)
      vapi.on('latency-update', (latency: any) => {
        console.log('⏱️ Latency update:', latency)
      })

    } catch (error) {
      console.error('Failed to initialize VAPI Web SDK:', error)
      setError('Failed to initialize web calling. Please check your configuration.')
    }
  }

  const loadVapiData = async () => {
    setIsLoadingData(true)
    try {
      // Load assistants
      console.log('📋 Loading VAPI assistants...')
      const assistantsResponse = await fetch('/api/vapi/assistants')
      if (assistantsResponse.ok) {
        const assistantsData = await assistantsResponse.json()
        console.log('✅ Assistants loaded:', assistantsData.assistants)
        setAssistants(assistantsData.assistants || [])

        // Auto-select first assistant if none selected
        if (assistantsData.assistants && assistantsData.assistants.length > 0 && !selectedAssistant) {
          const firstAssistant = assistantsData.assistants[0]
          setSelectedAssistant(firstAssistant.id)
          console.log('🎯 Auto-selected assistant:', firstAssistant.name, firstAssistant.id)
        }
      } else {
        console.error('❌ Failed to load assistants:', assistantsResponse.status)
      }

      // Load phone numbers
      const phoneNumbersResponse = await fetch('/api/vapi/phone-numbers')
      if (phoneNumbersResponse.ok) {
        const phoneNumbersData = await phoneNumbersResponse.json()
        setPhoneNumbers(phoneNumbersData.phoneNumbers || [])
      }
    } catch (error) {
      console.error('Error loading VAPI data:', error)
      setError('Failed to load VAPI configuration. Please check your API keys.')
    } finally {
      setIsLoadingData(false)
    }
  }

  const startWebCall = async () => {
    if (!selectedAssistant) {
      setError('Please select an assistant')
      return
    }

    // Validate assistant exists in loaded assistants
    const assistantExists = assistants.find(a => a.id === selectedAssistant)
    if (!assistantExists) {
      setError(`Assistant not found: ${selectedAssistant}. Available assistants: ${assistants.map(a => a.name).join(', ')}`)
      return
    }

    console.log('✅ Using valid assistant:', assistantExists.name, assistantExists.id)

    if (!vapiRef.current) {
      setError('VAPI Web SDK not initialized. Please refresh the page and try again.')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Check microphone permissions first - but DON'T stop the stream
      console.log('🎤 Requesting microphone permissions...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Ensure 16kHz sample rate for VAPI
        }
      })

      console.log('✅ Microphone permission granted, stream active:', stream.active)
      console.log('🎤 Audio tracks:', stream.getAudioTracks().map(track => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })))

      // Keep the stream active for VAPI to use
      // DO NOT stop the tracks here - VAPI needs them!

      // Clear previous messages
      setWebCallState(prev => ({ ...prev, messages: [] }))

      // Test VAPI configuration before starting call
      console.log('Testing VAPI configuration...')
      try {
        const testResponse = await fetch('/api/vapi/test-web-sdk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assistantId: selectedAssistant,
            publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
          })
        })

        if (testResponse.ok) {
          const testResult = await testResponse.json()
          console.log('VAPI configuration test:', testResult)

          if (!testResult.success || testResult.recommendations.length > 0) {
            const issues = testResult.recommendations.join(' ')
            console.warn('Configuration issues found:', issues)
            // Don't throw error, just warn - continue with call attempt
          }
        } else {
          console.warn('VAPI configuration test endpoint failed, continuing anyway...')
        }
      } catch (configError) {
        console.warn('VAPI configuration test failed, continuing anyway:', configError)
        // Don't let configuration test failure prevent the call attempt
      }

      // Debug information
      console.log('Starting web call with assistant:', selectedAssistant)
      console.log('VAPI instance ready:', !!vapiRef.current)
      console.log('VAPI instance type:', typeof vapiRef.current)
      console.log('VAPI instance methods:', vapiRef.current ? Object.getOwnPropertyNames(Object.getPrototypeOf(vapiRef.current)) : 'none')
      console.log('Public key configured:', !!(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY))
      console.log('Public key length:', process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.length || 0)
      console.log('Public key format:', process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/) ? 'valid UUID' : 'invalid format')
      console.log('Browser environment:', {
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent.substring(0, 100)
      })

      // Additional validation before starting call
      if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
        throw new Error('VAPI public key is missing. Check NEXT_PUBLIC_VAPI_PUBLIC_KEY environment variable.')
      }

      if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
        throw new Error('VAPI public key format is invalid. Should be a UUID format.')
      }

      if (!selectedAssistant.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
        throw new Error('Assistant ID format is invalid. Should be a UUID format.')
      }

      if (!vapiRef.current || typeof vapiRef.current.start !== 'function') {
        throw new Error('VAPI Web SDK is not properly initialized. Missing start method.')
      }

      // Start the web call with optimized audio configuration
      console.log('🚀 Starting call with assistant ID:', selectedAssistant)

      // Assistant overrides with Krisp disabled to prevent audio worklet errors
      const assistantOverrides = {
        // Basic configuration
        recordingEnabled: false,
        backgroundSound: 'off',

        // Transcriber configuration for microphone input
        transcriber: {
          provider: 'deepgram',
          language: 'en'
        },

        // Voice configuration with required properties
        voice: {
          provider: 'playht',
          voiceId: 'jennifer', // Required: PlayHT voice ID
          speed: 1.0
        },

        // Audio pipeline timing settings for better responsiveness
        startSpeakingPlan: {
          waitSeconds: 0.2, // Reduced for faster response
          smartEndpointingEnabled: true
        },

        stopSpeakingPlan: {
          numWords: 0,
          voiceSeconds: 0.1, // Faster interruption
          backoffSeconds: 0.5
        },

        // VAPI handles audio processing automatically - no manual configuration needed
      }

      console.log('📞 Assistant overrides:', assistantOverrides)
      console.log('🎯 Starting VAPI call with microphone access confirmed...')

      // Test VAPI SDK before starting call
      console.log('🧪 Testing VAPI SDK readiness...')
      if (!vapiRef.current) {
        throw new Error('VAPI instance is null')
      }

      if (typeof vapiRef.current.start !== 'function') {
        throw new Error('VAPI start method is not available')
      }

      console.log('✅ VAPI SDK validation passed, starting call...')

      // Final microphone test before starting call
      console.log('🎤 Final microphone test before VAPI call...')
      const finalStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('🎤 Final microphone test successful:', {
        active: finalStream.active,
        tracks: finalStream.getAudioTracks().length,
        trackStates: finalStream.getAudioTracks().map(t => t.readyState)
      })

      await vapiRef.current.start(selectedAssistant, assistantOverrides)

      console.log('Web call started successfully')

    } catch (error: any) {
      console.error('Error starting web call:', error)

      let errorMessage = 'Failed to start web call'
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone access denied. Please allow microphone access and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const stopWebCall = () => {
    if (vapiRef.current && webCallState.isConnected) {
      vapiRef.current.stop()
    }
  }

  const toggleMute = () => {
    if (vapiRef.current) {
      const newMutedState = !webCallState.isMuted
      vapiRef.current.setMuted(newMutedState)
      setWebCallState(prev => ({ ...prev, isMuted: newMutedState }))
    }
  }

  const sendMessage = (message: string) => {
    if (vapiRef.current && webCallState.isConnected) {
      vapiRef.current.send({
        type: 'add-message',
        message: {
          role: 'system',
          content: message,
        },
      })
    }
  }

  const createDemoCall = async () => {
    if (!selectedAssistant || !customerPhone) {
      setError('Please select an assistant and enter a customer phone number')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/vapi/create-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: selectedAssistant,
          phoneNumberId: selectedPhoneNumber || undefined,
          customerNumber: customerPhone,
          customerName: customerName || 'Demo Contact',
          metadata: {
            source: 'zyxai-demo',
            timestamp: new Date().toISOString()
          }
        }),
      })

      const data = await response.json()

      if (response.ok && data.call) {
        setSuccess(`Call created successfully! Call ID: ${data.call.id}`)
        setCallStatus({
          id: data.call.id,
          status: data.call.status || 'queued',
          startedAt: data.call.startedAt
        })
        
        // Start polling for call status updates
        pollCallStatus(data.call.id)
      } else {
        setError(data.error || 'Failed to create call')
      }
    } catch (error) {
      console.error('Error creating call:', error)
      setError('Failed to create call. Please check your configuration.')
    } finally {
      setIsLoading(false)
    }
  }

  const pollCallStatus = async (callId: string) => {
    try {
      const response = await fetch(`/api/vapi/calls/${callId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.call) {
          setCallStatus({
            id: data.call.id,
            status: data.call.status,
            startedAt: data.call.startedAt,
            endedAt: data.call.endedAt,
            duration: data.call.duration
          })

          // Continue polling if call is still active
          if (['queued', 'ringing', 'in-progress', 'forwarding'].includes(data.call.status)) {
            setTimeout(() => pollCallStatus(callId), 2000)
          }
        }
      }
    } catch (error) {
      console.error('Error polling call status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-100 text-yellow-800'
      case 'ringing': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-green-100 text-green-800'
      case 'forwarding': return 'bg-purple-100 text-purple-800'
      case 'ended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="h-4 w-4" />
      case 'ringing': return <Phone className="h-4 w-4" />
      case 'in-progress': return <PhoneCall className="h-4 w-4" />
      case 'forwarding': return <PhoneCall className="h-4 w-4" />
      case 'ended': return <PhoneOff className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoadingData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            VAPI Demo Call
          </CardTitle>
          <CardDescription>Loading VAPI configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          VAPI Demo Call
        </CardTitle>
        <CardDescription>
          Test your VAPI integration with web calls or phone calls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'web' | 'phone')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Web Call (Demo)
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Call (Real)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="web" className="space-y-6">
            {/* Web Call Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="web-assistant">Select Assistant</Label>
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an assistant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assistants.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No assistants found. Create one in your VAPI dashboard first.
                  </p>
                )}

                {/* Web SDK Status */}
                <div className="flex items-center gap-2 text-sm">
                  {isWebSdkReady ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-700">Web SDK Ready</span>
                    </>
                  ) : (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-blue-700">Initializing Web SDK...</span>
                    </>
                  )}
                </div>
              </div>

              {/* Web Call Status */}
              {webCallState.isConnected && (
                <Alert className="border-green-200 bg-green-50">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <div className="flex items-center gap-2">
                        <span className="text-green-800">Web call active</span>
                        <Badge className="bg-green-100 text-green-800">
                          CONNECTED
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Volume:</span>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all duration-100"
                              style={{ width: `${Math.min(webCallState.volume * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          <span className="text-sm">Mic: {microphoneStatus}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleMute}
                          className="flex items-center gap-1"
                        >
                          {webCallState.isMuted ? (
                            <>
                              <MicOff className="h-3 w-3" />
                              Unmute
                            </>
                          ) : (
                            <>
                              <Mic className="h-3 w-3" />
                              Mute
                            </>
                          )}
                        </Button>
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Real-time Speech Debug Panel */}
              {webCallState.isConnected && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-yellow-800">🔍 Speech Detection Debug</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Microphone Status:</span>
                        <span className="font-mono text-xs">{microphoneStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Call Connected:</span>
                        <span className={webCallState.isConnected ? 'text-green-600' : 'text-red-600'}>
                          {webCallState.isConnected ? '✅ Yes' : '❌ No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume Level:</span>
                        <span className="font-mono text-xs">{webCallState.volume.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-yellow-700 mt-2">
                        💡 Speak now and watch for transcript events in console and conversation panel below
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conversation Messages */}
              {webCallState.messages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Conversation & Transcripts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {webCallState.messages.map((message, index) => (
                        <div key={index} className={`p-2 rounded text-sm ${
                          message.role === 'assistant'
                            ? 'bg-blue-50 text-blue-900'
                            : 'bg-gray-50 text-gray-900'
                        }`}>
                          <div className="font-medium capitalize flex items-center gap-2">
                            {message.role}:
                            {message.role === 'user' && (
                              <span className={`text-xs px-1 py-0.5 rounded ${
                                message.isFinal ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {message.isFinal ? 'final' : 'partial'}
                              </span>
                            )}
                          </div>
                          <div>{message.content}</div>
                          <div className="text-xs opacity-60 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                            {message.transcriptType && (
                              <span className="ml-2">• {message.transcriptType}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Microphone Test */}
              {!webCallState.isConnected && (
                <div className="space-y-2 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={testMicrophoneInput}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Test Microphone
                    </Button>
                    <Button
                      onClick={testAudioOutput}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      🔊 Test Speakers
                    </Button>
                    <Button
                      onClick={testFullAudioPipeline}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      🧪 Test Pipeline
                    </Button>
                    <Button
                      onClick={testVapiConfiguration}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      ⚙️ Test VAPI Config
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Status: {microphoneStatus}
                  </div>
                  {microphoneStatus.includes('error') && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      ⚠️ Microphone access required for voice calls. Please allow microphone permissions in your browser.
                    </div>
                  )}
                  {microphoneStatus.includes('silent') && (
                    <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                      🔇 No microphone input detected. Try speaking or check your microphone settings.
                    </div>
                  )}
                  {microphoneStatus.includes('active') && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      ✅ Microphone is working! You can start a voice call.
                    </div>
                  )}

                  {/* Comprehensive Audio Diagnostics */}
                  <div className="mt-4">
                    <AudioDiagnostics />
                  </div>
                </div>
              )}

              {/* Web Call Controls */}
              <div className="flex gap-2">
                {!webCallState.isConnected ? (
                  <Button
                    onClick={startWebCall}
                    disabled={isLoading || !selectedAssistant || !isWebSdkReady}
                    className="flex-1"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Starting...
                      </>
                    ) : !isWebSdkReady ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Initializing Web SDK...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Start Web Call
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={stopWebCall}
                    variant="destructive"
                    className="flex-1"
                    size="lg"
                  >
                    <VolumeX className="h-4 w-4 mr-2" />
                    End Call
                  </Button>
                )}
              </div>

              {/* Quick Actions */}
              {webCallState.isConnected && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage('The user clicked a button')}
                  >
                    Send Test Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => vapiRef.current?.say('This is a test message from the system')}
                  >
                    Make Assistant Speak
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="phone" className="space-y-6">
        {/* Phone Call Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assistant">Select Assistant</Label>
            <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an assistant..." />
              </SelectTrigger>
              <SelectContent>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assistants.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No assistants found. Create one in your VAPI dashboard first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">VAPI Phone Number (Optional)</Label>
            <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber}>
              <SelectTrigger>
                <SelectValue placeholder="Use default or select a number..." />
              </SelectTrigger>
              <SelectContent>
                {phoneNumbers.map((phone) => (
                  <SelectItem key={phone.id} value={phone.id}>
                    {phone.number} ({phone.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {phoneNumbers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No phone numbers configured. Add one in your VAPI dashboard.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone Number</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="+1234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
              <Input
                id="customerName"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Call Status */}
        {callStatus && (
          <Alert>
            <div className="flex items-center gap-2">
              {getStatusIcon(callStatus.status)}
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <span>Call Status:</span>
                  <Badge className={getStatusColor(callStatus.status)}>
                    {callStatus.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-2 text-sm">
                  <p>Call ID: {callStatus.id}</p>
                  {callStatus.startedAt && (
                    <p>Started: {new Date(callStatus.startedAt).toLocaleString()}</p>
                  )}
                  {callStatus.endedAt && (
                    <p>Ended: {new Date(callStatus.endedAt).toLocaleString()}</p>
                  )}
                  {callStatus.duration && (
                    <p>Duration: {Math.round(callStatus.duration)} seconds</p>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <div className="mt-2 text-sm">
                <strong>Troubleshooting tips:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Ensure microphone access is allowed in your browser</li>
                  <li>Check that you're using HTTPS (required for microphone access)</li>
                  <li>Verify your VAPI assistant is properly configured</li>
                  <li>Try refreshing the page and trying again</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button
          onClick={createDemoCall}
          disabled={isLoading || !selectedAssistant || !customerPhone}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Call...
            </>
          ) : (
            <>
              <PhoneCall className="h-4 w-4 mr-2" />
              Place Demo Call
            </>
          )}
        </Button>

          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Instructions:</p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-600 mb-1">Web Call (Demo):</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Select an assistant</li>
                    <li>Click "Start Web Call"</li>
                    <li>Speak into your microphone</li>
                    <li>Watch the conversation in real-time</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-1">
                    Free testing - no credits used
                  </p>
                </div>
                <div>
                  <p className="font-medium text-green-600 mb-1">Phone Call (Real):</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Select an assistant</li>
                    <li>Enter a phone number</li>
                    <li>Click "Place Demo Call"</li>
                    <li>Monitor call status</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uses VAPI credits for real calls
                  </p>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
