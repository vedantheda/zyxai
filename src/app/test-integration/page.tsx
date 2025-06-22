'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Phone, 
  Bot, 
  Zap,
  PlayCircle,
  Settings
} from 'lucide-react'
import { VoiceWidget } from '@/components/voice/VoiceWidget'

interface TestResult {
  timestamp: string
  environment: {
    hasPrivateKey: boolean
    hasPublicKey: boolean
    appUrl: string
    nodeEnv: string
  }
  tests: {
    apiConnection: { success: boolean; error: string | null }
    assistantsList: { success: boolean; count: number; error: string | null }
    phoneNumbers: { success: boolean; count: number; error: string | null }
    createTestAssistant: { success: boolean; assistantId: string | null; error: string | null }
    deleteTestAssistant: { success: boolean; error: string | null }
  }
  recommendations: string[]
}

export default function TestIntegrationPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [testPhoneNumber, setTestPhoneNumber] = useState('')
  const [testAssistantId, setTestAssistantId] = useState('')
  const [callResult, setCallResult] = useState<any>(null)

  useEffect(() => {
    runIntegrationTest()
  }, [])

  const runIntegrationTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-vapi-integration')
      const data = await response.json()
      setTestResult(data)
      
      // If we have assistants, use the first one for testing
      if (data.tests.assistantsList.count > 0) {
        // We'll need to fetch the actual assistant list to get an ID
        fetchAssistantForTesting()
      }
    } catch (error) {
      console.error('Integration test failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssistantForTesting = async () => {
    try {
      const response = await fetch('/api/vapi-health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'assistants' })
      })
      const data = await response.json()
      
      if (data.success && data.results?.assistants?.assistants?.length > 0) {
        setTestAssistantId(data.results.assistants.assistants[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch assistants:', error)
    }
  }

  const createTestCall = async () => {
    if (!testPhoneNumber || !testAssistantId) {
      alert('Please enter a phone number and ensure an assistant is available')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test-vapi-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType: 'test-call',
          assistantId: testAssistantId,
          phoneNumber: testPhoneNumber
        })
      })
      
      const data = await response.json()
      setCallResult(data)
      
      if (data.success) {
        alert(`Test call created successfully! Call ID: ${data.callId}`)
      } else {
        alert(`Test call failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Test call failed:', error)
      alert('Test call failed - check console for details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (success: boolean, error: string | null) => {
    if (success) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (error) return <XCircle className="w-5 h-5 text-red-600" />
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />
  }

  const getOverallStatus = () => {
    if (!testResult) return 'unknown'
    
    const { apiConnection, assistantsList, createTestAssistant } = testResult.tests
    
    if (apiConnection.success && assistantsList.success && createTestAssistant.success) {
      return 'excellent'
    } else if (apiConnection.success && assistantsList.success) {
      return 'good'
    } else if (apiConnection.success) {
      return 'partial'
    } else {
      return 'failed'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'partial': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'excellent': return 'All systems operational! Ready for production.'
      case 'good': return 'Core functionality working. Minor issues detected.'
      case 'partial': return 'Basic connectivity working. Some features may be limited.'
      case 'failed': return 'Integration issues detected. Check configuration.'
      default: return 'Testing in progress...'
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ZyxAI Integration Test</h1>
          <p className="text-muted-foreground">
            Comprehensive test of your VAPI voice AI integration
          </p>
        </div>
        <Button onClick={runIntegrationTest} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Run Test
        </Button>
      </div>

      {/* Overall Status */}
      {testResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`text-2xl ${getStatusColor(getOverallStatus())}`}>
                Integration Status: {getOverallStatus().toUpperCase()}
              </CardTitle>
              <Badge variant={getOverallStatus() === 'excellent' ? 'default' : 'destructive'}>
                {getOverallStatus()}
              </Badge>
            </div>
            <CardDescription>
              {getStatusMessage(getOverallStatus())}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Last tested: {new Date(testResult.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Check */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Environment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResult.environment.hasPrivateKey, null)}
                <span className="text-sm">Private Key</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(testResult.environment.hasPublicKey, null)}
                <span className="text-sm">Public Key</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(!!testResult.environment.appUrl, null)}
                <span className="text-sm">App URL</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{testResult.environment.nodeEnv}</Badge>
                <span className="text-sm">Environment</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Integration Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResult.tests.apiConnection.success, testResult.tests.apiConnection.error)}
                  <div>
                    <div className="font-medium">API Connection</div>
                    <div className="text-sm text-muted-foreground">
                      {testResult.tests.apiConnection.error || 'Connected to VAPI API'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResult.tests.assistantsList.success, testResult.tests.assistantsList.error)}
                  <div>
                    <div className="font-medium">Assistants ({testResult.tests.assistantsList.count})</div>
                    <div className="text-sm text-muted-foreground">
                      {testResult.tests.assistantsList.error || `Found ${testResult.tests.assistantsList.count} assistants`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResult.tests.phoneNumbers.success, testResult.tests.phoneNumbers.error)}
                  <div>
                    <div className="font-medium">Phone Numbers ({testResult.tests.phoneNumbers.count})</div>
                    <div className="text-sm text-muted-foreground">
                      {testResult.tests.phoneNumbers.error || `Found ${testResult.tests.phoneNumbers.count} phone numbers`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  {getStatusIcon(testResult.tests.createTestAssistant.success, testResult.tests.createTestAssistant.error)}
                  <div>
                    <div className="font-medium">Assistant Creation</div>
                    <div className="text-sm text-muted-foreground">
                      {testResult.tests.createTestAssistant.error || 'Can create and delete assistants'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Widget Test */}
      {testResult?.environment.hasPublicKey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Voice Widget Test
            </CardTitle>
            <CardDescription>
              Test the voice widget with a demo assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                This tests the voice widget in demo mode. For full VAPI testing, use a real assistant ID.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <VoiceWidget
                assistantId={testAssistantId || "demo"}
                agentName="ZyxAI Test Assistant"
                agentGreeting="Hello! This is a test of the ZyxAI voice integration. I can demonstrate how voice AI works for your business."
                variant="card"
                onCallStart={() => console.log('Test call started')}
                onCallEnd={() => console.log('Test call ended')}
                onMessage={(message) => console.log('Test message:', message)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Call Creation */}
      {testResult?.tests.assistantsList.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Test Outbound Call
            </CardTitle>
            <CardDescription>
              Create a test call to verify end-to-end functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Test Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assistant">Assistant ID</Label>
                <Input
                  id="assistant"
                  placeholder="Assistant ID"
                  value={testAssistantId}
                  onChange={(e) => setTestAssistantId(e.target.value)}
                />
              </div>
            </div>
            
            <Button onClick={createTestCall} disabled={loading || !testPhoneNumber}>
              <Phone className="w-4 h-4 mr-2" />
              Create Test Call
            </Button>

            {callResult && (
              <Alert>
                <AlertDescription>
                  {callResult.success ? 
                    `✅ Test call created: ${callResult.callId}` : 
                    `❌ Test call failed: ${callResult.error}`
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {testResult?.recommendations && testResult.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResult.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-2">
                  {rec.startsWith('✅') ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
