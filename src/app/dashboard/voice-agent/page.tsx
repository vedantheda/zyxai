'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  PhoneCall,
  Clock,
  Users,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  Settings
} from 'lucide-react'
import { useRequireAuth } from '@/contexts/AuthContext'

export default function VoiceAgentPage() {
  const { user, loading } = useRequireAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading voice agent...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Voice Agent</h1>
          <p className="text-muted-foreground">
            24/7 AI-powered phone support for your tax practice
          </p>
        </div>
        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Configure Agent
        </Button>
      </div>

      {/* Voice Agent Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Handled</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+23%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3:42</div>
            <p className="text-xs text-muted-foreground">
              Minutes per call
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Calls resolved without transfer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8/5</div>
            <p className="text-xs text-muted-foreground">
              Average rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Agent Status</CardTitle>
          <CardDescription>
            Current status and configuration of your AI voice agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="font-medium">Agent is Online</h3>
                <p className="text-sm text-muted-foreground">
                  Ready to handle incoming calls • Phone: +1 (555) 123-4567
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Pause className="w-4 h-4 mr-2" />
                Pause Agent
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                'Answer tax-related questions',
                'Schedule appointments',
                'Collect client information',
                'Provide service information',
                'Transfer to human agents',
                'Send follow-up emails',
                'Update client records',
                'Handle payment inquiries'
              ].map((capability, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{capability}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Call Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  time: '2 minutes ago',
                  caller: 'Sarah Johnson',
                  topic: 'Tax deadline inquiry',
                  outcome: 'Resolved',
                  duration: '2:15'
                },
                {
                  time: '15 minutes ago',
                  caller: 'Michael Chen',
                  topic: 'Appointment scheduling',
                  outcome: 'Scheduled',
                  duration: '3:42'
                },
                {
                  time: '1 hour ago',
                  caller: 'Unknown caller',
                  topic: 'Service information',
                  outcome: 'Information provided',
                  duration: '1:58'
                }
              ].map((call, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{call.caller}</div>
                    <div className="text-xs text-muted-foreground">{call.topic}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {call.outcome}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {call.duration} • {call.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Notice */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Phone className="w-12 h-12 text-blue-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">AI Voice Agent</h3>
              <p className="text-muted-foreground max-w-md">
                24/7 AI-powered phone support that can handle client inquiries, 
                schedule appointments, and provide tax information automatically.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Priority:</strong> Medium • <strong>Status:</strong> In Development
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
