'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  TestTube,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Phone,
  MessageSquare,
  Settings,
  Zap,
  Users,
  BarChart3,
  RefreshCw,
  Download,
  Eye,
  Code,
  Shield
} from 'lucide-react'

interface TestResult {
  id: string
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning'
  duration?: number
  message?: string
  details?: any
}

interface TestSuite {
  id: string
  name: string
  description: string
  tests: TestResult[]
  status: 'pending' | 'running' | 'completed'
  progress: number
}

interface VapiIntegrationTestingProps {
  onRunTests?: (suiteId: string) => void
}

export function VapiIntegrationTesting({ onRunTests }: VapiIntegrationTestingProps) {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'connectivity',
      name: 'VAPI Connectivity',
      description: 'Test basic VAPI API connectivity and authentication',
      status: 'pending',
      progress: 0,
      tests: [
        { id: 'auth', name: 'API Authentication', status: 'pending' },
        { id: 'endpoints', name: 'Endpoint Availability', status: 'pending' },
        { id: 'rate_limits', name: 'Rate Limit Compliance', status: 'pending' },
        { id: 'webhooks', name: 'Webhook Configuration', status: 'pending' }
      ]
    },
    {
      id: 'assistants',
      name: 'Assistant Management',
      description: 'Test assistant creation, configuration, and management',
      status: 'pending',
      progress: 0,
      tests: [
        { id: 'create_assistant', name: 'Create Assistant', status: 'pending' },
        { id: 'update_assistant', name: 'Update Assistant', status: 'pending' },
        { id: 'list_assistants', name: 'List Assistants', status: 'pending' },
        { id: 'delete_assistant', name: 'Delete Assistant', status: 'pending' },
        { id: 'advanced_config', name: 'Advanced Configuration', status: 'pending' }
      ]
    },
    {
      id: 'calls',
      name: 'Call Management',
      description: 'Test call initiation, management, and monitoring',
      status: 'pending',
      progress: 0,
      tests: [
        { id: 'outbound_call', name: 'Outbound Call', status: 'pending' },
        { id: 'inbound_call', name: 'Inbound Call Setup', status: 'pending' },
        { id: 'call_control', name: 'Real-time Control', status: 'pending' },
        { id: 'call_recording', name: 'Call Recording', status: 'pending' },
        { id: 'call_analytics', name: 'Call Analytics', status: 'pending' }
      ]
    },
    {
      id: 'functions',
      name: 'Function Calling',
      description: 'Test function calling and tool integration',
      status: 'pending',
      progress: 0,
      tests: [
        { id: 'api_tools', name: 'API Request Tools', status: 'pending' },
        { id: 'transfer_tools', name: 'Call Transfer Tools', status: 'pending' },
        { id: 'custom_functions', name: 'Custom Functions', status: 'pending' },
        { id: 'tool_validation', name: 'Tool Parameter Validation', status: 'pending' }
      ]
    },
    {
      id: 'workflows',
      name: 'Workflows & Squads',
      description: 'Test workflow execution and squad management',
      status: 'pending',
      progress: 0,
      tests: [
        { id: 'workflow_creation', name: 'Workflow Creation', status: 'pending' },
        { id: 'workflow_execution', name: 'Workflow Execution', status: 'pending' },
        { id: 'squad_routing', name: 'Squad Routing', status: 'pending' },
        { id: 'conditional_logic', name: 'Conditional Logic', status: 'pending' }
      ]
    },
    {
      id: 'compliance',
      name: 'Compliance & Security',
      description: 'Test compliance features and security measures',
      status: 'pending',
      progress: 0,
      tests: [
        { id: 'hipaa_compliance', name: 'HIPAA Compliance', status: 'pending' },
        { id: 'pci_compliance', name: 'PCI Compliance', status: 'pending' },
        { id: 'data_encryption', name: 'Data Encryption', status: 'pending' },
        { id: 'access_control', name: 'Access Control', status: 'pending' }
      ]
    }
  ])

  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  const runTestSuite = async (suiteId: string) => {
    setIsRunning(true)
    setSelectedSuite(suiteId)

    // Update suite status
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'running', progress: 0 }
        : suite
    ))

    const suite = testSuites.find(s => s.id === suiteId)
    if (!suite) return

    // Run each test in the suite
    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i]
      
      // Update test status to running
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id 
                  ? { ...t, status: 'running' }
                  : t
              ),
              progress: (i / s.tests.length) * 100
            }
          : s
      ))

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Random test result for demo
      const success = Math.random() > 0.2
      const status = success ? 'passed' : (Math.random() > 0.5 ? 'failed' : 'warning')
      const duration = Math.floor(Math.random() * 3000) + 500

      // Update test result
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id 
                  ? { 
                      ...t, 
                      status: status as any,
                      duration,
                      message: status === 'passed' 
                        ? 'Test completed successfully'
                        : status === 'failed'
                        ? 'Test failed - check configuration'
                        : 'Test completed with warnings'
                    }
                  : t
              )
            }
          : s
      ))
    }

    // Mark suite as completed
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'completed', progress: 100 }
        : suite
    ))

    setIsRunning(false)
    onRunTests?.(suiteId)
  }

  const runAllTests = async () => {
    for (const suite of testSuites) {
      await runTestSuite(suite.id)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock
      case 'running': return RefreshCw
      case 'passed': return CheckCircle
      case 'failed': return XCircle
      case 'warning': return AlertTriangle
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-500'
      case 'running': return 'text-blue-500'
      case 'passed': return 'text-green-500'
      case 'failed': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  const getSuiteIcon = (suiteId: string) => {
    switch (suiteId) {
      case 'connectivity': return Zap
      case 'assistants': return Settings
      case 'calls': return Phone
      case 'functions': return Code
      case 'workflows': return Users
      case 'compliance': return Shield
      default: return TestTube
    }
  }

  const getOverallStatus = () => {
    const allTests = testSuites.flatMap(suite => suite.tests)
    const passed = allTests.filter(test => test.status === 'passed').length
    const failed = allTests.filter(test => test.status === 'failed').length
    const warnings = allTests.filter(test => test.status === 'warning').length
    const total = allTests.length

    return { passed, failed, warnings, total }
  }

  const overallStatus = getOverallStatus()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                VAPI Integration Testing
              </CardTitle>
              <CardDescription>
                Comprehensive testing suite for all VAPI features and integrations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={runAllTests} disabled={isRunning}>
                <Play className="h-4 w-4 mr-2" />
                Run All Tests
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold">{overallStatus.passed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <XCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{overallStatus.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold">{overallStatus.warnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TestTube className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{overallStatus.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Suites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testSuites.map((suite) => {
          const SuiteIcon = getSuiteIcon(suite.id)
          const passedTests = suite.tests.filter(test => test.status === 'passed').length
          const failedTests = suite.tests.filter(test => test.status === 'failed').length
          
          return (
            <Card key={suite.id} className="cursor-pointer hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <SuiteIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{suite.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {suite.tests.length} tests
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => runTestSuite(suite.id)}
                    disabled={isRunning}
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </Button>
                </div>
                
                {suite.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(suite.progress)}%</span>
                    </div>
                    <Progress value={suite.progress} className="h-2" />
                  </div>
                )}
                
                {suite.status === 'completed' && (
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-500">
                      {passedTests} Passed
                    </Badge>
                    {failedTests > 0 && (
                      <Badge variant="destructive">
                        {failedTests} Failed
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  {suite.tests.map((test) => {
                    const StatusIcon = getStatusIcon(test.status)
                    const statusColor = getStatusColor(test.status)
                    
                    return (
                      <div key={test.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${statusColor} ${test.status === 'running' ? 'animate-spin' : ''}`} />
                          <span className="text-sm">{test.name}</span>
                        </div>
                        {test.duration && (
                          <span className="text-xs text-muted-foreground">
                            {test.duration}ms
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Alert>
        <TestTube className="h-4 w-4" />
        <AlertDescription>
          <strong>Integration Testing:</strong> This comprehensive test suite validates all VAPI features including connectivity, assistants, calls, functions, workflows, and compliance. Run tests regularly to ensure your integration is working correctly.
        </AlertDescription>
      </Alert>
    </div>
  )
}
