'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Workflow
} from 'lucide-react'
import { VapiWorkflowConfig } from '@/lib/types/VapiAdvancedConfig'

export function VapiWorkflowTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])

  const createTestWorkflow = (): VapiWorkflowConfig => {
    return {
      id: `test_workflow_${Date.now()}`,
      name: 'Test Workflow',
      description: 'A simple test workflow to verify functionality',
      nodes: [
        {
          id: 'start',
          type: 'start',
          name: 'Start',
          position: { x: 100, y: 100 },
          data: {},
          connections: ['assistant1']
        },
        {
          id: 'assistant1',
          type: 'assistant',
          name: 'Main Assistant',
          position: { x: 300, y: 100 },
          data: {
            assistantId: 'test-assistant-id',
            message: 'Hello! How can I help you today?'
          },
          connections: ['end']
        },
        {
          id: 'end',
          type: 'end',
          name: 'End',
          position: { x: 500, y: 100 },
          data: {},
          connections: []
        }
      ],
      edges: [
        {
          id: 'edge1',
          source: 'start',
          target: 'assistant1'
        },
        {
          id: 'edge2',
          source: 'assistant1',
          target: 'end'
        }
      ],
      variables: {
        customerName: '',
        sessionId: ''
      },
      status: 'draft',
      createdAt: new Date().toISOString()
    }
  }

  const testWorkflowCreation = async () => {
    setIsLoading(true)
    const results = []

    try {
      // Test 1: Create a test workflow
      results.push({ test: 'Creating test workflow', status: 'running' })
      setTestResults([...results])

      const testWorkflow = createTestWorkflow()
      
      const response = await fetch('/api/vapi/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testWorkflow),
      })

      if (response.ok) {
        const data = await response.json()
        results[0] = { test: 'Creating test workflow', status: 'success', data: data.workflow }
      } else {
        const errorData = await response.json()
        results[0] = { test: 'Creating test workflow', status: 'error', error: errorData.error }
      }

      setTestResults([...results])

      // Test 2: Fetch workflows
      results.push({ test: 'Fetching workflows', status: 'running' })
      setTestResults([...results])

      const fetchResponse = await fetch('/api/vapi/workflows')
      
      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json()
        results[1] = { test: 'Fetching workflows', status: 'success', data: `Found ${fetchData.workflows?.length || 0} workflows` }
      } else {
        const errorData = await fetchResponse.json()
        results[1] = { test: 'Fetching workflows', status: 'error', error: errorData.error }
      }

      setTestResults([...results])

    } catch (error: any) {
      results.push({ test: 'Workflow API Test', status: 'error', error: error.message })
      setTestResults([...results])
    } finally {
      setIsLoading(false)
    }
  }

  const testWorkflowBuilder = () => {
    const results = []

    try {
      // Test workflow builder functionality
      results.push({ test: 'Workflow Builder Types', status: 'running' })
      
      const testWorkflow = createTestWorkflow()
      
      // Validate workflow structure
      if (testWorkflow.nodes && testWorkflow.edges && testWorkflow.variables) {
        results[0] = { test: 'Workflow Builder Types', status: 'success', data: 'All required properties present' }
      } else {
        results[0] = { test: 'Workflow Builder Types', status: 'error', error: 'Missing required properties' }
      }

      // Test node types
      results.push({ test: 'Node Type Validation', status: 'running' })
      
      const validTypes = ['start', 'assistant', 'condition', 'action', 'end']
      const allTypesValid = testWorkflow.nodes.every(node => validTypes.includes(node.type))
      
      if (allTypesValid) {
        results[1] = { test: 'Node Type Validation', status: 'success', data: 'All node types are valid' }
      } else {
        results[1] = { test: 'Node Type Validation', status: 'error', error: 'Invalid node types found' }
      }

      setTestResults([...results])

    } catch (error: any) {
      results.push({ test: 'Workflow Builder Test', status: 'error', error: error.message })
      setTestResults([...results])
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <TestTube className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'running': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            VAPI Workflow Testing
          </CardTitle>
          <CardDescription>
            Test workflow creation, management, and builder functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={testWorkflowCreation} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Test API Integration
            </Button>
            <Button 
              onClick={testWorkflowBuilder} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Workflow className="h-4 w-4" />
              Test Builder Types
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.test}</p>
                      {result.data && (
                        <p className="text-sm text-muted-foreground">{result.data}</p>
                      )}
                      {result.error && (
                        <p className="text-sm text-red-500">{result.error}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-white ${getStatusColor(result.status)}`}>
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Workflow className="h-4 w-4" />
        <AlertDescription>
          <strong>Workflow Testing:</strong> This component tests the workflow API integration, type definitions, and builder functionality to ensure everything is working correctly.
        </AlertDescription>
      </Alert>
    </div>
  )
}
