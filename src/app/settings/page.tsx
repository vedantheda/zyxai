'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, User, Bell, Shield, Building } from 'lucide-react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'

export default function SettingsPage() {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading settings..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view settings" />
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Practice configuration and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <User className="h-5 w-5 text-muted-foreground mr-2" />
            <div>
              <CardTitle className="text-base">Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Building className="h-5 w-5 text-muted-foreground mr-2" />
            <div>
              <CardTitle className="text-base">Practice Settings</CardTitle>
              <CardDescription>
                Configure your tax practice details
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Manage Practice
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Bell className="h-5 w-5 text-muted-foreground mr-2" />
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Configure Notifications
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Shield className="h-5 w-5 text-muted-foreground mr-2" />
            <div>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            This page is under development. Settings features will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Features coming soon:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>User profile management</li>
            <li>Practice configuration</li>
            <li>Notification preferences</li>
            <li>Security settings</li>
            <li>Integration settings</li>
            <li>Billing and subscription management</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
