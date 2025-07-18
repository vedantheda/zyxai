/**
 * Working Dashboard Component
 * Reliable dashboard that doesn't get stuck in loading loops
 */

'use client'

import { memo, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Phone, 
  Users, 
  BarChart3, 
  TrendingUp, 
  Activity,
  Plus,
  Settings,
  Zap,
  ArrowRight
} from '@/lib/optimization/IconOptimizer'

// Simple stat card component
const StatCard = memo(({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = 'stable'
}: {
  title: string
  value: string | number
  change?: string
  icon: any
  trend?: 'up' | 'down' | 'stable'
}) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  const TrendIcon = trend === 'up' ? TrendingUp : Activity

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {change && (
          <div className={`flex items-center text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4 mr-1" />
            {change}
          </div>
        )}
      </div>
    </Card>
  )
})

StatCard.displayName = 'StatCard'

// Quick action button component
const QuickActionButton = memo(({ 
  icon: Icon, 
  title, 
  description, 
  href,
  onClick 
}: {
  icon: any
  title: string
  description: string
  href?: string
  onClick?: () => void
}) => (
  <Button 
    className="w-full justify-start h-16 text-left p-4 group" 
    variant="outline"
    onClick={onClick || (() => href && (window.location.href = href))}
  >
    <Icon className="h-6 w-6 mr-4 flex-shrink-0" />
    <div className="flex-1">
      <div className="font-medium text-base">{title}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  </Button>
))

QuickActionButton.displayName = 'QuickActionButton'

// Main dashboard component
export const WorkingDashboard = memo(() => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg font-medium mb-2">Loading Dashboard</div>
          <div className="text-muted-foreground">Setting up your workspace...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">
                Welcome to ZyxAI
              </h1>
              <p className="text-muted-foreground text-lg">
                Your AI voice platform is ready to transform your business communications.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </div>
          </div>
          
          {/* Status Banner */}
          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">System Online</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">All services are running smoothly</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
                <Badge variant="outline" className="border-green-600 text-green-600">
                  Free Plan
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Contacts"
            value="0"
            change="Ready to import"
            icon={Users}
            trend="stable"
          />
          <StatCard
            title="AI Agents"
            value="0"
            change="Create your first"
            icon={Brain}
            trend="stable"
          />
          <StatCard
            title="Voice Calls"
            value="0"
            change="Start calling"
            icon={Phone}
            trend="stable"
          />
          <StatCard
            title="Success Rate"
            value="--"
            change="No data yet"
            icon={BarChart3}
            trend="stable"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Getting Started */}
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 flex items-center">
                <Zap className="h-6 w-6 mr-3 text-blue-600" />
                Quick Start Guide
              </h2>
              <p className="text-muted-foreground">
                Get your AI voice platform up and running in minutes
              </p>
            </div>
            <div className="space-y-4">
              <QuickActionButton
                icon={Brain}
                title="Create Your First AI Agent"
                description="Set up an intelligent voice assistant for your business"
                href="/dashboard/agents"
              />
              <QuickActionButton
                icon={Users}
                title="Import Contact Lists"
                description="Upload your customer database to start outreach"
                href="/dashboard/contacts"
              />
              <QuickActionButton
                icon={Phone}
                title="Make a Test Call"
                description="Try out your agent with a demo conversation"
                href="/dashboard/calls/demo"
              />
              <QuickActionButton
                icon={Settings}
                title="Configure Settings"
                description="Customize your platform preferences"
                href="/dashboard/settings"
              />
            </div>
          </Card>

          {/* Platform Overview */}
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 flex items-center">
                <BarChart3 className="h-6 w-6 mr-3 text-purple-600" />
                Platform Overview
              </h2>
              <p className="text-muted-foreground">
                Monitor your AI voice platform performance
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-medium">AI Agents</div>
                  <div className="text-sm text-muted-foreground">Intelligent voice assistants</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-medium">Voice Calls</div>
                  <div className="text-sm text-muted-foreground">Automated outreach</div>
                </div>
              </div>

              {/* Activity placeholder */}
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Your platform activity and analytics will appear here
                </p>
                <Button size="sm" variant="outline">
                  View Analytics
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="mt-8 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 mx-auto mb-6">
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mt-1" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Ready to Transform Your Business?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of businesses using AI voice technology to automate calls, 
              improve customer engagement, and drive growth.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.href = '/dashboard/agents'}
              >
                <Brain className="h-5 w-5 mr-2" />
                Create First Agent
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.href = '/onboarding'}
              >
                <Zap className="h-5 w-5 mr-2" />
                Start Tutorial
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
})

WorkingDashboard.displayName = 'WorkingDashboard'
