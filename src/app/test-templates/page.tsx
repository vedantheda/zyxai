'use client'

import { useState } from 'react'
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
  Rocket,
  Database,
  Bot,
  Building
} from 'lucide-react'

export default function TestTemplatesPage() {
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [deployResult, setDeployResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Test form data
  const [testData, setTestData] = useState({
    industryId: 'real-estate',
    companyName: 'Test Real Estate Co',
    companyPhone: '+1-555-123-4567',
    companyWebsite: 'https://testrealestate.com',
    agentName: 'Sam Thompson'
  })

  const checkDatabase = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/setup-database')
      const data = await response.json()
      setDbStatus(data)
      
      if (!data.isSetupComplete) {
        console.log('Database needs setup, missing tables:', data.missingTables)
      }
    } catch (error: any) {
      setError('Failed to check database: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const setupDatabase = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/setup-database', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        alert('Database setup complete!')
        await checkDatabase() // Refresh status
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      setError('Failed to setup database: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const testTemplateDeployment = async () => {
    setLoading(true)
    setError(null)
    setDeployResult(null)
    
    try {
      console.log('🚀 Testing template deployment with data:', testData)
      
      const response = await fetch('/api/templates/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industryId: testData.industryId,
          companyInfo: {
            name: testData.companyName,
            phone: testData.companyPhone,
            website: testData.companyWebsite
          },
          customization: {
            agentNames: {
              'sam-realtor': testData.agentName
            },
            companyGreeting: `Thank you for calling ${testData.companyName}`,
            businessHours: '9 AM - 6 PM EST'
          },
          integrations: {}
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Template deployment failed')
      }

      setDeployResult(result)
      
      if (result.success) {
        alert(`Success! Created ${result.deployment.summary.agentsCreated} agents and ${result.deployment.summary.campaignsCreated} campaigns.`)
      }
    } catch (error: any) {
      console.error('Template deployment error:', error)
      setError('Template deployment failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template System Test</h1>
          <p className="text-muted-foreground">
            Test and verify the industry template deployment system
          </p>
        </div>
        <Button onClick={checkDatabase} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Check Status
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Status
          </CardTitle>
          <CardDescription>
            Check if the database schema is properly set up for templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dbStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {dbStatus.isSetupComplete ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {dbStatus.isSetupComplete ? 'Database Ready' : 'Database Needs Setup'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Existing Tables:</div>
                  <div className="space-y-1">
                    {dbStatus.existingTables?.map((table: string) => (
                      <Badge key={table} variant="default" className="mr-1">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Missing Tables:</div>
                  <div className="space-y-1">
                    {dbStatus.missingTables?.map((table: string) => (
                      <Badge key={table} variant="destructive" className="mr-1">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {!dbStatus.isSetupComplete && (
                <Button onClick={setupDatabase} disabled={loading}>
                  <Database className="w-4 h-4 mr-2" />
                  Setup Database
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Button onClick={checkDatabase} disabled={loading}>
                Check Database Status
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Test Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Template Deployment Test
          </CardTitle>
          <CardDescription>
            Test deploying a real estate template with custom company data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={testData.companyName}
                onChange={(e) => setTestData(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                value={testData.companyPhone}
                onChange={(e) => setTestData(prev => ({ ...prev, companyPhone: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="companyWebsite">Company Website</Label>
              <Input
                id="companyWebsite"
                value={testData.companyWebsite}
                onChange={(e) => setTestData(prev => ({ ...prev, companyWebsite: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="agentName">Agent Name</Label>
              <Input
                id="agentName"
                value={testData.agentName}
                onChange={(e) => setTestData(prev => ({ ...prev, agentName: e.target.value }))}
              />
            </div>
          </div>
          
          <Alert>
            <Building className="h-4 w-4" />
            <AlertDescription>
              This will deploy the Real Estate template with your custom company information.
              It will create Sam (lead qualification) and Jessica (appointment scheduling) agents.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={testTemplateDeployment} 
            disabled={loading || !dbStatus?.isSetupComplete}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deploying Template...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Deploy Real Estate Template
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Deployment Results */}
      {deployResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {deployResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Deployment Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deployResult.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {deployResult.deployment.summary.agentsCreated}
                    </div>
                    <div className="text-sm text-muted-foreground">Agents Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {deployResult.deployment.summary.campaignsCreated}
                    </div>
                    <div className="text-sm text-muted-foreground">Campaigns Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {deployResult.deployment.summary.workflowsCreated}
                    </div>
                    <div className="text-sm text-muted-foreground">Workflows Created</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Created Agents:</div>
                  {deployResult.deployment.agents.map((agent: any) => (
                    <div key={agent.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Bot className="w-4 h-4" />
                      <span className="font-medium">{agent.name}</span>
                      <Badge variant="outline">{agent.role}</Badge>
                      {agent.vapiAssistantId && (
                        <Badge variant="default">VAPI Integrated</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Deployment failed: {deployResult.error}
                </AlertDescription>
              </Alert>
            )}
            
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">View Raw Response</summary>
              <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(deployResult, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
