'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Play,
  Pause,
  Square,
  Users,
  Settings,
  Monitor,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'

interface VapiCall {
  id: string
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  assistantId: string
  phoneNumberId?: string
  customerNumber: string
  duration: number
  startedAt: string
  endedAt?: string
}

interface VapiRealTimeControlProps {
  callId?: string
  onCallAction?: (action: string, data?: any) => void
}

export function VapiRealTimeControl({ callId, onCallAction }: VapiRealTimeControlProps) {
  const [activeCall, setActiveCall] = useState<VapiCall | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isControlling, setIsControlling] = useState(false)
  const [messageToInject, setMessageToInject] = useState('')
  const [assistantUpdate, setAssistantUpdate] = useState('')
  const [transferNumber, setTransferNumber] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  // Mock call data for demonstration
  useEffect(() => {
    if (callId) {
      setActiveCall({
        id: callId,
        status: 'in-progress',
        assistantId: 'asst_123',
        customerNumber: '+1234567890',
        duration: 125,
        startedAt: new Date().toISOString()
      })
      setIsConnected(true)
    }
  }, [callId])

  const handleCallAction = (action: string, data?: any) => {
    console.log(`🎮 Call action: ${action}`, data)
    onCallAction?.(action, data)
  }

  const injectMessage = async () => {
    if (!messageToInject.trim()) return

    try {
      await handleCallAction('inject_message', {
        message: messageToInject,
        role: 'assistant'
      })
      setMessageToInject('')
    } catch (error) {
      console.error('Failed to inject message:', error)
    }
  }

  const updateAssistant = async () => {
    if (!assistantUpdate.trim()) return

    try {
      await handleCallAction('update_assistant', {
        instructions: assistantUpdate
      })
      setAssistantUpdate('')
    } catch (error) {
      console.error('Failed to update assistant:', error)
    }
  }

  const transferCall = async () => {
    if (!transferNumber.trim()) return

    try {
      await handleCallAction('transfer_call', {
        destination: transferNumber
      })
      setTransferNumber('')
    } catch (error) {
      console.error('Failed to transfer call:', error)
    }
  }

  const endCall = async () => {
    try {
      await handleCallAction('end_call')
      setActiveCall(null)
      setIsConnected(false)
    } catch (error) {
      console.error('Failed to end call:', error)
    }
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    handleCallAction('toggle_listening', { enabled: !isListening })
  }

  const toggleControl = () => {
    setIsControlling(!isControlling)
    handleCallAction('toggle_control', { enabled: !isControlling })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Real-Time Call Control
              </CardTitle>
              <CardDescription>
                Monitor and control active VAPI calls in real-time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Active Call Information */}
      {activeCall && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Active Call
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Call ID</Label>
                <p className="font-mono text-sm">{activeCall.id}</p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Customer</Label>
                <p className="font-medium">{activeCall.customerNumber}</p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Duration</Label>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(activeCall.duration)}
                </p>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Status</Label>
                <Badge variant={activeCall.status === 'in-progress' ? 'default' : 'secondary'}>
                  {activeCall.status}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={toggleListening}
                variant={isListening ? 'default' : 'outline'}
                size="sm"
              >
                {isListening ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </Button>

              <Button
                onClick={toggleControl}
                variant={isControlling ? 'default' : 'outline'}
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                {isControlling ? 'Stop Control' : 'Start Control'}
              </Button>

              <Button
                onClick={endCall}
                variant="destructive"
                size="sm"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-Time Actions */}
      {activeCall && isControlling && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Injection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Inject Message
              </CardTitle>
              <CardDescription>
                Send a message for the assistant to speak immediately
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Message to Inject</Label>
                <Textarea
                  value={messageToInject}
                  onChange={(e) => setMessageToInject(e.target.value)}
                  placeholder="Enter message for assistant to speak..."
                  rows={3}
                />
              </div>
              
              <Button onClick={injectMessage} disabled={!messageToInject.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Inject Message
              </Button>
            </CardContent>
          </Card>

          {/* Assistant Update */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Update Assistant
              </CardTitle>
              <CardDescription>
                Modify assistant behavior during the call
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>New Instructions</Label>
                <Textarea
                  value={assistantUpdate}
                  onChange={(e) => setAssistantUpdate(e.target.value)}
                  placeholder="Enter new instructions for the assistant..."
                  rows={3}
                />
              </div>
              
              <Button onClick={updateAssistant} disabled={!assistantUpdate.trim()}>
                <Settings className="h-4 w-4 mr-2" />
                Update Assistant
              </Button>
            </CardContent>
          </Card>

          {/* Call Transfer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Transfer Call
              </CardTitle>
              <CardDescription>
                Transfer the call to another number or assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Transfer Destination</Label>
                <Input
                  value={transferNumber}
                  onChange={(e) => setTransferNumber(e.target.value)}
                  placeholder="+1234567890 or assistant_id"
                />
              </div>
              
              <Button onClick={transferCall} disabled={!transferNumber.trim()}>
                <Phone className="h-4 w-4 mr-2" />
                Transfer Call
              </Button>
            </CardContent>
          </Card>

          {/* Call Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Analytics
              </CardTitle>
              <CardDescription>
                Real-time call metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Messages</Label>
                  <p className="text-2xl font-bold">12</p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Interruptions</Label>
                  <p className="text-2xl font-bold">3</p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Sentiment</Label>
                  <Badge variant="default">Positive</Badge>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Confidence</Label>
                  <p className="text-2xl font-bold">94%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Active Call */}
      {!activeCall && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Active Call</h3>
              <p>Start a call to access real-time control features</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Real-Time Control:</strong> This feature allows you to monitor and control active calls in real-time. Ensure proper authentication and permissions are configured for security.
        </AlertDescription>
      </Alert>
    </div>
  )
}
