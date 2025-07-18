'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bot,
  Users,
  Phone,
  Settings,
  CheckSquare,
  ArrowRight,
  Rocket,
  Clock,
  TrendingUp,
  Building2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'
interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: any
  completed: boolean
  href?: string
  estimatedTime: string
  difficulty: 'Easy' | 'Medium' | 'Advanced'
}

interface OnboardingSection {
  id: string
  title: string
  description: string
  steps: OnboardingStep[]
  progress: number
}

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  // Onboarding sections and steps
  const onboardingSections: OnboardingSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Essential first steps to set up your ZyxAI voice platform',
      progress: 0,
      steps: [
        {
          id: 'profile-setup',
          title: 'Complete Your Profile',
          description: 'Set up your organization profile and preferences',
          icon: Building2,
          completed: false,
          href: '/settings/profile',
          estimatedTime: '5 min',
          difficulty: 'Easy'
        },
        {
          id: 'team-setup',
          title: 'Invite Team Members',
          description: 'Add colleagues to collaborate on voice campaigns',
          icon: Users,
          completed: false,
          href: '/dashboard/team',
          estimatedTime: '10 min',
          difficulty: 'Easy'
        },
        {
          id: 'first-agent',
          title: 'Create Your First AI Agent',
          description: 'Build your first voice AI agent using our templates',
          icon: Bot,
          completed: false,
          href: '/dashboard/agents',
          estimatedTime: '15 min',
          difficulty: 'Medium'
        },
        {
          id: 'phone-number',
          title: 'Get a Phone Number',
          description: 'Acquire a phone number for your voice campaigns',
          icon: Phone,
          completed: false,
          href: '/dashboard/phone-numbers',
          estimatedTime: '5 min',
          difficulty: 'Easy'
        }
      ]
    }
  ]
  useEffect(() => {
    // Load completed steps from localStorage
    const saved = localStorage.getItem('zyxai-onboarding-progress')
    if (saved) {
      setCompletedSteps(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const markStepComplete = (stepId: string) => {
    const newCompleted = [...completedSteps, stepId]
    setCompletedSteps(newCompleted)
    localStorage.setItem('zyxai-onboarding-progress', JSON.stringify(newCompleted))
  }

  const resetProgress = () => {
    setCompletedSteps([])
    localStorage.removeItem('zyxai-onboarding-progress')
  }

  // Calculate progress for each section
  const sectionsWithProgress = onboardingSections.map(section => ({
    ...section,
    progress: Math.round((section.steps.filter(step => completedSteps.includes(step.id)).length / section.steps.length) * 100),
    steps: section.steps.map(step => ({
      ...step,
      completed: completedSteps.includes(step.id)
    }))
  }))

  const overallProgress = Math.round(
    (completedSteps.length / onboardingSections.reduce((acc, section) => acc + section.steps.length, 0)) * 100
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Show loading for onboarding data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading onboarding guide...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to ZyxAI!</h1>
          <p className="text-muted-foreground">
            Get started with your AI voice platform in just a few steps
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetProgress}>
            <Settings className="w-4 h-4 mr-2" />
            Reset Progress
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            <Rocket className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Onboarding Progress
          </CardTitle>
          <CardDescription>
            Complete these steps to get the most out of ZyxAI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{completedSteps.length} of {onboardingSections.reduce((acc, section) => acc + section.steps.length, 0)} steps completed</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started Steps</CardTitle>
          <CardDescription>Complete these essential steps to set up your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectionsWithProgress[0].steps.map((step) => (
              <div
                key={step.id}
                className={`p-4 border rounded-lg transition-all ${
                  step.completed
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    : 'hover:bg-accent/50 border-border'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    step.completed
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.completed ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{step.title}</h4>
                      <Badge className={getDifficultyColor(step.difficulty)} variant="secondary">
                        {step.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {step.estimatedTime}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {step.description}
                    </p>
                    <div className="flex gap-2">
                      {step.href && (
                        <Button
                          size="sm"
                          variant={step.completed ? "secondary" : "default"}
                          onClick={() => {
                            if (!step.completed) markStepComplete(step.id)
                            router.push(step.href!)
                          }}
                        >
                          {step.completed ? (
                            <>
                              <CheckSquare className="w-4 h-4 mr-2" />
                              Review
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Start
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

