'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Bell,
  BellRing,
  Trash2
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

export default function TestNotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    refreshNotifications
  } = useNotifications()

  const [testResult, setTestResult] = useState<string | null>(null)

  const testNotificationSystem = async () => {
    try {
      setTestResult('Testing notification system...')
      
      // Test sending a notification
      const result = await sendNotification(
        'system_alert',
        'Test Notification',
        'This is a test notification to verify the system is working correctly.',
        {
          priority: 'medium',
          data: { test: true },
          actionUrl: '/dashboard',
          actionLabel: 'Go to Dashboard'
        }
      )

      if (result?.success) {
        setTestResult('✅ Notification system is working correctly!')
      } else {
        setTestResult(`❌ Test failed: ${result?.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      setTestResult(`❌ Test failed: ${error.message}`)
    }
  }

  const testHighPriorityNotification = async () => {
    await sendNotification(
      'agent_error',
      'High Priority Alert',
      'This is a high priority notification that should show as a toast.',
      {
        priority: 'high',
        data: { urgent: true }
      }
    )
  }

  const testCampaignNotification = async () => {
    await sendNotification(
      'campaign_finished',
      'Campaign Completed',
      'Your "Real Estate Leads" campaign has finished with 85% success rate.',
      {
        priority: 'medium',
        data: { 
          campaignId: 'test-123',
          successRate: 85,
          totalCalls: 100
        },
        actionUrl: '/dashboard/campaigns/test-123',
        actionLabel: 'View Results'
      }
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification System Test</h1>
          <p className="text-muted-foreground">
            Test and verify the notification system is working correctly
          </p>
        </div>
        <Button onClick={refreshNotifications}>
          <Bell className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Use these buttons to test different notification scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={testNotificationSystem}>
              Test Basic Notification
            </Button>
            <Button onClick={testHighPriorityNotification} variant="outline">
              Test High Priority
            </Button>
            <Button onClick={testCampaignNotification} variant="outline">
              Test Campaign Alert
            </Button>
            <Button onClick={markAllAsRead} variant="secondary">
              Mark All Read
            </Button>
          </div>
          
          {testResult && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{testResult}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <span className="text-sm">Loading: {loading ? 'Yes' : 'No'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Total: {notifications.length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-600" />
              <span className="text-sm">Unread: {unreadCount}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {preferences ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">Preferences: {preferences ? 'Loaded' : 'None'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {preferences.email_notifications ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">Email Notifications</span>
              </div>
              
              <div className="flex items-center gap-2">
                {preferences.push_notifications ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">Push Notifications</span>
              </div>
              
              <div className="flex items-center gap-2">
                {preferences.in_app_notifications ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">In-App Notifications</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            {notifications.length === 0 
              ? 'No notifications yet. Try creating a test notification above.'
              : `Showing ${notifications.length} notifications`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications to display</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    notification.read ? 'bg-muted/50' : 'bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Badge variant={
                          notification.priority === 'urgent' ? 'destructive' :
                          notification.priority === 'high' ? 'default' :
                          'secondary'
                        }>
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline">{notification.type}</Badge>
                        {!notification.read && (
                          <Badge variant="default" className="bg-blue-600">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {notification.action_url && notification.action_label && (
                    <div className="mt-3">
                      <Button size="sm" variant="link" className="p-0 h-auto">
                        {notification.action_label}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
