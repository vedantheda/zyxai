'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MemoizedInput } from '@/components/ui/memoized-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Settings
} from 'lucide-react'
import { useRequireAuth } from '@/contexts/AuthContext'
import { useUserDashboard } from '@/hooks/useUserDashboard'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
export default function ProfilePage() {
  const { user, loading: authLoading } = useRequireAuth()
  const { data: dashboardData, loading: dashboardLoading, refetch } = useUserDashboard()
  const { addToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    organization_name: '',
  })
  // Load user data when available
  useEffect(() => {
    if (user && dashboardData.client) {
      setFormData({
        first_name: dashboardData.client.name?.split(' ')[0] || '',
        last_name: dashboardData.client.name?.split(' ').slice(1).join(' ') || '',
        email: dashboardData.client.email || user.email || '',
        phone: dashboardData.client.phone || '',
        organization_name: dashboardData.client.organization_name || '',
      })
    } else if (user) {
      setFormData({
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        organization_name: user.user_metadata?.organization_name || '',
      })
    }
  }, [user, dashboardData])
  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          organization_name: formData.organization_name,
        }
      })
      if (authError) throw authError
      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      if (profileError) throw profileError
      // Update client record if it exists
      if (dashboardData.client) {
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            name: `${formData.first_name} ${formData.last_name}`.trim(),
            email: formData.email,
            phone: formData.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
        if (clientError) throw clientError
      }
      addToast({
        type: 'success',
        title: 'Profile updated',
        description: 'Your profile information has been saved successfully.',
      })
      setIsEditing(false)
      refetch() // Refresh dashboard data
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
      })
    } finally {
      setIsSaving(false)
    }
  }
  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data
    if (user && dashboardData.client) {
      setFormData({
        first_name: dashboardData.client.name?.split(' ')[0] || '',
        last_name: dashboardData.client.name?.split(' ').slice(1).join(' ') || '',
        email: dashboardData.client.email || user.email || '',
        phone: dashboardData.client.phone || '',
        organization_name: dashboardData.client.organization_name || '',
      })
    }
  }
  // Memoized handlers to prevent focus loss
  const handleFirstNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, first_name: e.target.value }))
  }, [])
  const handleLastNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, last_name: e.target.value }))
  }, [])
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, email: e.target.value }))
  }, [])
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, phone: e.target.value }))
  }, [])
  const handleOrganizationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, organization_name: e.target.value }))
  }, [])
  if (authLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Your basic account information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <MemoizedInput
                  id="firstName"
                  value={formData.first_name}
                  onChange={handleFirstNameChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <MemoizedInput
                  id="lastName"
                  value={formData.last_name}
                  onChange={handleLastNameChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <MemoizedInput
                id="email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <MemoizedInput
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                disabled={!isEditing}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization (Optional)</Label>
              <MemoizedInput
                id="organization"
                value={formData.organization_name}
                onChange={handleOrganizationChange}
                disabled={!isEditing}
                placeholder="Your company or organization"
              />
            </div>
          </CardContent>
        </Card>
        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Account Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Onboarding</span>
              <Badge variant={dashboardData.onboardingStatus.isCompleted ? "default" : "secondary"}>
                {dashboardData.onboardingStatus.isCompleted ? "Complete" : "In Progress"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email Verified</span>
              <Badge variant={user?.email_confirmed_at ? "default" : "destructive"}>
                {user?.email_confirmed_at ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Created</span>
              <span className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Progress Summary</h4>
              <div className="text-sm text-muted-foreground">
                <p>• Setup: {dashboardData.onboardingStatus.progressPercentage}% complete</p>
                <p>• Documents: {dashboardData.stats.documentsUploaded} uploaded</p>
                <p>• Tasks: {dashboardData.stats.tasksCompleted} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
