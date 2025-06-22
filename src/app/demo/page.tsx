'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bot, 
  Phone, 
  Users, 
  BarChart3, 
  Settings,
  Rocket,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react'

export default function DemoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const demoStats = {
    totalAgents: 3,
    activeCampaigns: 2,
    totalCalls: 156,
    successRate: 68
  }

  const handleDemoAction = async (action: string) => {
    setLoading(true)
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    switch (action) {
      case 'setup':
        router.push('/setup')
        break
      case 'agents':
        router.push('/dashboard/agents')
        break
      case 'contacts':
        router.push('/test-templates')
        break
      case 'campaigns':
        router.push('/dashboard/campaigns')
        break
      default:
        break
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">🚀 ZyxAI Demo Mode</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Experience the full ZyxAI platform without authentication
            </p>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Demo Environment - No Login Required
            </Badge>
          </div>

          {/* Demo Alert */}
          <Alert className="mb-8">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode Active:</strong> You can test all features without creating an account. 
              Data is temporary and will reset between sessions.
            </AlertDescription>
          </Alert>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{demoStats.totalAgents}</div>
                <p className="text-xs text-muted-foreground">Ready to make calls</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{demoStats.activeCampaigns}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{demoStats.totalCalls}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{demoStats.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+5%</span> from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Demo Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Template Deployment */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Deploy Industry Template
                </CardTitle>
                <CardDescription>
                  Start with pre-built Real Estate, Insurance, or Healthcare templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    ✅ Creates real VAPI voice agents<br/>
                    ✅ Industry-specific scripts and workflows<br/>
                    ✅ Ready to use in 5 minutes
                  </div>
                  <Button 
                    onClick={() => handleDemoAction('setup')} 
                    disabled={loading}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Try Template Deployment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Agent Management */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Create Custom Agents
                </CardTitle>
                <CardDescription>
                  Build your own AI voice agents with custom personalities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    ✅ Custom voice and personality settings<br/>
                    ✅ Real VAPI integration<br/>
                    ✅ Professional agent creation wizard
                  </div>
                  <Button 
                    onClick={() => handleDemoAction('agents')} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Try Agent Creation
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Management */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contact Management
                </CardTitle>
                <CardDescription>
                  Import contacts and manage your call lists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    ✅ CSV import functionality<br/>
                    ✅ Contact list organization<br/>
                    ✅ Database setup and testing
                  </div>
                  <Button 
                    onClick={() => handleDemoAction('contacts')} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Try Contact Import
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Execution */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Campaign Execution
                </CardTitle>
                <CardDescription>
                  Create and run voice call campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    ✅ Real campaign creation<br/>
                    ✅ VAPI call execution<br/>
                    ✅ Live campaign monitoring
                  </div>
                  <Button 
                    onClick={() => handleDemoAction('campaigns')} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Try Campaign Management
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Start Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Demo Quick Start Guide
              </CardTitle>
              <CardDescription>
                Follow these steps to experience the full ZyxAI workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-semibold">1</span>
                  </div>
                  <h3 className="font-medium mb-1">Deploy Template</h3>
                  <p className="text-sm text-muted-foreground">Choose Real Estate and deploy agents</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-semibold">2</span>
                  </div>
                  <h3 className="font-medium mb-1">Setup Database</h3>
                  <p className="text-sm text-muted-foreground">Run database setup for contacts</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-semibold">3</span>
                  </div>
                  <h3 className="font-medium mb-1">Import Contacts</h3>
                  <p className="text-sm text-muted-foreground">Add contacts via CSV import</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-semibold">4</span>
                  </div>
                  <h3 className="font-medium mb-1">Run Campaign</h3>
                  <p className="text-sm text-muted-foreground">Create and execute voice campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
