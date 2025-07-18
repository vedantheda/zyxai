'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw,
  ArrowRight,
  MapPin,
  AlertCircle
} from 'lucide-react'

interface FieldMapping {
  id?: string
  zyxai_field: string
  crm_field: string
  field_type: string
  is_required: boolean
  is_custom: boolean
  default_value?: string
}

interface Field {
  name: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  description?: string
}

export default function FieldMappingManager() {
  const { user } = useAuth()
  const organization = user?.organization
  const [activeTab, setActiveTab] = useState('contact')
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [zyxaiFields, setZyxaiFields] = useState<Field[]>([])
  const [crmFields, setCrmFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (organization) {
      loadFieldMappings(activeTab)
    }
  }, [organization, activeTab])

  const loadFieldMappings = async (entityType: string) => {
    if (!organization) return

    try {
      setLoading(true)
      const response = await fetch(
        `/api/integrations/field-mappings?organizationId=${organization.id}&crmType=hubspot&entityType=${entityType}`
      )
      const data = await response.json()

      if (response.ok) {
        setMappings(data.mappings || [])
        setZyxaiFields(data.zyxaiFields || [])
        setCrmFields(data.crmFields || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load field mappings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load field mappings' })
    } finally {
      setLoading(false)
    }
  }

  const saveMapping = async (mapping: FieldMapping) => {
    if (!organization) return

    try {
      setSaving(true)
      const response = await fetch('/api/integrations/field-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          mapping: {
            ...mapping,
            crm_type: 'hubspot',
            entity_type: activeTab
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Field mapping saved successfully' })
        loadFieldMappings(activeTab)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save field mapping' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save field mapping' })
    } finally {
      setSaving(false)
    }
  }

  const deleteMapping = async (mappingId: string) => {
    try {
      const response = await fetch(`/api/integrations/field-mappings?mappingId=${mappingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Field mapping deleted successfully' })
        loadFieldMappings(activeTab)
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to delete field mapping' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete field mapping' })
    }
  }

  const addNewMapping = () => {
    const newMapping: FieldMapping = {
      zyxai_field: '',
      crm_field: '',
      field_type: 'string',
      is_required: false,
      is_custom: false
    }
    setMappings([...mappings, newMapping])
  }

  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    const updatedMappings = [...mappings]
    updatedMappings[index] = { ...updatedMappings[index], ...updates }
    setMappings(updatedMappings)
  }

  const getFieldType = (fieldName: string, fields: Field[]) => {
    const field = fields.find(f => f.name === fieldName)
    return field?.type || 'string'
  }

  const getUnmappedZyxaiFields = () => {
    const mappedFields = mappings.map(m => m.zyxai_field)
    return zyxaiFields.filter(f => !mappedFields.includes(f.name))
  }

  const getUnmappedCrmFields = () => {
    const mappedFields = mappings.map(m => m.crm_field)
    return crmFields.filter(f => !mappedFields.includes(f.name))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading field mappings...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Field Mapping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Field Mapping Configuration
          </CardTitle>
          <CardDescription>
            Configure how ZyxAI fields map to your CRM fields for data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contact">Contacts</TabsTrigger>
              <TabsTrigger value="call">Calls</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6 mt-6">
              {/* Current Mappings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Current Field Mappings</h3>
                  <Button onClick={addNewMapping} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Mapping
                  </Button>
                </div>

                {mappings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No field mappings configured. Add your first mapping above.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mappings.map((mapping, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                          {/* ZyxAI Field */}
                          <div>
                            <Label className="text-sm font-medium">ZyxAI Field</Label>
                            <Select
                              value={mapping.zyxai_field}
                              onValueChange={(value) => {
                                const fieldType = getFieldType(value, zyxaiFields)
                                updateMapping(index, { 
                                  zyxai_field: value,
                                  field_type: fieldType
                                })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {zyxaiFields.map((field) => (
                                  <SelectItem key={field.name} value={field.name}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Arrow */}
                          <div className="flex justify-center">
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>

                          {/* CRM Field */}
                          <div>
                            <Label className="text-sm font-medium">HubSpot Field</Label>
                            <Select
                              value={mapping.crm_field}
                              onValueChange={(value) => updateMapping(index, { crm_field: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {crmFields.map((field) => (
                                  <SelectItem key={field.name} value={field.name}>
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`required-${index}`}
                                checked={mapping.is_required}
                                onCheckedChange={(checked) => updateMapping(index, { is_required: checked })}
                              />
                              <Label htmlFor={`required-${index}`} className="text-sm">Required</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`custom-${index}`}
                                checked={mapping.is_custom}
                                onCheckedChange={(checked) => updateMapping(index, { is_custom: checked })}
                              />
                              <Label htmlFor={`custom-${index}`} className="text-sm">Custom</Label>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveMapping(mapping)}
                              disabled={!mapping.zyxai_field || !mapping.crm_field || saving}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            
                            {mapping.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteMapping(mapping.id!)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Default Value */}
                        {mapping.zyxai_field && mapping.crm_field && (
                          <div className="mt-4">
                            <Label className="text-sm font-medium">Default Value (optional)</Label>
                            <Input
                              placeholder="Enter default value..."
                              value={mapping.default_value || ''}
                              onChange={(e) => updateMapping(index, { default_value: e.target.value })}
                            />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Field Reference */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Available ZyxAI Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getUnmappedZyxaiFields().map((field) => (
                        <div key={field.name} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{field.label}</div>
                            <div className="text-sm text-muted-foreground">{field.name}</div>
                          </div>
                          <Badge variant="outline">{field.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Available HubSpot Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getUnmappedCrmFields().map((field) => (
                        <div key={field.name} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">{field.name}</div>
                          </div>
                          <Badge variant="outline">{field.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
