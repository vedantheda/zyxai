'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
interface ProgressData {
  overall_percentage: number
  total_items: number
  required_items: number
  completed_items: number
  completed_required: number
  by_category: Record<string, {
    total: number
    completed: number
    required: number
    completedRequired: number
  }>
  by_priority: Record<string, {
    total: number
    completed: number
  }>
}
interface AlertData {
  overdue_count: number
  upcoming_deadlines: number
  overdue_items: any[]
  upcoming_items: any[]
}
interface ProgressTrackerProps {
  clientId: string
  clientName: string
  refreshTrigger?: number
}
export default function ProgressTracker({
  clientId,
  clientName,
  refreshTrigger
}: ProgressTrackerProps) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [alerts, setAlerts] = useState<AlertData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  // Get auth token for API calls
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }
  useEffect(() => {
    if (user && clientId) {
      fetchProgress()
    }
  }, [user, clientId, refreshTrigger])
  const fetchProgress = async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      if (!token) {
        throw new Error('No auth token available')
      }
      const response = await fetch(`/api/document-collection/progress/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch progress')
      }
      const result = await response.json()
      if (result.success) {
        setProgress(result.data.progress)
        setAlerts(result.data.alerts)
        setLastUpdated(result.data.last_updated)
      }
    } catch (error) {
      } finally {
      setLoading(false)
    }
  }
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }
  const getCategoryProgress = (category: string) => {
    if (!progress?.by_category[category]) return 0
    const cat = progress.by_category[category]
    return cat.required > 0 ? Math.round((cat.completedRequired / cat.required) * 100) : 0
  }
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading progress...</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  if (!progress) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No progress data available
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Overall Progress</span>
          </CardTitle>
          <CardDescription>
            Document collection progress for {clientName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                <span className={getProgressColor(progress.overall_percentage)}>
                  {progress.overall_percentage}%
                </span>
              </span>
              <div className="text-right text-sm text-muted-foreground">
                <div>{progress.completed_required} of {progress.required_items} required</div>
                <div>{progress.completed_items} of {progress.total_items} total</div>
              </div>
            </div>
            <Progress value={progress.overall_percentage} className="w-full h-3" />
            {lastUpdated && (
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Alerts */}
      {alerts && (alerts.overdue_count > 0 || alerts.upcoming_deadlines > 0) && (
        <div className="space-y-3">
          {alerts.overdue_count > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>{alerts.overdue_count} overdue documents</strong> require immediate attention
              </AlertDescription>
            </Alert>
          )}
          {alerts.upcoming_deadlines > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>{alerts.upcoming_deadlines} documents</strong> have deadlines in the next 7 days
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      {/* Progress by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Category</CardTitle>
          <CardDescription>
            Document completion status across different categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(progress.by_category).map(([category, data]) => {
              const categoryProgress = getCategoryProgress(category)
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium capitalize">
                        {category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {data.completedRequired}/{data.required}
                      </span>
                      <Badge variant="outline">
                        {categoryProgress}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={categoryProgress} className="w-full" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      {/* Progress by Priority */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Priority</CardTitle>
          <CardDescription>
            Document completion status by priority level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(progress.by_priority).map(([priority, data]) => {
              const priorityProgress = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
              const priorityColor = priority === 'high' ? 'text-red-600' :
                                  priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
              return (
                <div key={priority} className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      priority === 'high' ? 'bg-red-500' :
                      priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="font-medium capitalize">{priority}</span>
                  </div>
                  <div className={`text-2xl font-bold ${priorityColor}`}>
                    {priorityProgress}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data.completed} of {data.total}
                  </div>
                  <Progress value={priorityProgress} className="w-full" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {progress.completed_items}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {progress.required_items - progress.completed_required}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {alerts?.overdue_count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {progress.total_items}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
