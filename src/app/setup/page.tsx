'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Clock,
  Users,
  Phone,
  Settings,
  Rocket
} from 'lucide-react'
import { getAllIndustryTemplates, getIndustryTemplate, type IndustryTemplate } from '@/lib/templates/IndustryTemplates'
import { useRouter } from 'next/navigation'

interface SetupState {
  selectedIndustry: string | null
  companyInfo: {
    name: string
    phone: string
    website: string
    address: string
  }
  customization: {
    agentNames: Record<string, string>
    companyGreeting: string
    businessHours: string
  }
  integrations: {
    crm: string
    calendar: string
    phoneSystem: string
  }
  testingComplete: boolean
}

export default function SetupWizardPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [setupState, setSetupState] = useState<SetupState>({
    selectedIndustry: null,
    companyInfo: {
      name: '',
      phone: '',
      website: '',
      address: ''
    },
    customization: {
      agentNames: {},
      companyGreeting: '',
      businessHours: '9 AM - 5 PM EST'
    },
    integrations: {
      crm: '',
      calendar: '',
      phoneSystem: ''
    },
    testingComplete: false
  })
  const [loading, setLoading] = useState(false)

  const industries = getAllIndustryTemplates()
  const selectedTemplate = setupState.selectedIndustry ? getIndustryTemplate(setupState.selectedIndustry) : null

  const steps = [
    { id: 'industry', title: 'Choose Industry', description: 'Select your industry template' },
    { id: 'company', title: 'Company Info', description: 'Set up your business details' },
    { id: 'customize', title: 'Customize Agents', description: 'Personalize your AI agents' },
    { id: 'integrations', title: 'Integrations', description: 'Connect your tools' },
    { id: 'test', title: 'Test & Launch', description: 'Verify everything works' }
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleIndustrySelect = (industryId: string) => {
    setSetupState(prev => ({
      ...prev,
      selectedIndustry: industryId
    }))
  }

  const handleCompanyInfoChange = (field: string, value: string) => {
    setSetupState(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value
      }
    }))
  }

  const handleCustomizationChange = (field: string, value: string) => {
    setSetupState(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        [field]: value
      }
    }))
  }

  const handleAgentNameChange = (agentId: string, name: string) => {
    setSetupState(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        agentNames: {
          ...prev.customization.agentNames,
          [agentId]: name
        }
      }
    }))
  }

  const handleFinishSetup = async () => {
    if (!setupState.selectedIndustry || !setupState.companyInfo.name || !setupState.companyInfo.phone) {
      alert('Please complete all required fields')
      return
    }

    setLoading(true)
    try {
      console.log('🚀 Deploying template:', setupState.selectedIndustry)

      // Deploy the template using the API
      const response = await fetch('/api/templates/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industryId: setupState.selectedIndustry,
          companyInfo: setupState.companyInfo,
          customization: setupState.customization,
          integrations: setupState.integrations
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Template deployment failed')
      }

      if (result.success) {
        console.log('✅ Template deployed successfully:', result.deployment)

        // Show success message
        alert(`Success! Created ${result.deployment.summary.agentsCreated} agents and ${result.deployment.summary.campaignsCreated} campaigns.`)

        // Redirect to dashboard with success message
        router.push('/dashboard?setup=complete&template=' + setupState.selectedIndustry)
      } else {
        throw new Error(result.error || 'Template deployment failed')
      }
    } catch (error: any) {
      console.error('Setup failed:', error)
      alert('Setup failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return setupState.selectedIndustry !== null
      case 1: return setupState.companyInfo.name && setupState.companyInfo.phone
      case 2: return true // Customization is optional
      case 3: return true // Integrations are optional
      case 4: return true
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to ZyxAI! 🚀</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Let's get your voice AI automation set up in just 5 minutes
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge variant="outline" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                5 minutes setup
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Industry-specific
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Ready to use
              </Badge>
            </div>
            <Progress value={progress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription>
                {steps[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 0: Industry Selection */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Choose Your Industry Template</h3>
                    <p className="text-muted-foreground">
                      Select the template that best matches your business. Each includes pre-built agents, campaigns, and workflows.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {industries.map((industry) => (
                      <Card
                        key={industry.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          setupState.selectedIndustry === industry.id
                            ? 'ring-2 ring-primary border-primary'
                            : ''
                        }`}
                        onClick={() => handleIndustrySelect(industry.id)}
                      >
                        <CardHeader className="text-center">
                          <div className="text-4xl mb-2">{industry.icon}</div>
                          <CardTitle className="text-lg">{industry.name}</CardTitle>
                          <CardDescription>{industry.industry}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {industry.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Agents:</span>
                              <Badge variant="secondary">{industry.agents.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Campaigns:</span>
                              <Badge variant="secondary">{industry.campaigns.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Price:</span>
                              <Badge variant="outline">${industry.pricing?.monthlyPrice}/mo</Badge>
                            </div>
                          </div>
                          {setupState.selectedIndustry === industry.id && (
                            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                              <div className="flex items-center gap-2 text-primary">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Selected</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Company Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Company Information</h3>
                    <p className="text-muted-foreground">
                      This information will be used to personalize your AI agents and campaigns.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name *</Label>
                      <Input
                        id="company-name"
                        placeholder="Your Company Name"
                        value={setupState.companyInfo.name}
                        onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-phone">Business Phone *</Label>
                      <Input
                        id="company-phone"
                        placeholder="+1 (555) 123-4567"
                        value={setupState.companyInfo.phone}
                        onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-website">Website</Label>
                      <Input
                        id="company-website"
                        placeholder="https://yourcompany.com"
                        value={setupState.companyInfo.website}
                        onChange={(e) => handleCompanyInfoChange('website', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-address">Business Address</Label>
                      <Input
                        id="company-address"
                        placeholder="123 Main St, City, State"
                        value={setupState.companyInfo.address}
                        onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Customize Agents */}
              {currentStep === 2 && selectedTemplate && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Customize Your AI Agents</h3>
                    <p className="text-muted-foreground">
                      Personalize your agents with your company branding and preferences.
                    </p>
                  </div>
                  <div className="space-y-6">
                    {selectedTemplate.agents.map((agent) => (
                      <Card key={agent.id}>
                        <CardHeader>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <CardDescription>{agent.role}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`agent-name-${agent.id}`}>Agent Name</Label>
                              <Input
                                id={`agent-name-${agent.id}`}
                                placeholder={agent.name}
                                value={setupState.customization.agentNames[agent.id] || agent.name}
                                onChange={(e) => handleAgentNameChange(agent.id, e.target.value)}
                              />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <strong>Role:</strong> {agent.role}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <strong>Voice:</strong> {agent.voice.voiceId}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-greeting">Company Greeting</Label>
                        <Input
                          id="company-greeting"
                          placeholder="Thank you for calling [COMPANY_NAME]"
                          value={setupState.customization.companyGreeting}
                          onChange={(e) => handleCustomizationChange('companyGreeting', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business-hours">Business Hours</Label>
                        <Input
                          id="business-hours"
                          placeholder="9 AM - 5 PM EST"
                          value={setupState.customization.businessHours}
                          onChange={(e) => handleCustomizationChange('businessHours', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Integrations */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Connect Your Tools</h3>
                    <p className="text-muted-foreground">
                      Integrate with your existing systems (optional - you can set these up later).
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">CRM Integration</CardTitle>
                        <CardDescription>Connect your customer database</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full justify-start">
                            HubSpot
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            Salesforce
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            Pipedrive
                          </Button>
                          <Button variant="ghost" className="w-full text-muted-foreground">
                            Skip for now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Calendar Integration</CardTitle>
                        <CardDescription>Sync appointments and scheduling</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full justify-start">
                            Google Calendar
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            Outlook Calendar
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            Calendly
                          </Button>
                          <Button variant="ghost" className="w-full text-muted-foreground">
                            Skip for now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 4: Test & Launch */}
              {currentStep === 4 && selectedTemplate && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Ready to Launch! 🚀</h3>
                    <p className="text-muted-foreground">
                      Your {selectedTemplate.name} template is configured and ready to go.
                    </p>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Setup Complete!</strong> Your AI agents are configured with your company information and ready to start making calls.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">What's Included</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{selectedTemplate.agents.length} AI Agents configured</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{selectedTemplate.campaigns.length} Campaign templates</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Industry-specific scripts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Automated workflows</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Import your contacts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Create your first campaign</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Rocket className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Start making calls!</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinishSetup}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Setting up...' : 'Launch ZyxAI'}
                <Rocket className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
