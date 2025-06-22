'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Building2,
  Users,
  Workflow,
  FileText,
  Shield,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Settings,
  BarChart3,
  Target,
  DollarSign,
  Clock,
  Award,
  Zap,
  RefreshCw
} from 'lucide-react'

interface IndustrySolutionsDashboardProps {
  organizationId: string
}

export function IndustrySolutionsDashboard({ organizationId }: IndustrySolutionsDashboardProps) {
  const [solutions, setSolutions] = useState<any>(null)
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    loadDemoData()
  }, [])

  const loadDemoData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/demo-industry-solutions')
      
      if (response.ok) {
        const data = await response.json()
        setSolutions(data.industry_solutions)
        setShowDemo(true)
      }
    } catch (error) {
      console.error('Failed to load demo data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateROI = async (industry: string) => {
    try {
      const response = await fetch('/api/demo-industry-solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate_roi',
          industry
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('ROI calculated:', data)
      }
    } catch (error) {
      console.error('Failed to calculate ROI:', error)
    }
  }

  const getIndustryIcon = (industryId: string) => {
    const icons: Record<string, string> = {
      real_estate: '🏠',
      healthcare: '🏥',
      insurance: '🛡️',
      financial_services: '💰',
      ecommerce: '🛒'
    }
    return icons[industryId] || '🏢'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Industry Solutions</h1>
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!showDemo || !solutions) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Industry Solutions</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-blue-500 mb-6" />
            <h3 className="text-2xl font-semibold mb-4">Industry-Specific Voice Automation</h3>
            <p className="text-muted-foreground text-center max-w-2xl mb-6">
              Specialized voice agents and workflows designed for specific industries with 
              built-in compliance, proven templates, and industry expertise.
            </p>
            <Button onClick={loadDemoData} size="lg">
              <Building2 className="h-4 w-4 mr-2" />
              Explore Industry Solutions
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Industry Solutions</h1>
          <p className="text-muted-foreground">
            Specialized voice automation solutions for your industry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Demo Mode</Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industries</p>
                <p className="text-2xl font-bold">{solutions.overview.total_industries}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Specialized Agents</p>
                <p className="text-2xl font-bold">{solutions.overview.total_agents}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Workflows</p>
                <p className="text-2xl font-bold">{solutions.overview.total_workflows}</p>
              </div>
              <Workflow className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Stories</p>
                <p className="text-2xl font-bold">{solutions.overview.success_stories}</p>
              </div>
              <Award className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="industries" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="success-stories">Success Stories</TabsTrigger>
          <TabsTrigger value="roi-calculator">ROI Calculator</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
        </TabsList>

        <TabsContent value="industries" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {solutions.industries.map((industry: any) => (
              <Card key={industry.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{industry.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{industry.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {industry.agents} agents • {industry.workflows} workflows
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIndustry(industry.id)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {industry.description}
                  </p>

                  {/* Success Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {Object.entries(industry.success_metrics).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-lg font-bold text-green-600">{value as string}</p>
                        <p className="text-xs text-muted-foreground">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Featured Agents */}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium">Featured Agents:</h4>
                    {industry.featured_agents.slice(0, 2).map((agent: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{agent.name}</span>
                        <Badge variant="outline">{agent.success_rate}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Compliance Badges */}
                  {industry.compliance && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {industry.compliance.slice(0, 2).map((comp: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      size="sm"
                      onClick={() => calculateROI(industry.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Get Started
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="success-stories" className="space-y-6">
          <div className="grid gap-6">
            {solutions.success_stories.map((story: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{getIndustryIcon(story.industry.toLowerCase().replace(' ', '_'))}</span>
                        {story.company}
                      </CardTitle>
                      <CardDescription>{story.industry} • {story.challenge}</CardDescription>
                    </div>
                    <Badge variant="default">Success Story</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Solution Implemented:</h4>
                      <p className="text-sm text-muted-foreground mb-4">{story.solution}</p>
                      
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-sm">
                        "{story.testimonial}"
                      </blockquote>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Results Achieved:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(story.results).map(([key, value]) => (
                          <div key={key} className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-lg font-bold text-green-600">{value as string}</p>
                            <p className="text-xs text-muted-foreground">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roi-calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                ROI Calculator
              </CardTitle>
              <CardDescription>
                Calculate your potential return on investment by industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(solutions.roi_calculator).map(([industry, data]: [string, any]) => (
                  <Card key={industry} className="border-2 hover:border-blue-500 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="text-2xl">{getIndustryIcon(industry)}</span>
                        {industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Monthly ROI:</span>
                          <span className="font-bold text-green-600">{formatCurrency(data.monthly_roi)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Annual ROI:</span>
                          <span className="font-bold text-green-600">{formatCurrency(data.annual_roi)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Improvement:</span>
                          <span className="font-bold text-blue-600">
                            {Math.round(data.conversion_improvement * 100)}%
                          </span>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={() => calculateROI(industry)}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Calculate My ROI
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Implementation Timeline
              </CardTitle>
              <CardDescription>
                4-week implementation process for industry solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(solutions.implementation_timeline).map(([week, data]: [string, any], index) => (
                  <div key={week} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      {index < 3 && <div className="w-px h-16 bg-gray-200 mt-2"></div>}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{data.title}</h3>
                      <div className="grid md:grid-cols-2 gap-2">
                        {data.tasks.map((task: string, taskIndex: number) => (
                          <div key={taskIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Competitive Advantages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {solutions.competitive_advantages.map((advantage: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{advantage.feature}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{advantage.description}</p>
                    <p className="text-sm font-medium text-green-600">{advantage.benefit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
