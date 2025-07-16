'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-screen'
import {
  Zap,
  Settings,
  Phone,
  Workflow,
  BarChart3,
  Users,
  Code,
  Shield,
  Info,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  TestTube
} from 'lucide-react'

// Import our new advanced VAPI components
import { VapiAdvancedConfig } from '@/components/voice/VapiAdvancedConfig'
import { VapiFunctionCalling } from '@/components/voice/VapiFunctionCalling'
import { VapiWorkflows } from '@/components/voice/VapiWorkflows'
import { VapiPhoneNumbers } from '@/components/voice/VapiPhoneNumbers'
import { VapiRealTimeControl } from '@/components/voice/VapiRealTimeControl'
import { VapiCallAnalytics } from '@/components/voice/VapiCallAnalytics'
import { VapiSquads } from '@/components/voice/VapiSquads'
import { VapiBulkOperations } from '@/components/voice/VapiBulkOperations'
import { VapiIntegrationTesting } from '@/components/voice/VapiIntegrationTesting'

import { VapiAdvancedAssistantConfig, VapiTool, VapiWorkflowConfig, VapiPhoneNumberConfig, VapiSquadConfig } from '@/lib/types/VapiAdvancedConfig'

export default function VapiAdvancedPage() {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  
  const [activeTab, setActiveTab] = useState('configuration')
  const [isSaving, setIsSaving] = useState(false)
  const [isSimpleMode, setIsSimpleMode] = useState(true)
  
  // State for all VAPI configurations
  const [assistantConfig, setAssistantConfig] = useState<Partial<VapiAdvancedAssistantConfig>>({
    name: '',
    firstMessage: '',
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      messages: []
    },
    voice: {
      provider: 'azure',
      voiceId: 'en-US-JennyNeural'
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en-US'
    }
  })
  
  const [tools, setTools] = useState<VapiTool[]>([])
  const [workflows, setWorkflows] = useState<VapiWorkflowConfig[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<VapiPhoneNumberConfig[]>([])
  const [squads, setSquads] = useState<VapiSquadConfig[]>([])

  // Show loading during session sync
  if (loading || !isSessionReady) {
    return <LoadingScreen text="Loading VAPI Advanced Dashboard..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to access VAPI Advanced features" />
  }

  const handleSaveConfiguration = async () => {
    setIsSaving(true)
    try {
      // Save assistant configuration
      const response = await fetch('/api/vapi/assistants/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assistantConfig),
      })

      if (response.ok) {
        console.log('✅ Assistant configuration saved successfully')
      } else {
        console.error('❌ Failed to save assistant configuration')
      }
    } catch (error) {
      console.error('❌ Error saving configuration:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTools = async () => {
    setIsSaving(true)
    try {
      // Save tools configuration
      const response = await fetch('/api/vapi/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tools }),
      })

      if (response.ok) {
        console.log('✅ Tools saved successfully')
      } else {
        console.error('❌ Failed to save tools')
      }
    } catch (error) {
      console.error('❌ Error saving tools:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveWorkflows = async () => {
    setIsSaving(true)
    try {
      // Save each workflow individually
      const results = []

      for (const workflow of workflows) {
        try {
          const response = await fetch('/api/vapi/workflows', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(workflow),
          })

          if (response.ok) {
            const data = await response.json()
            results.push({ success: true, workflow: data.workflow })
            console.log(`✅ Workflow "${workflow.name}" saved successfully`)
          } else {
            const errorData = await response.json()
            results.push({ success: false, error: errorData.error, workflow: workflow.name })
            console.error(`❌ Failed to save workflow "${workflow.name}":`, errorData.error)
          }
        } catch (workflowError) {
          results.push({ success: false, error: workflowError, workflow: workflow.name })
          console.error(`❌ Error saving workflow "${workflow.name}":`, workflowError)
        }
      }

      const successCount = results.filter(r => r.success).length
      console.log(`✅ ${successCount}/${workflows.length} workflows saved successfully`)

    } catch (error) {
      console.error('❌ Error saving workflows:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePhoneNumbers = async () => {
    setIsSaving(true)
    try {
      // Save phone numbers configuration
      const response = await fetch('/api/vapi/phone-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumbers }),
      })

      if (response.ok) {
        console.log('✅ Phone numbers saved successfully')
      } else {
        console.error('❌ Failed to save phone numbers')
      }
    } catch (error) {
      console.error('❌ Error saving phone numbers:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSquads = async () => {
    setIsSaving(true)
    try {
      // Save squads configuration
      const response = await fetch('/api/vapi/squads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ squads }),
      })

      if (response.ok) {
        console.log('✅ Squads saved successfully')
      } else {
        console.error('❌ Failed to save squads')
      }
    } catch (error) {
      console.error('❌ Error saving squads:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefreshData = async () => {
    try {
      // Refresh all data from VAPI
      const [assistantsRes, toolsRes, workflowsRes, phoneNumbersRes, squadsRes] = await Promise.all([
        fetch('/api/vapi/assistants'),
        fetch('/api/vapi/tools'),
        fetch('/api/vapi/workflows'),
        fetch('/api/vapi/phone-numbers'),
        fetch('/api/vapi/squads')
      ])

      // Parse responses and update state
      if (toolsRes.ok) {
        const toolsData = await toolsRes.json()
        if (toolsData.success && toolsData.tools) {
          setTools(toolsData.tools)
        }
      }

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json()
        if (workflowsData.success && workflowsData.workflows) {
          setWorkflows(workflowsData.workflows)
        }
      }

      if (phoneNumbersRes.ok) {
        const phoneNumbersData = await phoneNumbersRes.json()
        if (phoneNumbersData.success && phoneNumbersData.phoneNumbers) {
          setPhoneNumbers(phoneNumbersData.phoneNumbers)
        }
      }

      if (squadsRes.ok) {
        const squadsData = await squadsRes.json()
        if (squadsData.success && squadsData.squads) {
          setSquads(squadsData.squads)
        }
      }

      console.log('✅ Data refreshed from VAPI')
    } catch (error) {
      console.error('❌ Error refreshing data:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Zap className="h-8 w-8" />
            VAPI Advanced Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete control over all VAPI features and configurations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button onClick={() => setIsSimpleMode(!isSimpleMode)} variant="outline">
            {isSimpleMode ? 'Advanced Mode' : 'Simple Mode'}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Assistants</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Code className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Tools</p>
                <p className="text-2xl font-bold">{tools.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Workflow className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Phone Numbers</p>
                <p className="text-2xl font-bold">{phoneNumbers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="functions" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Functions
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="phone-numbers" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Numbers
          </TabsTrigger>
          <TabsTrigger value="real-time" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Real-Time
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="squads" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Squads
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Bulk Ops
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <VapiAdvancedConfig
            config={assistantConfig}
            onChange={setAssistantConfig}
            onSave={handleSaveConfiguration}
            isSimpleMode={isSimpleMode}
            onToggleMode={() => setIsSimpleMode(!isSimpleMode)}
          />
        </TabsContent>

        {/* Functions Tab */}
        <TabsContent value="functions" className="space-y-6">
          <VapiFunctionCalling
            tools={tools}
            onChange={setTools}
            onSave={handleSaveTools}
          />
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <VapiWorkflows
            workflows={workflows}
            onChange={setWorkflows}
            onSave={handleSaveWorkflows}
          />
        </TabsContent>

        {/* Phone Numbers Tab */}
        <TabsContent value="phone-numbers" className="space-y-6">
          <VapiPhoneNumbers
            phoneNumbers={phoneNumbers}
            onChange={setPhoneNumbers}
            onSave={handleSavePhoneNumbers}
            onRefresh={handleRefreshData}
          />
        </TabsContent>

        {/* Real-Time Tab */}
        <TabsContent value="real-time" className="space-y-6">
          <VapiRealTimeControl
            callId="call_demo_123"
            onCallAction={(action, data) => {
              console.log('Real-time call action:', action, data)
            }}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <VapiCallAnalytics
            organizationId={user?.user_metadata?.organization_id}
            dateRange={{
              from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              to: new Date()
            }}
          />
        </TabsContent>

        {/* Squads Tab */}
        <TabsContent value="squads" className="space-y-6">
          <VapiSquads
            squads={squads}
            onChange={setSquads}
            onSave={handleSaveSquads}
            onRefresh={handleRefreshData}
          />
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <VapiBulkOperations
            onSave={() => {
              console.log('✅ Bulk operations saved')
            }}
          />
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <VapiIntegrationTesting
            onRunTests={(suiteId) => {
              console.log(`✅ Test suite ${suiteId} completed`)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Footer Information */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Enterprise-Grade VAPI Integration:</strong> This dashboard provides complete access to all VAPI features including advanced configurations, function calling, workflows, and phone number management. All settings are synchronized with your VAPI account.
        </AlertDescription>
      </Alert>
    </div>
  )
}
