'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Bot, 
  Phone, 
  Workflow, 
  Users, 
  BarChart3,
  Play,
  Copy,
  Download,
  Upload
} from 'lucide-react'
import { VapiBusinessPresets, VapiBusinessPresetType } from '@/lib/config/VapiBusinessPresets'
import { VapiWorkflowPresets, VapiWorkflowPresetType } from '@/lib/config/VapiWorkflowPresets'

export default function VapiConfigPage() {
  const [selectedPreset, setSelectedPreset] = useState<VapiBusinessPresetType>('realEstate')
  const [selectedWorkflow, setSelectedWorkflow] = useState<VapiWorkflowPresetType>('appointmentScheduling')
  const [assistants, setAssistants] = useState<any[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([])
  const [workflows, setWorkflows] = useState<any[]>([])
  const [squads, setSquads] = useState<any[]>([])

  useEffect(() => {
    loadVapiData()
  }, [])

  const loadVapiData = async () => {
    try {
      // Load assistants
      const assistantsRes = await fetch('/api/vapi/assistants')
      if (assistantsRes.ok) {
        const assistantsData = await assistantsRes.json()
        setAssistants(assistantsData.assistants || [])
      }

      // Load phone numbers
      const phoneRes = await fetch('/api/vapi/phone-numbers')
      if (phoneRes.ok) {
        const phoneData = await phoneRes.json()
        setPhoneNumbers(phoneData.phoneNumbers || [])
      }

      // Load workflows
      const workflowsRes = await fetch('/api/vapi/workflows')
      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json()
        setWorkflows(workflowsData.workflows || [])
      }

      // Load squads
      const squadsRes = await fetch('/api/vapi/squads')
      if (squadsRes.ok) {
        const squadsData = await squadsRes.json()
        setSquads(squadsData.squads || [])
      }
    } catch (error) {
      console.error('Error loading VAPI data:', error)
    }
  }

  const createPresetAssistant = async (presetType: VapiBusinessPresetType) => {
    try {
      const preset = VapiBusinessPresets[presetType]
      const response = await fetch('/api/vapi/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Assistant created:', result)
        loadVapiData() // Refresh data
      }
    } catch (error) {
      console.error('Error creating assistant:', error)
    }
  }

  const createPresetWorkflow = async (workflowType: VapiWorkflowPresetType) => {
    try {
      const workflow = VapiWorkflowPresets[workflowType]
      const response = await fetch('/api/vapi/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${workflowType} Workflow`,
          ...workflow
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Workflow created:', result)
        loadVapiData() // Refresh data
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
    }
  }

  const copyConfiguration = (config: any) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  const downloadConfiguration = (config: any, filename: string) => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">VAPI Configuration Center</h1>
          <p className="text-muted-foreground">
            Comprehensive VAPI setup and management for ZyxAI voice automation
          </p>
        </div>
        <Button onClick={loadVapiData}>
          <Settings className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="presets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="presets">Business Presets</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
          <TabsTrigger value="phone-numbers">Phone Numbers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Business Presets Tab */}
        <TabsContent value="presets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(VapiBusinessPresets).map(([key, preset]) => (
              <Card key={key} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    {preset.name}
                  </CardTitle>
                  <CardDescription>
                    {key === 'realEstate' && 'Professional real estate agent for property inquiries'}
                    {key === 'customerSupport' && 'Helpful customer support representative'}
                    {key === 'appointmentScheduler' && 'Efficient appointment booking assistant'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Badge variant="outline">
                      {preset.voice?.provider} - {preset.voice?.voiceId}
                    </Badge>
                    <Badge variant="outline">
                      {preset.transcriber?.provider} - {preset.transcriber?.model}
                    </Badge>
                    <Badge variant="outline">
                      {preset.model?.provider} - {preset.model?.model}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => createPresetAssistant(key as VapiBusinessPresetType)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Deploy
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyConfiguration(preset)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadConfiguration(preset, `${key}-preset`)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p><strong>First Message:</strong> {preset.firstMessage?.substring(0, 100)}...</p>
                    <p><strong>Tools:</strong> {preset.model?.tools?.length || 0} configured</p>
                    <p><strong>Analysis:</strong> {preset.analysisPlan ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(VapiWorkflowPresets).map(([key, workflow]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="w-5 h-5" />
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                  <CardDescription>
                    {key === 'appointmentScheduling' && 'Complete appointment booking flow'}
                    {key === 'customerSupport' && 'Multi-tier customer support workflow'}
                    {key === 'salesQualification' && 'Lead qualification and demo scheduling'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Badge variant="outline">
                      {workflow.nodes.length} Nodes
                    </Badge>
                    <Badge variant="outline">
                      {workflow.edges?.length || 0} Transitions
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => createPresetWorkflow(key as VapiWorkflowPresetType)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Deploy
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyConfiguration(workflow)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadConfiguration(workflow, `${key}-workflow`)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p><strong>Start Node:</strong> {workflow.nodes[0]?.type}</p>
                    <p><strong>Variables:</strong> {workflow.nodes.reduce((acc, node) => acc + (node.extractVariables?.length || 0), 0)} extracted</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Assistants Tab */}
        <TabsContent value="assistants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Active Assistants ({assistants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assistants.map((assistant) => (
                  <Card key={assistant.id} className="p-4">
                    <h3 className="font-semibold">{assistant.name}</h3>
                    <p className="text-sm text-muted-foreground">{assistant.id}</p>
                    <div className="mt-2 space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {assistant.model?.provider}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {assistant.voice?.provider}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phone Numbers Tab */}
        <TabsContent value="phone-numbers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Phone Numbers ({phoneNumbers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phoneNumbers.map((phone) => (
                  <Card key={phone.id} className="p-4">
                    <h3 className="font-semibold">{phone.number || phone.id}</h3>
                    <p className="text-sm text-muted-foreground">Provider: {phone.provider}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {phone.assistantId ? 'Assistant' : phone.squadId ? 'Squad' : phone.workflowId ? 'Workflow' : 'Server'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assistants</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistants.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Phone Numbers</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{phoneNumbers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workflows</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Squads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{squads.length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
