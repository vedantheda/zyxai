'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Plus,
  Trash2,
  Settings,
  Code,
  Zap,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  Phone,
  Globe,
  Database,
  MessageSquare,
  Save
} from 'lucide-react'
import { VapiTool } from '@/lib/types/VapiAdvancedConfig'

interface VapiFunctionCallingProps {
  tools: VapiTool[]
  onChange: (tools: VapiTool[]) => void
  onSave?: () => void
}

export function VapiFunctionCalling({ tools, onChange, onSave }: VapiFunctionCallingProps) {
  const [expandedTools, setExpandedTools] = useState<Record<number, boolean>>({})

  const toggleTool = (index: number) => {
    setExpandedTools(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const addTool = (type: VapiTool['type']) => {
    const newTool: VapiTool = {
      type,
      name: '',
      description: '',
      ...(type === 'apiRequest' && {
        method: 'POST',
        url: '',
        headers: {},
        body: {},
        timeoutSeconds: 20
      }),
      ...(type === 'transferCall' && {
        destinations: []
      }),
      ...(type === 'endCall' && {}),
      ...(type === 'voicemail' && {
        message: ''
      }),
      ...(type === 'function' && {
        function: {
          name: '',
          description: '',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      })
    }
    onChange([...tools, newTool])
  }

  const updateTool = (index: number, updates: Partial<VapiTool>) => {
    const newTools = [...tools]
    newTools[index] = { ...newTools[index], ...updates }
    onChange(newTools)
  }

  const removeTool = (index: number) => {
    const newTools = tools.filter((_, i) => i !== index)
    onChange(newTools)
  }

  const getToolIcon = (type: VapiTool['type']) => {
    switch (type) {
      case 'apiRequest': return Globe
      case 'transferCall': return Phone
      case 'endCall': return Phone
      case 'voicemail': return MessageSquare
      case 'function': return Code
      default: return Settings
    }
  }

  const getToolColor = (type: VapiTool['type']) => {
    switch (type) {
      case 'apiRequest': return 'bg-blue-500'
      case 'transferCall': return 'bg-green-500'
      case 'endCall': return 'bg-red-500'
      case 'voicemail': return 'bg-purple-500'
      case 'function': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Function Calling & Tools
              </CardTitle>
              <CardDescription>
                Configure tools and functions that your assistant can use during calls
              </CardDescription>
            </div>
            {onSave && (
              <Button onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Tools
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => addTool('apiRequest')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              API Request
            </Button>
            <Button onClick={() => addTool('transferCall')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Transfer Call
            </Button>
            <Button onClick={() => addTool('endCall')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              End Call
            </Button>
            <Button onClick={() => addTool('voicemail')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Voicemail
            </Button>
            <Button onClick={() => addTool('function')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Custom Function
            </Button>
          </div>
        </CardContent>
      </Card>

      {tools.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Tools Configured</h3>
              <p className="mb-4">Add tools to enable your assistant to perform actions during calls</p>
              <div className="flex justify-center gap-2">
                <Button onClick={() => addTool('apiRequest')} variant="outline">
                  Add API Tool
                </Button>
                <Button onClick={() => addTool('transferCall')} variant="outline">
                  Add Transfer Tool
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tools.map((tool, index) => {
        const Icon = getToolIcon(tool.type)
        const isExpanded = expandedTools[index]

        return (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getToolColor(tool.type)}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {tool.name || `${tool.type} Tool`}
                    </CardTitle>
                    <CardDescription>
                      {tool.description || `Configure ${tool.type} functionality`}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{tool.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTool(index)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTool(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <Collapsible open={isExpanded} onOpenChange={() => toggleTool(index)}>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Basic Tool Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Tool Name</Label>
                      <Input
                        value={tool.name}
                        onChange={(e) => updateTool(index, { name: e.target.value })}
                        placeholder="Enter tool name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={tool.description}
                        onChange={(e) => updateTool(index, { description: e.target.value })}
                        placeholder="Describe what this tool does"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Tool-specific Configuration */}
                  {tool.type === 'apiRequest' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        API Request Configuration
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label>HTTP Method</Label>
                          <Select
                            value={tool.method || 'POST'}
                            onValueChange={(value) => updateTool(index, { method: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="PATCH">PATCH</SelectItem>
                              <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>URL</Label>
                          <Input
                            value={tool.url || ''}
                            onChange={(e) => updateTool(index, { url: e.target.value })}
                            placeholder="https://api.example.com/endpoint"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Timeout (seconds)</Label>
                          <Input
                            type="number"
                            value={tool.timeoutSeconds || 20}
                            onChange={(e) => updateTool(index, { timeoutSeconds: parseInt(e.target.value) })}
                            min={1}
                            max={300}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Headers (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(tool.headers || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const headers = JSON.parse(e.target.value)
                              updateTool(index, { headers })
                            } catch (error) {
                              // Invalid JSON, don't update
                            }
                          }}
                          placeholder={`{
  "Authorization": "Bearer token",
  "Content-Type": "application/json"
}`}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Request Body (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(tool.body || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const body = JSON.parse(e.target.value)
                              updateTool(index, { body })
                            } catch (error) {
                              // Invalid JSON, don't update
                            }
                          }}
                          placeholder={`{
  "message": "{{message}}",
  "user_id": "{{user_id}}"
}`}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {tool.type === 'transferCall' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Call Transfer Configuration
                      </h4>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Configure phone numbers and messages for call transfers. The assistant will use this tool to transfer calls to human agents or other departments.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Transfer Destinations</Label>
                          <Button
                            onClick={() => {
                              const destinations = tool.destinations || []
                              updateTool(index, {
                                destinations: [...destinations, {
                                  type: 'number',
                                  number: '',
                                  message: ''
                                }]
                              })
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Destination
                          </Button>
                        </div>

                        {(tool.destinations || []).map((destination, destIndex) => (
                          <div key={destIndex} className="p-4 border rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Destination {destIndex + 1}</h5>
                              <Button
                                onClick={() => {
                                  const destinations = tool.destinations || []
                                  updateTool(index, {
                                    destinations: destinations.filter((_, i) => i !== destIndex)
                                  })
                                }}
                                size="sm"
                                variant="ghost"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                  value={destination.number}
                                  onChange={(e) => {
                                    const destinations = [...(tool.destinations || [])]
                                    destinations[destIndex] = { ...destinations[destIndex], number: e.target.value }
                                    updateTool(index, { destinations })
                                  }}
                                  placeholder="+1234567890"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Transfer Message</Label>
                                <Input
                                  value={destination.message}
                                  onChange={(e) => {
                                    const destinations = [...(tool.destinations || [])]
                                    destinations[destIndex] = { ...destinations[destIndex], message: e.target.value }
                                    updateTool(index, { destinations })
                                  }}
                                  placeholder="Transferring you to our sales team..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tool.type === 'function' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Custom Function Configuration
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Function Name</Label>
                          <Input
                            value={tool.function?.name || ''}
                            onChange={(e) => updateTool(index, {
                              function: { ...tool.function, name: e.target.value }
                            })}
                            placeholder="myCustomFunction"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Function Description</Label>
                          <Input
                            value={tool.function?.description || ''}
                            onChange={(e) => updateTool(index, {
                              function: { ...tool.function, description: e.target.value }
                            })}
                            placeholder="What this function does"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Parameters Schema (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(tool.function?.parameters || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const parameters = JSON.parse(e.target.value)
                              updateTool(index, {
                                function: { ...tool.function, parameters }
                              })
                            } catch (error) {
                              // Invalid JSON, don't update
                            }
                          }}
                          placeholder={`{
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "age": {"type": "number"}
  },
  "required": ["name"]
}`}
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {tool.type === 'voicemail' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Voicemail Configuration
                      </h4>

                      <div className="space-y-2">
                        <Label>Voicemail Message</Label>
                        <Textarea
                          value={tool.message || ''}
                          onChange={(e) => updateTool(index, { message: e.target.value })}
                          placeholder="Please leave a message after the beep..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {tool.type === 'endCall' && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        End Call Configuration
                      </h4>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          This tool allows the assistant to end calls programmatically. Use with caution and ensure proper conditions are met before ending calls.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}

      {tools.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Function calling requires HTTPS endpoints for security. Ensure all API URLs use HTTPS in production.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
