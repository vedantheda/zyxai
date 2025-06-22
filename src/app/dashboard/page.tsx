'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VoiceWidget } from '@/components/voice/VoiceWidget'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Phone,
  Bot,
  TrendingUp,
  Building2,
  Plus,
  Settings,
  Zap,
  Target,
  BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { OrganizationService } from '@/lib/services/OrganizationService'
import { Organization, User } from '@/types/database'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeCampaigns: 0,
    totalCalls: 0,
    successRate: 0
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const { organization, user: userData, error } = await OrganizationService.getUserOrganization(authUser.id)

      if (error) {
        setError(error)
        return
      }

      if (!organization || !userData) {
        // User doesn't have an organization, redirect to signup
        router.push('/signup/organization')
        return
      }

      setOrganization(organization)
      setUser(userData)

      // Load stats (mock data for now)
      setStats({
        totalAgents: 3,
        activeCampaigns: 2,
        totalCalls: 156,
        successRate: 68
      })
    } catch (err) {
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.first_name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {organization?.name} • {user?.role}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button onClick={() => router.push('/dashboard/agents')}>
              <Bot className="mr-2 h-4 w-4" />
              Manage Agents
            </Button>
          </div>
      </div>

      {/* Organization Info */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Organization Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-foreground">{organization?.name}</h3>
                <p className="text-sm text-muted-foreground">{organization?.description || 'No description'}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant={organization?.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {organization?.subscription_status}
                  </Badge>
                  <Badge variant="outline">
                    {organization?.subscription_tier}
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">Industry</h4>
                <p className="text-sm text-muted-foreground">{organization?.industry || 'Not specified'}</p>
                <h4 className="text-sm font-medium text-foreground mt-3">Website</h4>
                <p className="text-sm text-muted-foreground">{organization?.website || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">Trial Status</h4>
                <p className="text-sm text-muted-foreground">
                  {organization?.trial_ends_at
                    ? `Ends ${new Date(organization.trial_ends_at).toLocaleDateString()}`
                    : 'No trial'
                  }
                </p>
                <h4 className="text-sm font-medium text-foreground mt-3">Phone</h4>
                <p className="text-sm text-muted-foreground">{organization?.phone || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                Ready to make calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalls}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5%</span> from last month
              </p>
            </CardContent>
          </Card>
      </div>

      {/* Getting Started */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Get Started with ZyxAI</span>
            </CardTitle>
            <CardDescription>
              Set up your AI voice automation in a few simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">1</span>
                  </div>
                  <h3 className="font-medium text-foreground">Choose Your Niche</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Select your business industry to get pre-built AI agents
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/onboarding/niche')}
                >
                  Select Niche
                </Button>
              </div>

              <div className="p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">2</span>
                  </div>
                  <h3 className="font-medium text-foreground">Configure Agents</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Customize your AI agents' personalities and scripts
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/agents')}
                >
                  Manage Agents
                </Button>
              </div>

              <div className="p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">3</span>
                  </div>
                  <h3 className="font-medium text-foreground">Import Contacts</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Add your customer contacts to start making calls
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/contacts')}
                >
                  Manage Contacts
                </Button>
              </div>
            </div>
          </CardContent>
      </Card>

      {/* Voice Testing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Voice Assistant Test
            </CardTitle>
            <CardDescription>
              Test your voice agents with live conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Click the button below to start a voice conversation with your AI agent.
                This uses your browser's microphone and speakers.
              </div>

              {/* Voice Widget */}
              <VoiceWidget
                assistantId="demo-assistant" // This would be dynamic based on selected agent
                variant="card"
                onCallStart={() => console.log('Call started')}
                onCallEnd={() => console.log('Call ended')}
                onMessage={(message) => console.log('Message:', message)}
              />

              <div className="text-xs text-muted-foreground">
                Note: Make sure your microphone is enabled and you're in a quiet environment for best results.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Voice Analytics
            </CardTitle>
            <CardDescription>
              Real-time voice call performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-muted-foreground">Total Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Duration</span>
                  <span>0:00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Cost</span>
                  <span>$0.00</span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Detailed Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>No activity yet. Set up your first AI agent to get started!</p>
            </div>
          </CardContent>
      </Card>
    </div>
  )
}




