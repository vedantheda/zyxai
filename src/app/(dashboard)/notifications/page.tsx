'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-screen'
import {
  Bell,
  BellRing,
  Settings,
  Mail,
  Phone,
  MessageSquare,
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Users,
  DollarSign,
  Target,
  Zap,
  Calendar,
  Archive,
  Trash2,
  Filter,
  Search,
  Download
} from 'lucide-react'

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  inAppNotifications: boolean
  callNotifications: boolean
  leadNotifications: boolean
  billingNotifications: boolean
  systemNotifications: boolean
  campaignNotifications: boolean
  workflowNotifications: boolean
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
}

interface NotificationStats {
  total: number
  unread: number
  today: number
  thisWeek: number
  byType: Record<string, number>
  byPriority: Record<string, number>
}

export default function NotificationsPage() {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<any[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0,
    byType: {},
    byPriority: {}
  })
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
    callNotifications: true,
    leadNotifications: true,
    billingNotifications: true,
    systemNotifications: true,
    campaignNotifications: true,
    workflowNotifications: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    frequency: 'immediate'
  })
  const [isLoading, setIsLoading] = useState(true)

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (isSessionReady && isAuthenticated) {
      loadNotifications()
      loadSettings()
    }
  }, [isSessionReady, isAuthenticated])

  // Show loading during session sync
  if (loading || !isSessionReady) {
    return <LoadingScreen />
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <LoadingScreen />
  }

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        calculateStats(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        console.log('✅ Notification settings saved')
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    }
  }

  const calculateStats = (notificationsData: any[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      total: notificationsData.length,
      unread: notificationsData.filter(n => !n.read).length,
      today: notificationsData.filter(n => new Date(n.created_at) >= today).length,
      thisWeek: notificationsData.filter(n => new Date(n.created_at) >= thisWeek).length,
      byType: {},
      byPriority: {}
    }

    // Calculate by type
    notificationsData.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1
      stats.byPriority[n.priority || 'medium'] = (stats.byPriority[n.priority || 'medium'] || 0) + 1
    })

    setStats(stats)
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: unreadIds
        }),
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        calculateStats(notifications.map(n => ({ ...n, read: true })))
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const clearAllNotifications = async () => {
    try {
      const allIds = notifications.map(n => n.id)
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: allIds
        }),
      })

      if (response.ok) {
        setNotifications([])
        calculateStats([])
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone
      case 'lead': return Users
      case 'billing': return DollarSign
      case 'campaign': return Target
      case 'workflow': return Zap
      case 'system': return Settings
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your notifications and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={clearAllNotifications}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Bell className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
              <div className="p-2 bg-red-500 rounded-lg">
                <BellRing className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>
                  Your latest notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : notifications.slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">No Notifications</h3>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => {
                      const TypeIcon = getTypeIcon(notification.type)
                      
                      return (
                        <div key={notification.id} className="flex gap-3 p-3 border rounded-lg">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <TypeIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              {!notification.read && (
                                <Badge variant="destructive" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>
                  Breakdown by notification category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    const TypeIcon = getTypeIcon(type)
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{type}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                Complete history of all your notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Full History Coming Soon</h3>
                <p>Complete notification history and search will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Channels</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4" />
                    <div>
                      <Label>In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show notifications in the application</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.inAppNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, inAppNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4" />
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4" />
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Browser push notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4" />
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive urgent notifications via SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Types</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Call Notifications</Label>
                    <Switch
                      checked={settings.callNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, callNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Lead Notifications</Label>
                    <Switch
                      checked={settings.leadNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, leadNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Billing Notifications</Label>
                    <Switch
                      checked={settings.billingNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, billingNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>System Notifications</Label>
                    <Switch
                      checked={settings.systemNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, systemNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Campaign Notifications</Label>
                    <Switch
                      checked={settings.campaignNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, campaignNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Workflow Notifications</Label>
                    <Switch
                      checked={settings.workflowNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, workflowNotifications: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Frequency</h3>
                <div className="space-y-2">
                  <Label>Email Digest Frequency</Label>
                  <Select 
                    value={settings.frequency} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, frequency: value as any }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t">
                <Button onClick={saveSettings}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
