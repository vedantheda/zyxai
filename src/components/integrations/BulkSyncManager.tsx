'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play,
  Pause,
  X,
  Users,
  Phone
} from 'lucide-react'

interface BulkSyncJob {
  id: string
  job_type: string
  crm_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  total_records: number
  processed_records: number
  successful_records: number
  failed_records: number
  started_at?: string
  completed_at?: string
  created_at: string
}

interface BulkSyncProgress {
  jobId: string
  status: string
  progress: number
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  estimatedTimeRemaining?: number
}

export default function BulkSyncManager() {
  const { organization } = useOrganization()
  const [jobs, setJobs] = useState<BulkSyncJob[]>([])
  const [activeJobs, setActiveJobs] = useState<Map<string, BulkSyncProgress>>(new Map())
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (organization) {
      loadJobs()
      // Set up polling for active jobs
      const interval = setInterval(pollActiveJobs, 5000)
      return () => clearInterval(interval)
    }
  }, [organization])

  const loadJobs = async () => {
    if (!organization) return

    try {
      setLoading(true)
      const response = await fetch(`/api/integrations/bulk-sync?organizationId=${organization.id}`)
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs || [])
        // Start polling for running jobs
        const runningJobs = data.jobs?.filter((job: BulkSyncJob) => 
          job.status === 'running' || job.status === 'pending'
        ) || []
        
        for (const job of runningJobs) {
          pollJobProgress(job.id)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load jobs' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load jobs' })
    } finally {
      setLoading(false)
    }
  }

  const pollJobProgress = async (jobId: string) => {
    try {
      const response = await fetch(`/api/integrations/bulk-sync?jobId=${jobId}`)
      const data = await response.json()

      if (response.ok && data.progress) {
        setActiveJobs(prev => new Map(prev.set(jobId, data.progress)))
        
        // Stop polling if job is complete
        if (data.progress.status === 'completed' || data.progress.status === 'failed') {
          setTimeout(() => {
            setActiveJobs(prev => {
              const newMap = new Map(prev)
              newMap.delete(jobId)
              return newMap
            })
            loadJobs() // Refresh job list
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error polling job progress:', error)
    }
  }

  const pollActiveJobs = () => {
    activeJobs.forEach((_, jobId) => {
      pollJobProgress(jobId)
    })
  }

  const startBulkSync = async (type: 'contacts' | 'calls', entityIds: string[]) => {
    if (!organization || entityIds.length === 0) return

    try {
      setSyncing(true)
      const response = await fetch('/api/integrations/bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          type,
          entityIds,
          crmType: 'hubspot'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: `Bulk sync started for ${entityIds.length} ${type}` })
        loadJobs()
        // Start polling for this job
        if (data.jobId) {
          pollJobProgress(data.jobId)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start bulk sync' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start bulk sync' })
    } finally {
      setSyncing(false)
    }
  }

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/integrations/bulk-sync?jobId=${jobId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Job cancelled successfully' })
        loadJobs()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to cancel job' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel job' })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'failed':
        return 'destructive'
      case 'running':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading bulk sync jobs...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Sync Operations
          </CardTitle>
          <CardDescription>
            Synchronize multiple contacts or calls to your CRM at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => {
                // This would open a contact selection modal
                // For demo, we'll sync a few sample contacts
                startBulkSync('contacts', ['sample-1', 'sample-2', 'sample-3'])
              }}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Sync All Contacts
            </Button>
            
            <Button
              onClick={() => {
                // This would open a call selection modal
                // For demo, we'll sync a few sample calls
                startBulkSync('calls', ['call-1', 'call-2', 'call-3'])
              }}
              disabled={syncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Sync Recent Calls
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      {activeJobs.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Sync Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from(activeJobs.entries()).map(([jobId, progress]) => (
              <div key={jobId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(progress.status)}
                    <span className="font-medium">
                      Syncing {progress.totalRecords} records
                    </span>
                    <Badge variant={getStatusColor(progress.status) as any}>
                      {progress.status}
                    </Badge>
                  </div>
                  
                  {progress.status === 'running' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelJob(jobId)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <Progress value={progress.progress} className="w-full" />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {progress.processedRecords} / {progress.totalRecords} processed
                  </span>
                  <span>
                    {progress.successfulRecords} successful, {progress.failedRecords} failed
                  </span>
                  {progress.estimatedTimeRemaining && (
                    <span>
                      ~{formatDuration(progress.estimatedTimeRemaining)} remaining
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>
            Recent bulk synchronization jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bulk sync jobs yet. Start your first bulk sync above.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(job.status)}
                    
                    <div>
                      <div className="font-medium">
                        {job.job_type.replace('_', ' ').replace('to crm', 'to CRM')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.total_records} records • {job.crm_type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={getStatusColor(job.status) as any}>
                      {job.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="text-right text-sm">
                    <div className="text-green-600">
                      ✓ {job.successful_records}
                    </div>
                    {job.failed_records > 0 && (
                      <div className="text-red-600">
                        ✗ {job.failed_records}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
