'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Phone, Settings, Info, ExternalLink, AlertCircle } from 'lucide-react'
import VapiDemoCall from '@/components/voice/VapiDemoCall'
import VapiDiagnostics from '@/components/voice/VapiDiagnostics'
import { Button } from '@/components/ui/button'

export default function VapiCallDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">VAPI Call Demo</h1>
        <p className="text-xl text-muted-foreground">
          Test your VAPI integration by placing real voice calls
        </p>
        <Badge variant="outline" className="text-sm">
          ZyxAI Voice Integration
        </Badge>
      </div>

      {/* Important Notice */}
      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="space-y-2">
            <p className="font-medium">⚠️ Important Notice</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>This will create <strong>real phone calls</strong> using your VAPI credits</li>
              <li>Make sure you have sufficient credits in your VAPI account</li>
              <li>Only call numbers you have permission to call</li>
              <li>Test with your own phone number first</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Prerequisites
          </CardTitle>
          <CardDescription>
            Make sure you have the following configured before testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">VAPI Account Setup</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Valid VAPI API keys in .env.local
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  At least one assistant created
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Sufficient credits for calls
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Phone number configured (optional)
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Quick Links</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="https://dashboard.vapi.ai/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    VAPI Dashboard
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="/dashboard/vapi-config" 
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    ZyxAI VAPI Config
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Types Overview */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-blue-800">Two Call Types Available:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-blue-600 mb-1">🌐 Web Calls (Demo):</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Browser-based voice conversations</li>
                  <li>• Real-time transcription display</li>
                  <li>• Microphone mute/unmute controls</li>
                  <li>• Volume level monitoring</li>
                  <li>• Free testing (no credits used)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-green-600 mb-1">📞 Phone Calls (Real):</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Actual phone calls to any number</li>
                  <li>• Real-time call status monitoring</li>
                  <li>• Call duration tracking</li>
                  <li>• Customer information input</li>
                  <li>• Uses VAPI credits</li>
                </ul>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Diagnostics */}
      <VapiDiagnostics />

      {/* Demo Call Interface */}
      <VapiDemoCall />

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Integration Details</CardTitle>
          <CardDescription>
            How this demo works with your ZyxAI application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Web Call Integration (VAPI Web SDK)</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h5 className="font-medium mb-2">Client-Side Integration</h5>
                    <p className="text-sm text-muted-foreground">
                      Uses <code>@vapi-ai/web</code> SDK for browser-based voice calls
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h5 className="font-medium mb-2">Real-time Events</h5>
                    <p className="text-sm text-muted-foreground">
                      Handles speech, volume, messages, and call state events
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Phone Call Integration (VAPI Server SDK)</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h5 className="font-medium mb-2">1. Load Assistants</h5>
                    <p className="text-sm text-muted-foreground">
                      Fetches your VAPI assistants via <code>/api/vapi/assistants</code>
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h5 className="font-medium mb-2">2. Create Call</h5>
                    <p className="text-sm text-muted-foreground">
                      Initiates call via <code>/api/vapi/create-call</code> endpoint
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h5 className="font-medium mb-2">3. Monitor Status</h5>
                    <p className="text-sm text-muted-foreground">
                      Polls call status via <code>/api/vapi/calls/[id]</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Alert>
              <Phone className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Integration Status</p>
                <p className="text-sm">
                  This demo uses the same VAPI integration that powers your ZyxAI application. 
                  Successful calls here confirm your integration is working correctly.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>
            Common issues and solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Common Issues:</h4>
              <div className="space-y-2 text-sm">
                <div className="p-3 border-l-4 border-red-200 bg-red-50">
                  <p className="font-medium text-red-800">No assistants found</p>
                  <p className="text-red-700">Create at least one assistant in your VAPI dashboard first</p>
                </div>
                <div className="p-3 border-l-4 border-yellow-200 bg-yellow-50">
                  <p className="font-medium text-yellow-800">Call creation fails</p>
                  <p className="text-yellow-700">Check API keys, credits, and phone number configuration</p>
                </div>
                <div className="p-3 border-l-4 border-blue-200 bg-blue-50">
                  <p className="font-medium text-blue-800">Call status not updating</p>
                  <p className="text-blue-700">This is normal - VAPI calls may take time to connect</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
