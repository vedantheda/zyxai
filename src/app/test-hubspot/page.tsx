'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HubSpotService } from '@/lib/services/HubSpotService'
import { Badge } from '@/components/ui/badge'

export default function TestHubSpotPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testHubSpotConnection = async () => {
    setLoading(true)
    try {
      // Test getting contacts (will use mock data if no API key)
      const contacts = await HubSpotService.getContactEngagements('test-contact-id', {
        limit: 5
      })
      
      setTestResults({
        success: true,
        message: 'HubSpot service is working!',
        data: contacts,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setTestResults({
        success: false,
        message: 'HubSpot test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const testEngagementCreation = async () => {
    setLoading(true)
    try {
      const engagement = await HubSpotService.createEngagement({
        type: 'NOTE',
        contactId: 'test-contact-123',
        properties: {
          hs_body_preview: 'Test note from ZyxAI conversations page'
        }
      })
      
      setTestResults({
        success: true,
        message: 'Engagement creation test successful!',
        data: engagement,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setTestResults({
        success: false,
        message: 'Engagement creation test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">HubSpot Integration Test</h1>
        
        <div className="grid gap-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Test HubSpot Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Button 
                  onClick={testHubSpotConnection}
                  disabled={loading}
                >
                  {loading ? 'Testing...' : 'Test Contact Engagements'}
                </Button>
                
                <Button 
                  onClick={testEngagementCreation}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Testing...' : 'Test Engagement Creation'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Test Results</span>
                  <Badge variant={testResults.success ? 'default' : 'destructive'}>
                    {testResults.success ? 'Success' : 'Failed'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Message:</h4>
                    <p className="text-sm text-muted-foreground">{testResults.message}</p>
                  </div>
                  
                  {testResults.error && (
                    <div>
                      <h4 className="font-semibold text-red-600">Error:</h4>
                      <p className="text-sm text-red-600">{testResults.error}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold">Timestamp:</h4>
                    <p className="text-sm text-muted-foreground">{testResults.timestamp}</p>
                  </div>
                  
                  {testResults.data && (
                    <div>
                      <h4 className="font-semibold">Data:</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(testResults.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>HubSpot Service</span>
                  <Badge variant="default">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mock Data Mode</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Conversations Page</span>
                  <Badge variant="default">Working</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Integration</span>
                  <Badge variant="outline">Ready for Setup</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p><strong>1. Current Status:</strong> The conversations page is working with mock HubSpot data.</p>
                <p><strong>2. To use real HubSpot data:</strong> Add your HubSpot API credentials to .env.local</p>
                <p><strong>3. Test the conversations page:</strong> <a href="/conversations" className="text-blue-600 hover:underline">Go to Conversations</a></p>
                <p><strong>4. Features working:</strong> Contact display, search, filtering, UI interactions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
