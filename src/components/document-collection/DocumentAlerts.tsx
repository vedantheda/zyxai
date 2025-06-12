'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { DocumentAlert } from '@/types/document-collection'
import { documentCollectionService } from '@/lib/document-collection/DocumentCollectionService'
import {
  AlertTriangle,
  Clock,
  FileX,
  CheckCircle2,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  MessageSquare,
  Calendar,
  User,
  Filter,
  RefreshCw,
  X,
  ExternalLink
} from 'lucide-react'

interface DocumentAlertsProps {
  clientId?: string
  showClientFilter?: boolean
  maxAlerts?: number
}

export function DocumentAlerts({ 
  clientId, 
  showClientFilter = false, 
  maxAlerts = 50 
}: DocumentAlertsProps) {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<DocumentAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<DocumentAlert | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')

  useEffect(() => {
    loadAlerts()
  }, [clientId])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const data = await documentCollectionService.getActiveAlerts(clientId)
      setAlerts(data.slice(0, maxAlerts))
    } catch (error) {
      toast({
        title: 'Error loading alerts',
        description: 'Failed to load document alerts',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResolveAlert = async (alert: DocumentAlert) => {
    try {
      await documentCollectionService.resolveAlert(alert.id, resolutionNote)
      await loadAlerts()
      setSelectedAlert(null)
      setResolutionNote('')
      
      toast({
        title: 'Alert resolved',
        description: `${alert.title} has been resolved`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive'
      })
    }
  }

  const handleAcknowledgeAlert = async (alert: DocumentAlert) => {
    try {
      // In a real implementation, this would call an acknowledge endpoint
      console.log('Acknowledging alert:', alert.id)
      toast({
        title: 'Alert acknowledged',
        description: `${alert.title} has been acknowledged`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive'
      })
    }
  }

  const getSeverityIcon = (severity: DocumentAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'error':
        return <X className="w-5 h-5 text-red-500" />
      case 'warning':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'info':
        return <Bell className="w-5 h-5 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: DocumentAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getTypeIcon = (type: DocumentAlert['type']) => {
    switch (type) {
      case 'missing_document':
        return <FileX className="w-4 h-4" />
      case 'deadline_approaching':
        return <Calendar className="w-4 h-4" />
      case 'quality_issue':
        return <AlertTriangle className="w-4 h-4" />
      case 'review_needed':
        return <Eye className="w-4 h-4" />
      case 'client_action_required':
        return <User className="w-4 h-4" />
      case 'system_error':
        return <X className="w-4 h-4" />
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    return alert.severity === filter
  })

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical')
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning')
  const infoAlerts = alerts.filter(alert => alert.severity === 'info')

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin mr-2" />
            Loading alerts...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Alerts</h2>
          <p className="text-muted-foreground">
            {clientId ? 'Client-specific' : 'Practice-wide'} document monitoring alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadAlerts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-orange-600">{warningAlerts.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Info</p>
                <p className="text-2xl font-bold text-blue-600">{infoAlerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({alerts.length})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({criticalAlerts.length})</TabsTrigger>
          <TabsTrigger value="warning">Warning ({warningAlerts.length})</TabsTrigger>
          <TabsTrigger value="info">Info ({infoAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No {filter === 'all' ? '' : filter} alerts</p>
                  <p className="text-sm">Everything looks good!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card key={alert.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium truncate">{alert.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSeverityColor(alert.severity)}`}
                          >
                            {alert.severity}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            {getTypeIcon(alert.type)}
                            <span className="ml-1">{alert.type.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Created: {alert.createdAt.toLocaleDateString()}</span>
                          {alert.deadline && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Due: {alert.deadline.toLocaleDateString()}
                            </span>
                          )}
                          {alert.assignedTo && (
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {alert.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Acknowledge
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolve Alert</DialogTitle>
                            <DialogDescription>
                              {alert.title}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium mb-2">Alert Details</p>
                              <p className="text-sm text-muted-foreground">{alert.message}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                <strong>Action Required:</strong> {alert.actionRequired}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Resolution Notes</label>
                              <Textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Describe how this alert was resolved..."
                                className="mt-1"
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleResolveAlert(alert)}>
                                Resolve Alert
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
