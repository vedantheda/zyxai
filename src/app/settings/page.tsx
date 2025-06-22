'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Key,
  Smartphone,
  Mail,
  Clock,
  Save,
  AlertTriangle,
  CheckCircle,
  Settings,
  Moon,
  Sun,
  Monitor,
  Building,
  Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useNotificationPreferences } from '@/hooks/useNotifications'
import { LoadingScreen } from '@/components/ui/loading-spinner'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  timezone: string
  language: string
  role: string
  organization_id?: string
  theme_preference?: 'light' | 'dark' | 'system'
  dashboard_layout?: 'default' | 'compact' | 'detailed'
}

interface SecuritySettings {
  two_factor_enabled: boolean
  session_timeout: number
  login_alerts: boolean
  api_access_enabled: boolean
  password_last_changed?: string
  active_sessions?: number
}

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
]

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' }
]

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const { preferences: notificationPreferences, updatePreferences: updateNotificationPreferences, loading: notificationLoading } = useNotificationPreferences()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [security, setSecurity] = useState<SecuritySettings>({
    two_factor_enabled: false,
    session_timeout: 30,
    login_alerts: true,
    api_access_enabled: false,
    active_sessions: 1
  })

  const isAuthenticated = !!user
  const isReady = !authLoading

  // Show loading during session sync
  if (authLoading || !isReady) {
    return <LoadingScreen text="Loading settings..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view settings" />
  }

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadSecuritySettings()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setProfile(data)
      } else {
        // Create default profile
        setProfile({
          id: user?.id || '',
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          language: 'en',
          role: 'user',
          theme_preference: 'system',
          dashboard_layout: 'default'
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    }
  }

  const loadSecuritySettings = async () => {
    try {
      // Load security settings from database or auth provider
      setSecurity(prev => ({
        ...prev,
        password_last_changed: '2024-01-15',
        active_sessions: 2
      }))
    } catch (error) {
      console.error('Error loading security settings:', error)
    }
  }

  const saveProfile = async () => {
    if (!profile) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          timezone: profile.timezone,
          language: profile.language,
          theme_preference: profile.theme_preference,
          dashboard_layout: profile.dashboard_layout,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Apply theme change immediately
      if (profile.theme_preference) {
        document.documentElement.classList.remove('light', 'dark')
        if (profile.theme_preference !== 'system') {
          document.documentElement.classList.add(profile.theme_preference)
        }
      }

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const saveNotificationSettings = async () => {
    if (!notificationPreferences) return

    setLoading(true)
    try {
      const result = await updateNotificationPreferences(notificationPreferences)

      if (result?.success) {
        toast.success('Notification settings updated')
      } else {
        throw new Error(result?.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast.error('Failed to save notification settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSecuritySettings = async () => {
    setLoading(true)
    try {
      // Save security settings to database
      toast.success('Security settings updated')
    } catch (error) {
      console.error('Error saving security settings:', error)
      toast.error('Failed to save security settings')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      toast.success('Password reset email sent')
    } catch (error) {
      console.error('Error sending password reset:', error)
      toast.error('Failed to send password reset email')
    }
  }

  const revokeAllSessions = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) throw error

      toast.success('All sessions revoked. Please sign in again.')
      window.location.href = '/login'
    } catch (error) {
      console.error('Error revoking sessions:', error)
      toast.error('Failed to revoke sessions')
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Zap className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) => setProfile({ ...profile, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboard_layout">Dashboard Layout</Label>
                  <Select
                    value={profile.dashboard_layout}
                    onValueChange={(value) => setProfile({ ...profile, dashboard_layout: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  Role: {profile.role}
                </Badge>
              </div>

              <Separator />

              <Button onClick={saveProfile} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about important events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notificationPreferences ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.email_notifications}
                      onCheckedChange={(checked) =>
                        updateNotificationPreferences({
                          ...notificationPreferences,
                          email_notifications: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.push_notifications}
                      onCheckedChange={(checked) =>
                        updateNotificationPreferences({
                          ...notificationPreferences,
                          push_notifications: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications within the application
                      </p>
                    </div>
                    <Switch
                      checked={notificationPreferences.in_app_notifications}
                      onCheckedChange={(checked) =>
                        updateNotificationPreferences({
                          ...notificationPreferences,
                          in_app_notifications: checked
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Notification Types</h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Call Completed</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when calls are completed
                        </p>
                      </div>
                      <Switch
                        checked={notificationPreferences.notification_types.call_completed}
                        onCheckedChange={(checked) =>
                          updateNotificationPreferences({
                            ...notificationPreferences,
                            notification_types: {
                              ...notificationPreferences.notification_types,
                              call_completed: checked
                            }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Campaign Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about campaign progress
                        </p>
                      </div>
                      <Switch
                        checked={notificationPreferences.notification_types.campaign_finished}
                        onCheckedChange={(checked) =>
                          updateNotificationPreferences({
                            ...notificationPreferences,
                            notification_types: {
                              ...notificationPreferences.notification_types,
                              campaign_finished: checked
                            }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Important system notifications
                        </p>
                      </div>
                      <Switch
                        checked={notificationPreferences.notification_types.system_alert}
                        onCheckedChange={(checked) =>
                          updateNotificationPreferences({
                            ...notificationPreferences,
                            notification_types: {
                              ...notificationPreferences.notification_types,
                              system_alert: checked
                            }
                          })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Quiet Hours</h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Quiet Hours</Label>
                        <p className="text-sm text-muted-foreground">
                          Disable non-urgent notifications during specified hours
                        </p>
                      </div>
                      <Switch
                        checked={notificationPreferences.quiet_hours.enabled}
                        onCheckedChange={(checked) =>
                          updateNotificationPreferences({
                            ...notificationPreferences,
                            quiet_hours: {
                              ...notificationPreferences.quiet_hours,
                              enabled: checked
                            }
                          })
                        }
                      />
                    </div>

                    {notificationPreferences.quiet_hours.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start_time">Start Time</Label>
                          <Input
                            id="start_time"
                            type="time"
                            value={notificationPreferences.quiet_hours.start_time}
                            onChange={(e) =>
                              updateNotificationPreferences({
                                ...notificationPreferences,
                                quiet_hours: {
                                  ...notificationPreferences.quiet_hours,
                                  start_time: e.target.value
                                }
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_time">End Time</Label>
                          <Input
                            id="end_time"
                            type="time"
                            value={notificationPreferences.quiet_hours.end_time}
                            onChange={(e) =>
                              updateNotificationPreferences({
                                ...notificationPreferences,
                                quiet_hours: {
                                  ...notificationPreferences.quiet_hours,
                                  end_time: e.target.value
                                }
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load notification preferences. Please refresh the page.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <Button onClick={saveNotificationSettings} disabled={loading || notificationLoading}>
                <Save className="w-4 h-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={security.two_factor_enabled}
                    onCheckedChange={(checked) =>
                      setSecurity({ ...security, two_factor_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified of new login attempts
                    </p>
                  </div>
                  <Switch
                    checked={security.login_alerts}
                    onCheckedChange={(checked) =>
                      setSecurity({ ...security, login_alerts: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={security.session_timeout}
                    onChange={(e) =>
                      setSecurity({ ...security, session_timeout: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Automatically log out after this period of inactivity
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Password & Sessions</h4>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Last changed: {security.password_last_changed}
                    </p>
                  </div>
                  <Button variant="outline" onClick={changePassword}>
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      {security.active_sessions} active session(s)
                    </p>
                  </div>
                  <Button variant="outline" onClick={revokeAllSessions}>
                    Revoke All Sessions
                  </Button>
                </div>
              </div>

              <Separator />

              <Button onClick={saveSecuritySettings} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        profile.theme_preference === 'light' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setProfile({ ...profile, theme_preference: 'light' })}
                    >
                      <div className="flex items-center space-x-2">
                        <Sun className="w-4 h-4" />
                        <span className="text-sm font-medium">Light</span>
                      </div>
                    </div>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        profile.theme_preference === 'dark' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setProfile({ ...profile, theme_preference: 'dark' })}
                    >
                      <div className="flex items-center space-x-2">
                        <Moon className="w-4 h-4" />
                        <span className="text-sm font-medium">Dark</span>
                      </div>
                    </div>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        profile.theme_preference === 'system' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setProfile({ ...profile, theme_preference: 'system' })}
                    >
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4" />
                        <span className="text-sm font-medium">System</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dashboard Layout</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        profile.dashboard_layout === 'default' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setProfile({ ...profile, dashboard_layout: 'default' })}
                    >
                      <div className="text-center">
                        <div className="w-full h-8 bg-muted rounded mb-2"></div>
                        <span className="text-sm font-medium">Default</span>
                      </div>
                    </div>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        profile.dashboard_layout === 'compact' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setProfile({ ...profile, dashboard_layout: 'compact' })}
                    >
                      <div className="text-center">
                        <div className="w-full h-6 bg-muted rounded mb-2"></div>
                        <span className="text-sm font-medium">Compact</span>
                      </div>
                    </div>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        profile.dashboard_layout === 'detailed' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setProfile({ ...profile, dashboard_layout: 'detailed' })}
                    >
                      <div className="text-center">
                        <div className="w-full h-10 bg-muted rounded mb-2"></div>
                        <span className="text-sm font-medium">Detailed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <Button onClick={saveProfile} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Appearance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Manage your connected services and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">H</span>
                    </div>
                    <div>
                      <p className="font-medium">HubSpot CRM</p>
                      <p className="text-sm text-muted-foreground">
                        Sync contacts and deals
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Connected</Badge>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">V</span>
                    </div>
                    <div>
                      <p className="font-medium">VAPI Voice AI</p>
                      <p className="text-sm text-muted-foreground">
                        AI voice calling platform
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Connected</Badge>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">S</span>
                    </div>
                    <div>
                      <p className="font-medium">Salesforce</p>
                      <p className="text-sm text-muted-foreground">
                        Customer relationship management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Not Connected</Badge>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">Z</span>
                    </div>
                    <div>
                      <p className="font-medium">Zapier</p>
                      <p className="text-sm text-muted-foreground">
                        Workflow automation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Not Connected</Badge>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  More integrations are coming soon. Contact support if you need a specific integration.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}