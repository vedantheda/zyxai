'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Play,
  Pause,
  Square,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react'

interface CampaignExecutionPanelProps {
  campaignId: string
  onStatusChange?: (status: string) => void
}

export function CampaignExecutionPanel({ campaignId, onStatusChange }: CampaignExecutionPanelProps) {
  const [execution, setExecution] = useState<any>(null)
  const [campaign, setCampaign] = useState<any>(null)
  const [recentCalls, setRecentCalls] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Poll for execution status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/status?organizationId=demo-org`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setExecution(data.metrics)
            setCampaign(data.campaign)
            setRecentCalls(data.recentActivity || [])
            onStatusChange?.(data.campaign?.status)
          }
        }
      } catch (error) {
        console.error('Failed to fetch campaign status:', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [campaignId, onStatusChange])

  const handleStart = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          organizationId: 'demo-org'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start campaign')
      }

      if (data.success) {
        // Refresh status after starting
        setTimeout(() => {
          window.location.reload() // Simple refresh for now
        }, 2000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleControl = async (action: 'pause' | 'resume' | 'stop') => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          organizationId: 'demo-org'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} campaign`)
      }

      if (data.success) {
        // Refresh status after action
        setTimeout(() => {
          window.location.reload() // Simple refresh for now
        }, 1000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'completed': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (!execution && !campaign) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Campaign Execution
          </CardTitle>
          <CardDescription>
            Start your campaign to begin making automated calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? 'Starting...' : 'Start Campaign'}
          </Button>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  const progress = execution?.totalCalls > 0
    ? Math.round((execution.completedCalls / execution.totalCalls) * 100)
    : 0

  const successRate = execution?.completedCalls > 0
    ? Math.round((execution.successfulCalls / execution.completedCalls) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Campaign Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Campaign Execution
            </div>
            <Badge className={`${getStatusColor(execution?.status)} text-white`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(execution?.status)}
                {execution?.status?.toUpperCase()}
              </div>
            </Badge>
          </CardTitle>
          <CardDescription>
            {campaign?.name} • Agent: {campaign?.agent_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{execution?.completedCalls || 0} / {execution?.totalCalls || 0} calls</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-center text-sm text-muted-foreground">
              {progress}% Complete
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {execution?.successfulCalls || 0}
              </div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {execution?.failedCalls || 0}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {successRate}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {execution?.currentBatch || 0}
              </div>
              <div className="text-sm text-muted-foreground">Current Batch</div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            {execution?.status === 'running' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleControl('pause')}
                  disabled={isLoading}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleControl('stop')}
                  disabled={isLoading}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}

            {execution?.status === 'paused' && (
              <Button
                onClick={() => handleControl('resume')}
                disabled={isLoading}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}

            {(execution?.status === 'completed' || execution?.status === 'failed') && (
              <Button
                onClick={handleStart}
                disabled={isLoading}
              >
                <Play className="h-4 w-4 mr-2" />
                Restart Campaign
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Calls */}
      {recentCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCalls.slice(0, 5).map((call) => (
                <div key={call.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {call.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {call.status === 'completed' ? 'Successful' : 'Failed'} call
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {call.duration_seconds ? `${Math.round(call.duration_seconds / 60)}m` : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
