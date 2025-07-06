'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Loader2, Database, Palette } from 'lucide-react'

export default function SetupWhiteLabelPage() {
  const [loading, setLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup-white-label')
      const data = await response.json()
      setSetupStatus(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const runSetup = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/setup-white-label', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setSetupStatus(data)
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Palette className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">White-Label Setup</h1>
          </div>
          <p className="text-muted-foreground">
            Initialize the white-label system for ZyxAI platform
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Setup Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Setup Status</span>
            </CardTitle>
            <CardDescription>
              Check and initialize white-label database tables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!setupStatus && (
              <div className="text-center py-8">
                <Button onClick={checkSetupStatus} variant="outline">
                  Check Setup Status
                </Button>
              </div>
            )}

            {setupStatus && (
              <div className="space-y-4">
                {/* Setup Complete Status */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Setup Status</span>
                  <Badge variant={setupStatus.is_setup_complete || setupStatus.setup_complete ? "default" : "secondary"}>
                    {setupStatus.is_setup_complete || setupStatus.setup_complete ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Complete
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Incomplete
                      </>
                    )}
                  </Badge>
                </div>

                {/* Existing Tables */}
                {setupStatus.existing_tables && setupStatus.existing_tables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Existing Tables</h4>
                    <div className="flex flex-wrap gap-2">
                      {setupStatus.existing_tables.map((table: string) => (
                        <Badge key={table} variant="default">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tables Created */}
                {setupStatus.tables_created && setupStatus.tables_created.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Tables Created</h4>
                    <div className="flex flex-wrap gap-2">
                      {setupStatus.tables_created.map((table: string) => (
                        <Badge key={table} variant="default">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Tables */}
                {setupStatus.missing_tables && setupStatus.missing_tables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Missing Tables</h4>
                    <div className="flex flex-wrap gap-2">
                      {setupStatus.missing_tables.map((table: string) => (
                        <Badge key={table} variant="destructive">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Setup Actions */}
                <div className="flex space-x-3 pt-4">
                  <Button onClick={checkSetupStatus} variant="outline">
                    Refresh Status
                  </Button>
                  
                  {(!setupStatus.is_setup_complete && !setupStatus.setup_complete) && (
                    <Button onClick={runSetup} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Run Setup
                        </>
                      )}
                    </Button>
                  )}

                  {(setupStatus.is_setup_complete || setupStatus.setup_complete) && (
                    <Button asChild>
                      <a href="/dashboard/white-label">
                        <Palette className="mr-2 h-4 w-4" />
                        Configure White-Label
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>White-Label Features</CardTitle>
            <CardDescription>
              What you'll get with the white-label system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Branding</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Custom brand name and logo</li>
                  <li>• Custom color schemes</li>
                  <li>• Custom domain support</li>
                  <li>• Subdomain configuration</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Agency Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Client management system</li>
                  <li>• Multi-tenant architecture</li>
                  <li>• Commission tracking</li>
                  <li>• White-label reselling</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Multi-Channel Agents</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Voice, SMS, Email agents</li>
                  <li>• WhatsApp integration</li>
                  <li>• Social media agents</li>
                  <li>• Cross-channel memory</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Configuration</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Feature toggles</li>
                  <li>• Pricing configuration</li>
                  <li>• Support settings</li>
                  <li>• Agency permissions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
