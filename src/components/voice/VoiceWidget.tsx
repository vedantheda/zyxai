'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import Vapi from '@vapi-ai/web'

// Types for better TypeScript support
interface TranscriptMessage {
  role: 'user' | 'assistant'
  text: string
}

interface VapiMessage {
  type: string
  transcript?: string
  role?: 'user' | 'assistant'
  [key: string]: any
}

interface VoiceWidgetProps {
  /** VAPI Assistant ID to use for the call */
  assistantId: string
  /** VAPI Public Key (optional, will use env var if not provided) */
  publicKey?: string
  /** Voice ID for the assistant (optional) */
  voiceId?: string
  /** Agent name for personalized responses (optional) */
  agentName?: string
  /** Custom greeting message (optional) */
  agentGreeting?: string
  /** Callback when call starts */
  onCallStart?: () => void
  /** Callback when call ends */
  onCallEnd?: () => void
  /** Callback for all VAPI messages */
  onMessage?: (message: VapiMessage) => void
  /** Additional CSS classes */
  className?: string
  /** Widget display variant */
  variant?: 'button' | 'card' | 'floating'
  /** Widget size */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * VoiceWidget - A React component for VAPI voice assistant integration
 *
 * This component provides a clean interface for voice calls using VAPI.ai.
 * It handles microphone permissions, call state management, and real-time transcription.
 *
 * @example
 * ```tsx
 * <VoiceWidget
 *   assistantId="your-assistant-id"
 *   onCallStart={() => console.log('Call started')}
 *   onCallEnd={() => console.log('Call ended')}
 * />
 * ```
 */
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
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const vapiRef = useRef<Vapi | null>(null)

  // Initialize Vapi with direct import
  useEffect(() => {
    const initializeVapi = () => {
      if (typeof window !== 'undefined' && !vapiRef.current) {
        const apiKey = publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY

        if (!apiKey) {
          console.error('❌ No VAPI API key found')
          setError('VAPI API key is required')
          return
        }

        // Basic browser compatibility checks
        if (!navigator.mediaDevices?.getUserMedia) {
          console.error('❌ Microphone access not supported')
          setError('Microphone access not supported in this browser')
          return
        }

        if (typeof RTCPeerConnection === 'undefined') {
          console.error('❌ WebRTC not supported')
          setError('WebRTC not supported in this browser')
          return
        }

        console.log('🎤 Initializing VAPI...')

        try {
          // Create VAPI instance with direct import
          const vapi = new Vapi(apiKey)
          vapiRef.current = vapi

          console.log('✅ VAPI initialized successfully')

          // Set up event listeners
          vapi.on('call-start', () => {
            console.log('📞 Call started')
            setIsCallActive(true)
            setIsConnecting(false)
            setError(null)
            onCallStart?.()
          })

          vapi.on('call-end', () => {
            console.log('📞 Call ended')
            setIsCallActive(false)
            setIsConnecting(false)
            setIsSpeaking(false)
            onCallEnd?.()
          })

          vapi.on('speech-start', () => {
            console.log('🗣️ Assistant speaking')
            setIsSpeaking(true)
          })

          vapi.on('speech-end', () => {
            console.log('🤐 Assistant stopped')
            setIsSpeaking(false)
          })

          vapi.on('message', (message: VapiMessage) => {
            console.log('💬 Message:', message.type)

            // Handle transcript messages
            if (message.type === 'transcript' && message.transcript) {
              setTranscript(prev => [...prev, {
                role: message.role || 'assistant',
                text: message.transcript
              }])
            }

            onMessage?.(message)
          })

          vapi.on('error', (error: any) => {
            console.error('❌ VAPI error:', error)

            let errorMessage = 'Call failed'
            if (error?.message) {
              errorMessage = error.message
            } else if (typeof error === 'string') {
              errorMessage = error
            }

            setError(errorMessage)
            setIsCallActive(false)
            setIsConnecting(false)
            setIsSpeaking(false)
          })

        } catch (initError) {
          console.error('❌ VAPI initialization error:', initError)
          setError('Failed to initialize voice assistant')
        }
      }
    }

    initializeVapi()

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









  const startCall = async () => {
    if (!vapiRef.current) {
      setError('VAPI not initialized')
      return
    }

    if (!assistantId) {
      setError('Assistant ID is required')
      return
    }

    try {
      console.log('🎤 Starting VAPI call...')
      setIsConnecting(true)
      setError(null)
      setTranscript([])

      // Start the VAPI call with the assistant
      await vapiRef.current.start(assistantId)
      console.log('✅ VAPI call started successfully')

    } catch (error: any) {
      console.error('❌ Failed to start call:', error)
      setError(error.message || 'Failed to start call')
      setIsConnecting(false)
    }
  }

  const endCall = () => {
    console.log('🎤 Ending call')

    // Stop VAPI call if active
    if (vapiRef.current) {
      try {
        vapiRef.current.stop()
        console.log('✅ VAPI call ended')
      } catch (error) {
        console.error('❌ Error ending VAPI call:', error)
      }
    }

    setIsCallActive(false)
    setIsConnecting(false)
    setIsSpeaking(false)
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
                VAPI Voice AI
              </Badge>
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
                <Button
                  onClick={toggleMute}
                  variant={isMuted ? "destructive" : "outline"}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  VAPI is handling the conversation
                </div>


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
