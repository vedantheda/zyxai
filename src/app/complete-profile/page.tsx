'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Brain } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { OrganizationService } from '@/lib/services/OrganizationService'

export default function CompleteProfilePage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    organizationSlug: '',
    organizationDescription: '',
    organizationIndustry: '',
    organizationWebsite: '',
    organizationPhone: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { user, session, loading, needsProfileCompletion, completeProfile } = useAuth()

  // Auto-generate slug from organization name
  const handleOrgNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      organizationName: value,
      organizationSlug: prev.organizationSlug === OrganizationService.generateSlug(prev.organizationName) 
        ? OrganizationService.generateSlug(value)
        : prev.organizationSlug
    }))
  }

  // Pre-fill form with auth user data
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        firstName: session.user.user_metadata?.first_name || '',
        lastName: session.user.user_metadata?.last_name || '',
        organizationName: session.user.user_metadata?.organization_name || ''
      }))
    }
  }, [session])

  // Redirect if profile is already complete
  useEffect(() => {
    if (!loading && user && !needsProfileCompletion) {
      router.replace('/dashboard')
    }
  }, [user, loading, needsProfileCompletion, router])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.replace('/signin')
    }
  }, [session, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!session?.user) {
      setError('No authenticated user found')
      setIsLoading(false)
      return
    }

    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.organizationName.trim()) {
      setError('First name, last name, and organization name are required')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          organizationName: formData.organizationName.trim(),
          organizationSlug: formData.organizationSlug.trim() || undefined,
          organizationDescription: formData.organizationDescription.trim() || undefined,
          organizationIndustry: formData.organizationIndustry || undefined,
          organizationWebsite: formData.organizationWebsite.trim() || undefined,
          organizationPhone: formData.organizationPhone.trim() || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to complete profile')
        setIsLoading(false)
        return
      }

      setSuccess('Profile completed successfully!')
      
      // Refresh the auth context to load the new profile
      await completeProfile()
      
      // Redirect to dashboard
      setTimeout(() => {
        router.replace('/dashboard')
      }, 1000)

    } catch (error: any) {
      console.error('Profile completion error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or profile is complete
  if (!session || (user && !needsProfileCompletion)) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">ZyxAI</h1>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Complete Your Profile</h2>
          <p className="text-muted-foreground">Set up your organization to get started</p>
        </div>

        {/* Profile Completion Form */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Setup</CardTitle>
            <CardDescription>
              Complete your profile to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  placeholder="Your Company LLC"
                  value={formData.organizationName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationSlug">Organization URL Slug</Label>
                <Input
                  id="organizationSlug"
                  placeholder="your-company"
                  value={formData.organizationSlug}
                  onChange={(e) => handleInputChange('organizationSlug', e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in your organization's URL: zyxai.com/{formData.organizationSlug || 'your-company'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationIndustry">Industry (Optional)</Label>
                <Select
                  value={formData.organizationIndustry}
                  onValueChange={(value) => handleInputChange('organizationIndustry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Profile...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
