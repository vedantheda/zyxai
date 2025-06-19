'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

// Import Vapi Web SDK
import Vapi from '@vapi-ai/web'
import { checkBrowserCompatibility } from '@/lib/vapiConfig'

interface VoiceWidgetProps {
  assistantId: string
  publicKey?: string
  voiceId?: string // Agent's configured voice ID (e.g., 'female_professional')
  agentName?: string // Agent's name for personalized responses
  agentGreeting?: string // Agent's configured greeting
  onCallStart?: () => void
  onCallEnd?: () => void
  onMessage?: (message: any) => void
  className?: string
  variant?: 'button' | 'card' | 'floating'
  size?: 'sm' | 'md' | 'lg'
}

export function VoiceWidget({
  assistantId,
  publicKey,
  voiceId,
  agentName,
  agentGreeting,
  onCallStart,
  onCallEnd,
  onMessage,
  className,
  variant = 'button',
  size = 'md'
}: VoiceWidgetProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [hasPermissions, setHasPermissions] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)

  const vapiRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)

  // Initialize browser voice capabilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech synthesis
      speechSynthesisRef.current = window.speechSynthesis

      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          const last = event.results.length - 1
          const text = event.results[last][0].transcript

          if (event.results[last].isFinal) {
            setTranscript(prev => [...prev, { role: 'user', text }])
            // Respond to user input
            setTimeout(() => {
              respondToUser(text)
            }, 500)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  // Initialize Vapi (only if we have a valid key)
  useEffect(() => {
    if (typeof window !== 'undefined' && !vapiRef.current) {
      const apiKey = publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
      console.log('🎤 Checking Vapi configuration...')

      // Check browser compatibility first
      const compatibility = checkBrowserCompatibility()
      console.log('🔧 Browser compatibility:', compatibility)

      if (!compatibility.compatible) {
        console.error('❌ Browser not compatible:', compatibility.issues)
        setError(`Browser compatibility issues: ${compatibility.issues.join(', ')}`)
        return
      }

      if (compatibility.warnings.length > 0) {
        console.warn('⚠️ Browser warnings:', compatibility.warnings)
      }

      console.log('🔧 Environment:', {
        hasPublicKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol
      })

      // Only initialize if we have a key and it looks valid
      if (!apiKey || apiKey.length < 30) {
        console.log('⚠️ Vapi public key not configured or invalid, using demo mode only')
        return
      }

      // Check for HTTPS in production (required for microphone access)
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        console.warn('⚠️ HTTPS required for microphone access in production')
        setError('HTTPS required for voice features. Please use a secure connection.')
        return
      }

      try {
        vapiRef.current = new Vapi(apiKey)
        console.log('✅ Vapi initialized with key:', `${apiKey.substring(0, 8)}...`)
        console.log('🔧 Vapi instance created:', !!vapiRef.current)

        // Try to disable problematic features if the API supports it
        try {
          // Disable Krisp noise cancellation to avoid worklet errors
          if (vapiRef.current.setConfig) {
            vapiRef.current.setConfig({
              enableKrisp: false,
              enableNoiseCancellation: false,
              enableBackgroundBlur: false
            })
            console.log('🔧 Disabled problematic audio features')
          }
        } catch (configError) {
          console.log('ℹ️ Could not configure advanced settings, using defaults')
        }

        // Set up event listeners with proper error handling
        vapiRef.current.on('call-start', () => {
          console.log('📞 Vapi call started')
          setIsCallActive(true)
          setIsConnecting(false)
          setError(null)
          onCallStart?.()
        })

        vapiRef.current.on('call-end', () => {
          console.log('📞 Vapi call ended')
          setIsCallActive(false)
          setIsConnecting(false)
          setIsSpeaking(false)
          onCallEnd?.()
        })

        vapiRef.current.on('speech-start', () => {
          console.log('🗣️ Assistant started speaking')
          setIsSpeaking(true)
        })

        vapiRef.current.on('speech-end', () => {
          console.log('🤐 Assistant stopped speaking')
          setIsSpeaking(false)
        })

        vapiRef.current.on('message', (message: any) => {
          console.log('💬 Vapi message:', message)

          // Handle different message types according to VAPI docs
          switch (message.type) {
            case 'transcript':
              if (message.transcript) {
                setTranscript(prev => [...prev, {
                  role: message.role || 'assistant',
                  text: message.transcript
                }])
              }
              break

            case 'function-call':
              console.log('🔧 Function call received:', message.functionCall)
              break

            case 'status-update':
              console.log('📊 Status update:', message.status)
              break

            default:
              console.log('ℹ️ Other message type:', message.type)
          }

          onMessage?.(message)
        })

        vapiRef.current.on('error', (error: any) => {
          console.error('❌ Vapi error:', error)
          setError(error.message || 'Call failed')
          setIsCallActive(false)
          setIsConnecting(false)
          setIsSpeaking(false)
        })

      } catch (initError) {
        console.error('❌ Vapi initialization error:', initError)
        console.log('🎭 Vapi unavailable, using demo mode')
        vapiRef.current = null
        return
      }
    }

    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop()
        } catch (error) {
          console.error('Error stopping Vapi:', error)
        }
      }
    }
  }, [assistantId, publicKey, onCallStart, onCallEnd, onMessage])

  // Simple microphone permission request
  const requestPermissions = async () => {
    try {
      console.log('🎤 Requesting microphone permissions...')

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('📱 getUserMedia not available, showing text input')
        setShowTextInput(true)
        return false
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Microphone permission granted')

      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop())

      setHasPermissions(true)
      setError(null)
      return true
    } catch (error: any) {
      console.log('🎤 Microphone not available, using text input fallback')

      // Don't show error, just enable text input
      setHasPermissions(false)
      setShowTextInput(true)
      return false
    }
  }

  // Text-to-speech function with agent-specific voice selection
  const speak = (text: string) => {
    if (speechSynthesisRef.current) {
      // Cancel any ongoing speech
      speechSynthesisRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Professional voice settings based on agent configuration
      utterance.rate = 0.85  // Slightly slower for clarity
      utterance.volume = 0.9  // Clear volume

      // Adjust pitch based on voice type
      if (voiceId?.includes('male')) {
        utterance.pitch = 0.85 // Lower for male voices
      } else {
        utterance.pitch = 0.95 // Slightly higher for female voices
      }

      // Select voice based on agent's configured voice ID
      const voices = speechSynthesisRef.current.getVoices()
      let selectedVoice = null

      // Map agent voice IDs to browser voices
      const voiceMapping: Record<string, string[]> = {
        'female_professional': ['Microsoft Emma', 'Microsoft Aria', 'Google US English Female', 'Samantha', 'Victoria'],
        'female_friendly': ['Microsoft Jenny', 'Microsoft Aria', 'Google US English Female', 'Karen', 'Samantha'],
        'female_caring': ['Microsoft Aria', 'Microsoft Jenny', 'Samantha', 'Victoria'],
        'male_professional': ['Microsoft Andrew', 'Microsoft Guy', 'Google US English Male', 'Alex', 'Daniel'],
        'male_warm': ['Microsoft Brian', 'Microsoft Guy', 'Alex', 'Daniel'],
        'male_trustworthy': ['Microsoft Guy', 'Microsoft Andrew', 'Alex'],
        'male_sophisticated': ['Microsoft Davis', 'Microsoft Andrew', 'Daniel'],
        'male_practical': ['Microsoft Jason', 'Microsoft Brian', 'Alex']
      }

      // Get preferred voices for this agent
      const preferredVoiceNames = voiceMapping[voiceId || 'female_professional'] || voiceMapping['female_professional']

      // Try to find the best matching voice
      for (const voiceName of preferredVoiceNames) {
        selectedVoice = voices.find(voice => voice.name.includes(voiceName))
        if (selectedVoice) break
      }

      // Fallback to any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice =>
          voice.lang.includes('en-US') ||
          voice.lang.includes('en-GB') ||
          voice.lang.includes('en')
        )
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log(`🔊 Using ${voiceId} voice:`, selectedVoice.name)
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      speechSynthesisRef.current.speak(utterance)
    }
  }

  // Generate realistic agent responses based on user input
  const respondToUser = (userText: string) => {
    const lowerText = userText.toLowerCase()
    let response = ""

    // Context-aware responses like a real agent
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
      response = "Hello! Thanks for trying out the voice demo. I'm your AI assistant. How can I help you today?"
    } else if (lowerText.includes('how are you') || lowerText.includes('how do you do')) {
      response = "I'm doing great, thank you for asking! I'm here to demonstrate how I can assist with your business needs. What would you like to know about?"
    } else if (lowerText.includes('what') && lowerText.includes('do')) {
      response = "I'm an AI voice agent designed to help with customer interactions, lead qualification, and appointment scheduling. I can handle calls professionally and efficiently."
    } else if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('expensive')) {
      response = "I'd be happy to discuss pricing options with you. Our solutions are designed to provide excellent value. Would you like me to connect you with someone who can provide detailed pricing information?"
    } else if (lowerText.includes('appointment') || lowerText.includes('schedule') || lowerText.includes('meeting')) {
      response = "Absolutely! I can help you schedule an appointment. What day and time works best for you? I have availability throughout the week."
    } else if (lowerText.includes('interested') || lowerText.includes('tell me more')) {
      response = "That's wonderful to hear! I'd love to tell you more about how our AI voice solutions can benefit your business. What specific area interests you most?"
    } else if (lowerText.includes('not interested') || lowerText.includes('no thanks')) {
      response = "I understand, and I appreciate your time. If you ever have questions in the future, please don't hesitate to reach out. Have a great day!"
    } else if (lowerText.includes('real estate') || lowerText.includes('property') || lowerText.includes('house')) {
      response = "Great! I specialize in real estate interactions. I can help with lead qualification, property inquiries, and scheduling showings. Are you currently looking to buy or sell?"
    } else if (lowerText.includes('demo') || lowerText.includes('test')) {
      response = "You're experiencing our voice demo right now! This shows how I can have natural conversations with your customers. Pretty impressive, right?"
    } else {
      // Contextual responses based on keywords
      const responses = [
        "That's a great point. Let me provide you with some helpful information about that.",
        "I understand what you're asking about. Here's how I can assist you with that.",
        "Excellent question! Based on what you've told me, I'd recommend we explore that further.",
        "I appreciate you sharing that with me. Let me see how I can best help you.",
        "That's definitely something I can help you with. Would you like me to explain the process?",
        "Perfect! That's exactly the kind of thing I'm designed to handle efficiently."
      ]
      response = responses[Math.floor(Math.random() * responses.length)]
    }

    setTimeout(() => {
      setTranscript(prev => [...prev, { role: 'assistant', text: response }])
      speak(response)
    }, 800)
  }

  // Start listening for user input
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const startDemoMode = async () => {
    console.log('🎭 Starting voice demo mode')
    setIsConnecting(true)
    setError(null)
    setTranscript([])

    // Start demo immediately, request permissions when user wants to talk
    setTimeout(() => {
      setIsCallActive(true)
      setIsConnecting(false)
      onCallStart?.()

      // Start with agent's configured greeting or default
      const greeting = agentGreeting ||
        `Hello! This is ${agentName || 'your AI voice assistant'}. I'm here to demonstrate how I can help with customer interactions and business automation. You can either enable your microphone to speak with me, or use the text input below. How can I assist you today?`
      setTranscript([{ role: 'assistant', text: greeting }])
      speak(greeting)
    }, 1500)
  }

  // Request permissions and start listening
  const requestPermissionsAndListen = async () => {
    console.log('🎤 Requesting permissions and starting to listen...')
    const hasPermission = await requestPermissions()
    if (hasPermission) {
      startListening()
    }
  }

  // Handle text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim()) {
      setTranscript(prev => [...prev, { role: 'user', text: textInput }])
      respondToUser(textInput)
      setTextInput('')
    }
  }

  const startCall = async () => {
    // Check microphone permissions first
    try {
      console.log('🎤 Checking microphone permissions...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Clean up
      console.log('✅ Microphone permission granted')
    } catch (permError: any) {
      console.warn('⚠️ Microphone permission denied:', permError.message)
      setError('Microphone access required for voice calls. Please allow microphone access and try again.')
      return
    }

    // Test network connectivity to Vapi API
    try {
      console.log('🌐 Testing network connectivity to Vapi...')
      const connectivityTest = await fetch('/api/test-vapi-frontend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId,
          publicKey: publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
        })
      })

      const testResult = await connectivityTest.json()
      console.log('🧪 Connectivity test result:', testResult)

      if (!testResult.success || !testResult.tests.serverCanReachVapi) {
        throw new Error('Server cannot reach Vapi API. Please check network connectivity.')
      }
    } catch (connectError: any) {
      console.error('❌ Connectivity test failed:', connectError)
      setError(`Network connectivity issue: ${connectError.message}`)
      return
    }

    // Only try Vapi if we have a properly initialized instance
    if (vapiRef.current && assistantId && assistantId !== 'demo') {
      try {
        console.log('🎤 Attempting Vapi call with assistant:', assistantId)
        console.log('🔧 Vapi instance:', !!vapiRef.current)
        console.log('🔧 Public key configured:', !!(publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY))
        console.log('🔧 Browser info:', {
          userAgent: navigator.userAgent,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          hostname: window.location.hostname
        })

        setIsConnecting(true)
        setError(null)
        setTranscript([])

        // Create assistant configuration with disabled problematic features
        const assistantOverrides = {
          // Disable audio processing features that cause worklet errors
          backgroundDenoisingEnabled: false,
          backgroundSound: 'off',

          // Use basic transcriber without advanced features
          transcriber: {
            provider: 'deepgram',
            model: 'nova-2',
            language: 'en-US',
            // Disable advanced features that might use worklets
            enableUniversalStreamingApi: false
          },

          // Basic voice settings without advanced processing
          voice: {
            provider: 'openai',
            voiceId: 'nova'
          }
        }

        console.log('🔧 Using assistant overrides to disable problematic features:', assistantOverrides)

        // Add timeout to prevent hanging
        const callPromise = vapiRef.current.start(assistantId, assistantOverrides)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Vapi call timeout after 15 seconds')), 15000)
        )

        await Promise.race([callPromise, timeoutPromise])
        console.log('✅ Vapi call started successfully')
        return
      } catch (error: any) {
        console.error('❌ Vapi call failed:', error)
        console.log('🔧 Error details:', {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3),
          name: error.name,
          cause: error.cause,
          type: typeof error
        })

        // Show more specific error message based on error type
        let errorMessage = 'Call failed. '

        if (error.message?.includes('Failed to fetch')) {
          errorMessage += 'Network connection issue. This might be due to:\n• Firewall blocking Vapi API\n• Network connectivity problems\n• Browser security settings'
        } else if (error.message?.includes('timeout')) {
          errorMessage += 'Connection timed out. Please check your internet connection and try again.'
        } else if (error.message?.includes('permission')) {
          errorMessage += 'Microphone permission required. Please allow microphone access.'
        } else if (error.message?.includes('NotAllowedError')) {
          errorMessage += 'Microphone access denied. Please allow microphone access in your browser.'
        } else {
          errorMessage += `${error.message || 'Unknown error occurred'}`
        }

        setError(errorMessage)
        console.log('🎭 Falling back to demo mode due to error')
        // Reset connecting state and fall through to demo
        setIsConnecting(false)
      }
    } else {
      console.log('🎭 No Vapi instance or invalid assistant ID, using demo mode')
    }

    // Always fallback to demo mode
    startDemoMode()
  }

  const endCall = () => {
    console.log('🎤 Ending call')

    // Stop Vapi call if active
    if (vapiRef.current) {
      try {
        vapiRef.current.stop()
        console.log('✅ Vapi call ended')
      } catch (error) {
        console.error('❌ Error ending Vapi call:', error)
      }
    }

    // Stop demo mode voice activities
    stopListening()
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
    }
    setIsSpeaking(false)
    setIsListening(false)

    setIsCallActive(false)
    setIsConnecting(false)
    onCallEnd?.()
  }

  const toggleMute = () => {
    if (vapiRef.current) {
      if (isMuted) {
        vapiRef.current.unmute()
      } else {
        vapiRef.current.mute()
      }
      setIsMuted(!isMuted)
    }
  }

  // Button variant
  if (variant === 'button') {
    return (
      <Button
        onClick={isCallActive ? endCall : startCall}
        disabled={isConnecting}
        variant={isCallActive ? 'destructive' : 'default'}
        size={size}
        className={cn(
          'flex items-center gap-2',
          isCallActive && 'animate-pulse',
          className
        )}
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Connecting...
          </>
        ) : isCallActive ? (
          <>
            <PhoneOff className="w-4 h-4" />
            End Call
          </>
        ) : (
          <>
            <Phone className="w-4 h-4" />
            Start Call
          </>
        )}
      </Button>
    )
  }

  // Card variant
  if (variant === 'card') {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isCallActive ? 'default' : 'secondary'}>
                {isConnecting ? 'Connecting...' : isCallActive ? 'Call Active' : 'Ready'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {vapiRef.current && assistantId !== 'demo' ? 'Live Voice AI' : 'Voice Demo'}
              </Badge>
              {isListening && (
                <Badge variant="default" className="text-xs animate-pulse">
                  🎤 Listening
                </Badge>
              )}
              {isSpeaking && (
                <Badge variant="default" className="text-xs animate-pulse">
                  🔊 Speaking
                </Badge>
              )}
            </div>

            {/* Main Call Button */}
            <Button
              onClick={isCallActive ? endCall : startCall}
              disabled={isConnecting}
              variant={isCallActive ? 'destructive' : 'default'}
              size="lg"
              className={cn(
                'w-16 h-16 rounded-full',
                isCallActive && 'animate-pulse'
              )}
            >
              {isConnecting ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isCallActive ? (
                <PhoneOff className="w-6 h-6" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </Button>

            {/* Controls */}
            {isCallActive && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2">
                  {!hasPermissions ? (
                    <Button
                      onClick={requestPermissionsAndListen}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Mic className="w-4 h-4" />
                      Enable Microphone
                    </Button>
                  ) : (
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      variant={isListening ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      {isListening ? 'Stop Talking' : 'Start Talking'}
                    </Button>
                  )}

                  <Button
                    onClick={() => setShowTextInput(!showTextInput)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Type
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  {!hasPermissions ? 'Try voice input or use text below' :
                   isListening ? 'Speak now...' : 'Voice or text - your choice!'}
                </div>

                {/* Text Input - Show when requested or voice unavailable */}
                {showTextInput && (
                  <form onSubmit={handleTextSubmit} className="w-full flex gap-2">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type your message here..."
                      className="flex-1 px-3 py-2 text-sm border rounded-md bg-background focus:ring-2 focus:ring-blue-500"
                      autoFocus={showTextInput && !hasPermissions}
                    />
                    <Button type="submit" size="sm" disabled={!textInput.trim()}>
                      Send
                    </Button>
                  </form>
                )}

                {/* Helpful hint */}
                {!showTextInput && (
                  <div className="text-xs text-muted-foreground text-center">
                    💬 Click "Type" for text input option
                  </div>
                )}
              </div>
            )}

            {/* Voice Info */}
            {voiceId && (
              <div className="text-xs text-center text-muted-foreground">
                🎤 Using {voiceId.replace(/_/g, ' ')} voice
              </div>
            )}

            {/* Transcript */}
            {transcript.length > 0 && (
              <div className="w-full max-h-32 overflow-y-auto space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Conversation:</div>
                {transcript.slice(-3).map((item, index) => (
                  <div key={index} className="text-sm">
                    <span className={cn(
                      'font-medium',
                      item.role === 'user' ? 'text-blue-600' : 'text-green-600'
                    )}>
                      {item.role === 'user' ? 'You' : 'Assistant'}:
                    </span>
                    <span className="ml-2">{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Floating variant
  if (variant === 'floating') {
    return (
      <div className={cn(
        'fixed bottom-6 right-6 z-50',
        className
      )}>
        <Button
          onClick={isCallActive ? endCall : startCall}
          disabled={isConnecting}
          variant={isCallActive ? 'destructive' : 'default'}
          size="lg"
          className={cn(
            'w-14 h-14 rounded-full shadow-lg',
            isCallActive && 'animate-pulse'
          )}
        >
          {isConnecting ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isCallActive ? (
            <PhoneOff className="w-5 h-5" />
          ) : (
            <Phone className="w-5 h-5" />
          )}
        </Button>

        {/* Floating transcript */}
        {isCallActive && transcript.length > 0 && (
          <Card className="absolute bottom-16 right-0 w-80 max-h-40 overflow-hidden">
            <CardContent className="p-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">Live Conversation</div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {transcript.slice(-2).map((item, index) => (
                  <div key={index} className="text-xs">
                    <span className={cn(
                      'font-medium',
                      item.role === 'user' ? 'text-blue-600' : 'text-green-600'
                    )}>
                      {item.role === 'user' ? 'You' : 'AI'}:
                    </span>
                    <span className="ml-1">{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return null
}
