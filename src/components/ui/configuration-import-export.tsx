import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Download, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Copy,
  Sparkles
} from 'lucide-react'
import { ConfigurationService, AgentConfiguration } from '@/lib/services/ConfigurationService'

interface ConfigurationExportProps {
  agent: any
  configurations: any
  onExport?: (config: AgentConfiguration) => void
}

export function ConfigurationExport({ agent, configurations, onExport }: ConfigurationExportProps) {
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    try {
      const config = ConfigurationService.exportConfiguration(
        agent,
        configurations,
        {
          notes,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
        }
      )
      
      ConfigurationService.downloadConfiguration(config)
      onExport?.(config)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Agent Configuration</DialogTitle>
          <DialogDescription>
            Download a complete backup of all agent settings and configurations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="export-notes">Notes (Optional)</Label>
            <Textarea
              id="export-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this configuration..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="export-tags">Tags (Optional)</Label>
            <Textarea
              id="export-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="production, v2.1, optimized (comma-separated)"
              rows={2}
            />
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Export Includes
            </div>
            <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <li>• All voice and audio settings</li>
              <li>• Security and compliance configurations</li>
              <li>• Analysis and recording preferences</li>
              <li>• Tools and webhook integrations</li>
              <li>• Scripts and personality settings</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? 'Exporting...' : 'Download Configuration'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ConfigurationImportProps {
  onImport: (config: any, options: any) => void
  onError?: (error: string) => void
}

export function ConfigurationImport({ onImport, onError }: ConfigurationImportProps) {
  const [importedConfig, setImportedConfig] = useState<AgentConfiguration | null>(null)
  const [importOptions, setImportOptions] = useState({
    includeBasicInfo: true,
    includeVoiceConfig: true,
    includeAudioConfig: true,
    includeSecurityConfig: true,
    includeAllConfigs: false
  })
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const result = await ConfigurationService.parseImportedFile(file)
      if (result.error) {
        onError?.(result.error)
      } else if (result.config) {
        setImportedConfig(result.config)
      }
    } catch (error) {
      onError?.('Failed to process configuration file')
    } finally {
      setIsImporting(false)
    }
  }

  const handleImport = () => {
    if (!importedConfig) return

    try {
      const appliedConfig = ConfigurationService.applyImportedConfiguration(
        importedConfig,
        importOptions
      )
      onImport(appliedConfig, importOptions)
      setImportedConfig(null)
    } catch (error) {
      onError?.('Failed to apply imported configuration')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import Configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Agent Configuration</DialogTitle>
          <DialogDescription>
            Load settings from a previously exported configuration file
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!importedConfig ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                variant="outline"
                className="w-full h-20 border-dashed"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-6 w-6 mb-2" />
                  <div className="text-sm">
                    {isImporting ? 'Processing...' : 'Choose Configuration File'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    JSON files only
                  </div>
                </div>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Configuration loaded successfully from <strong>{importedConfig.agentInfo.name}</strong>
                  <div className="text-xs text-muted-foreground mt-1">
                    Exported: {new Date(importedConfig.exportedAt).toLocaleDateString()}
                  </div>
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-sm font-medium">Import Options</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAllConfigs"
                      checked={importOptions.includeAllConfigs}
                      onCheckedChange={(checked) => setImportOptions(prev => ({ 
                        ...prev, 
                        includeAllConfigs: !!checked,
                        includeBasicInfo: !!checked,
                        includeVoiceConfig: !!checked,
                        includeAudioConfig: !!checked,
                        includeSecurityConfig: !!checked
                      }))}
                    />
                    <Label htmlFor="includeAllConfigs" className="text-sm font-medium">
                      Import All Settings
                    </Label>
                  </div>
                  
                  {!importOptions.includeAllConfigs && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeBasicInfo"
                          checked={importOptions.includeBasicInfo}
                          onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, includeBasicInfo: !!checked }))}
                        />
                        <Label htmlFor="includeBasicInfo" className="text-sm">Basic Info (Name, Description)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeVoiceConfig"
                          checked={importOptions.includeVoiceConfig}
                          onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, includeVoiceConfig: !!checked }))}
                        />
                        <Label htmlFor="includeVoiceConfig" className="text-sm">Voice & Script Settings</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeAudioConfig"
                          checked={importOptions.includeAudioConfig}
                          onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, includeAudioConfig: !!checked }))}
                        />
                        <Label htmlFor="includeAudioConfig" className="text-sm">Audio & Transcription</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeSecurityConfig"
                          checked={importOptions.includeSecurityConfig}
                          onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, includeSecurityConfig: !!checked }))}
                        />
                        <Label htmlFor="includeSecurityConfig" className="text-sm">Security & Hooks</Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleImport} className="flex-1">
                  Apply Configuration
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setImportedConfig(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ConfigurationTemplatesProps {
  onApplyTemplate: (template: any) => void
}

export function ConfigurationTemplates({ onApplyTemplate }: ConfigurationTemplatesProps) {
  const templates = [
    { id: 'sales', name: 'Sales Agent', description: 'Optimized for sales conversations and lead qualification' },
    { id: 'support', name: 'Support Agent', description: 'Customer support and issue resolution' },
    { id: 'appointment', name: 'Appointment Agent', description: 'Scheduling and appointment management' },
    { id: 'survey', name: 'Survey Agent', description: 'Conducting surveys and collecting feedback' }
  ]

  const handleApplyTemplate = (templateId: string) => {
    const template = ConfigurationService.createTemplate(templateId as any)
    onApplyTemplate(template.configurations)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuration Templates</DialogTitle>
          <DialogDescription>
            Start with pre-configured settings optimized for specific use cases
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleApplyTemplate(template.id)}
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Templates will overwrite current settings. Consider exporting your current configuration first.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  )
}
