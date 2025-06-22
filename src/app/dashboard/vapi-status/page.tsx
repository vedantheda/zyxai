'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Phone, 
  Bot, 
  Zap,
  Activity,
  Settings,
  PlayCircle
} from 'lucide-react'
import { VoiceWidget } from '@/components/voice/VoiceWidget'

interface HealthCheck {
  timestamp: string
  status: 'healthy' | 'partial' | 'unhealthy' | 'error'
  checks: {
    environment: boolean
    apiConnection: boolean
    assistants: boolean
    phoneNumbers: boolean
  }
  config: {
    hasPrivateKey: boolean
    hasPublicKey: boolean
    appUrl: string
  }
  errors: string[]
}

export default function VapiStatusPage() {
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [assistants, setAssistants] = useState<any[]>([])

  useEffect(() => {
    runHealthCheck()
  }, [])

  const runHealthCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/vapi-health-check')
      const data = await response.json()
      setHealthCheck(data)
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const runDetailedTest = async (testType: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/vapi-health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType })
      })
      const data = await response.json()
      setTestResults(data)
      
      if (testType === 'assistants' && data.results?.assistants?.assistants) {
        setAssistants(data.results.assistants.assistants)
      }
    } catch (error) {
      console.error('Detailed test failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'partial': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'partial': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'unhealthy': return <XCircle className="w-5 h-5 text-red-600" />
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">VAPI Integration Status</h1>
          <p className="text-muted-foreground">
            Monitor and test your VAPI voice AI integration
          </p>
        </div>
        <Button onClick={runHealthCheck} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Health Check Overview */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(healthCheck.status)}
                VAPI Integration Health
              </CardTitle>
              <Badge variant={healthCheck.status === 'healthy' ? 'default' : 'destructive'}>
                {healthCheck.status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>
              Last checked: {new Date(healthCheck.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                {healthCheck.checks.environment ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <XCircle className="w-4 h-4 text-red-600" />
                }
                <span className="text-sm">Environment</span>
              </div>
              <div className="flex items-center gap-2">
                {healthCheck.checks.apiConnection ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <XCircle className="w-4 h-4 text-red-600" />
                }
                <span className="text-sm">API Connection</span>
              </div>
              <div className="flex items-center gap-2">
                {healthCheck.checks.assistants ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <XCircle className="w-4 h-4 text-red-600" />
                }
                <span className="text-sm">Assistants</span>
              </div>
              <div className="flex items-center gap-2">
                {healthCheck.checks.phoneNumbers ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                }
                <span className="text-sm">Phone Numbers</span>
              </div>
            </div>

            {healthCheck.errors.length > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {healthCheck.errors.map((error, index) => (
                      <div key={index} className="text-sm">{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="tests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Integration Tests</TabsTrigger>
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
          <TabsTrigger value="voice-test">Voice Test</TabsTrigger>
        </TabsList>

        {/* Integration Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Test Assistants
                </CardTitle>
                <CardDescription>
                  List and verify VAPI assistants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => runDetailedTest('assistants')} 
                  disabled={loading}
                  className="w-full"
                >
                  Run Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Test Phone Numbers
                </CardTitle>
                <CardDescription>
                  Check available phone numbers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => runDetailedTest('phone-numbers')} 
                  disabled={loading}
                  className="w-full"
                >
                  Run Test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Create Test Assistant
                </CardTitle>
                <CardDescription>
                  Test assistant creation/deletion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => runDetailedTest('create-test-assistant')} 
                  disabled={loading}
                  className="w-full"
                >
                  Run Test
                </Button>
              </CardContent>
            </Card>
          </div>

          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  {testResults.timestamp && `Completed at ${new Date(testResults.timestamp).toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assistants Tab */}
        <TabsContent value="assistants" className="space-y-4">
          {assistants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assistants.map((assistant) => (
                <Card key={assistant.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{assistant.name}</CardTitle>
                    <CardDescription>
                      Model: {assistant.model || 'Unknown'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        ID: {assistant.id}
                      </div>
                      <Button size="sm" className="w-full">
                        Test Assistant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No assistants found. Run the assistants test to load them.
                </p>
                <Button 
                  onClick={() => runDetailedTest('assistants')} 
                  disabled={loading}
                  className="mt-4"
                >
                  Load Assistants
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Voice Test Tab */}
        <TabsContent value="voice-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Voice Widget Test
              </CardTitle>
              <CardDescription>
                Test the voice widget component with a demo assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  This will test the voice widget in demo mode. For full testing, ensure you have a valid assistant ID.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center">
                <VoiceWidget
                  assistantId="demo"
                  agentName="ZyxAI Test Assistant"
                  agentGreeting="Hello! This is a test of the ZyxAI voice integration. How can I help you today?"
                  variant="card"
                  onCallStart={() => console.log('Test call started')}
                  onCallEnd={() => console.log('Test call ended')}
                  onMessage={(message) => console.log('Test message:', message)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
