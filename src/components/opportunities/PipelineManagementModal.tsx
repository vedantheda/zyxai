'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit2, GripVertical, Save, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'

interface Pipeline {
  id: string
  name: string
  description?: string
  stages: Stage[]
  isDefault?: boolean
  isActive?: boolean
}

interface Stage {
  id: string
  name: string
  color: string
  order: number
  isClosedWon?: boolean
  isClosedLost?: boolean
}

interface PipelineManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipelines: Pipeline[]
  onPipelineCreated: () => void
  onPipelineUpdated: () => void
  onPipelineDeleted: () => void
}

const stageColors = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
]

export function PipelineManagementModal({
  open,
  onOpenChange,
  pipelines,
  onPipelineCreated,
  onPipelineUpdated,
  onPipelineDeleted
}: PipelineManagementModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('list')
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(false)

  // New pipeline form
  const [newPipeline, setNewPipeline] = useState({
    name: '',
    description: '',
    stages: [
      { name: 'New Lead', color: stageColors[0], isClosedWon: false, isClosedLost: false },
      { name: 'Qualified', color: stageColors[1], isClosedWon: false, isClosedLost: false },
      { name: 'Proposal', color: stageColors[2], isClosedWon: false, isClosedLost: false },
      { name: 'Negotiation', color: stageColors[3], isClosedWon: false, isClosedLost: false },
      { name: 'Closed Won', color: stageColors[4], isClosedWon: true, isClosedLost: false },
      { name: 'Closed Lost', color: stageColors[5], isClosedWon: false, isClosedLost: true }
    ]
  })

  const createPipeline = async () => {
    if (!user?.organization_id || !newPipeline.name.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/opportunities/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: user.organization_id,
          name: newPipeline.name,
          description: newPipeline.description,
          stages: newPipeline.stages.map((stage, index) => ({
            name: stage.name,
            color: stage.color,
            order: index + 1,
            isClosedWon: stage.isClosedWon,
            isClosedLost: stage.isClosedLost
          }))
        })
      })

      const data = await response.json()
      if (data.success) {
        onPipelineCreated()
        setNewPipeline({
          name: '',
          description: '',
          stages: [
            { name: 'New Lead', color: stageColors[0], isClosedWon: false, isClosedLost: false },
            { name: 'Qualified', color: stageColors[1], isClosedWon: false, isClosedLost: false },
            { name: 'Proposal', color: stageColors[2], isClosedWon: false, isClosedLost: false },
            { name: 'Negotiation', color: stageColors[3], isClosedWon: false, isClosedLost: false },
            { name: 'Closed Won', color: stageColors[4], isClosedWon: true, isClosedLost: false },
            { name: 'Closed Lost', color: stageColors[5], isClosedWon: false, isClosedLost: true }
          ]
        })
        setActiveTab('list')
        alert('Pipeline created successfully!')
      } else {
        alert(`Failed to create pipeline: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to create pipeline:', error)
      alert('Failed to create pipeline')
    } finally {
      setLoading(false)
    }
  }

  const addStage = () => {
    const newStage = {
      name: `Stage ${newPipeline.stages.length + 1}`,
      color: stageColors[newPipeline.stages.length % stageColors.length],
      isClosedWon: false,
      isClosedLost: false
    }
    setNewPipeline(prev => ({
      ...prev,
      stages: [...prev.stages, newStage]
    }))
  }

  const removeStage = (index: number) => {
    if (newPipeline.stages.length <= 2) {
      alert('Pipeline must have at least 2 stages')
      return
    }
    setNewPipeline(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index)
    }))
  }

  const updateStage = (index: number, field: string, value: any) => {
    setNewPipeline(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => 
        i === index ? { ...stage, [field]: value } : stage
      )
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pipeline Management</DialogTitle>
          <DialogDescription>
            Create and manage your sales pipelines and stages
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Existing Pipelines</TabsTrigger>
            <TabsTrigger value="create">Create New Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="space-y-4">
              {pipelines.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No pipelines found</p>
                    <Button 
                      onClick={() => setActiveTab('create')} 
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Pipeline
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                pipelines.map((pipeline) => (
                  <Card key={pipeline.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {pipeline.name}
                            {pipeline.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </CardTitle>
                          {pipeline.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {pipeline.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!pipeline.isDefault && (
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {pipeline.stages.map((stage) => (
                          <Badge
                            key={stage.id}
                            variant="outline"
                            style={{ borderColor: stage.color, color: stage.color }}
                          >
                            {stage.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pipeline-name">Pipeline Name *</Label>
                  <Input
                    id="pipeline-name"
                    value={newPipeline.name}
                    onChange={(e) => setNewPipeline(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sales Pipeline"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pipeline-description">Description</Label>
                  <Input
                    id="pipeline-description"
                    value={newPipeline.description}
                    onChange={(e) => setNewPipeline(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Pipeline Stages</Label>
                  <Button onClick={addStage} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stage
                  </Button>
                </div>

                <div className="space-y-3">
                  {newPipeline.stages.map((stage, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div className="space-y-2">
                            <Label>Stage Name</Label>
                            <Input
                              value={stage.name}
                              onChange={(e) => updateStage(index, 'name', e.target.value)}
                              placeholder="Stage name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Select 
                              value={stage.color} 
                              onValueChange={(value) => updateStage(index, 'color', value)}
                            >
                              <SelectTrigger>
                                <SelectValue>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full" 
                                      style={{ backgroundColor: stage.color }}
                                    />
                                    {stage.color}
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {stageColors.map((color) => (
                                  <SelectItem key={color} value={color}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-4 h-4 rounded-full" 
                                        style={{ backgroundColor: color }}
                                      />
                                      {color}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            {newPipeline.stages.length > 2 && (
                              <Button 
                                onClick={() => removeStage(index)} 
                                variant="outline" 
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createPipeline} 
                  disabled={loading || !newPipeline.name.trim()}
                >
                  {loading ? 'Creating...' : 'Create Pipeline'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
