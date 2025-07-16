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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Users,
  Plus,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
  UserPlus,
  Crown,
  Shield,
  AlertTriangle,
  Copy,
  Edit,
  Eye,
  Save,
  RefreshCw,
  ArrowRight,
  Target
} from 'lucide-react'
import { VapiSquadConfig } from '@/lib/types/VapiAdvancedConfig'

interface VapiSquadsProps {
  squads: VapiSquadConfig[]
  onChange: (squads: VapiSquadConfig[]) => void
  onSave?: () => void
  onRefresh?: () => void
}

export function VapiSquads({ squads, onChange, onSave, onRefresh }: VapiSquadsProps) {
  const [selectedSquad, setSelectedSquad] = useState<number | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const createSquad = () => {
    const newSquad: VapiSquadConfig = {
      id: `squad_${Date.now()}`,
      name: 'New Squad',
      description: '',
      members: [],
      routingStrategy: 'round_robin',
      metadata: {}
    }
    onChange([...squads, newSquad])
    setSelectedSquad(squads.length)
  }

  const updateSquad = (index: number, updates: Partial<VapiSquadConfig>) => {
    const newSquads = [...squads]
    newSquads[index] = { ...newSquads[index], ...updates }
    onChange(newSquads)
  }

  const deleteSquad = (index: number) => {
    const newSquads = squads.filter((_, i) => i !== index)
    onChange(newSquads)
    if (selectedSquad === index) {
      setSelectedSquad(null)
    } else if (selectedSquad !== null && selectedSquad > index) {
      setSelectedSquad(selectedSquad - 1)
    }
  }

  const duplicateSquad = (index: number) => {
    const squad = squads[index]
    const duplicated = {
      ...squad,
      id: `squad_${Date.now()}`,
      name: `${squad.name} (Copy)`
    }
    onChange([...squads, duplicated])
  }

  const addMember = (squadIndex: number) => {
    const squad = squads[squadIndex]
    const newMember = {
      assistantId: '',
      role: 'primary' as const,
      conditions: []
    }
    updateSquad(squadIndex, {
      members: [...squad.members, newMember]
    })
  }

  const updateMember = (squadIndex: number, memberIndex: number, updates: any) => {
    const squad = squads[squadIndex]
    const newMembers = [...squad.members]
    newMembers[memberIndex] = { ...newMembers[memberIndex], ...updates }
    updateSquad(squadIndex, { members: newMembers })
  }

  const removeMember = (squadIndex: number, memberIndex: number) => {
    const squad = squads[squadIndex]
    const newMembers = squad.members.filter((_, i) => i !== memberIndex)
    updateSquad(squadIndex, { members: newMembers })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'primary': return Crown
      case 'fallback': return Shield
      case 'escalation': return AlertTriangle
      default: return Users
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'primary': return 'bg-blue-500'
      case 'fallback': return 'bg-green-500'
      case 'escalation': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'round_robin': return ArrowRight
      case 'priority': return Crown
      case 'load_balanced': return Target
      case 'conditional': return Settings
      default: return Users
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                VAPI Squads Management
              </CardTitle>
              <CardDescription>
                Create and manage multi-assistant squads for complex call routing
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onRefresh && (
                <Button onClick={onRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              <Button onClick={createSquad} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Squad
              </Button>
              {onSave && (
                <Button onClick={onSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squads List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Squads</h3>
          
          {squads.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h4 className="font-semibold mb-2">No Squads</h4>
                  <p className="text-sm mb-4">Create your first squad to get started</p>
                  <Button onClick={createSquad} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Squad
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {squads.map((squad, index) => {
            const StrategyIcon = getStrategyIcon(squad.routingStrategy)
            
            return (
              <Card 
                key={squad.id} 
                className={`cursor-pointer transition-colors ${
                  selectedSquad === index ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedSquad(index)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{squad.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {squad.members.length} members
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateSquad(index)
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSquad(index)
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <StrategyIcon className="h-3 w-3" />
                      {squad.routingStrategy.replace('_', ' ')}
                    </Badge>
                    {squad.members.map((member, memberIndex) => {
                      const RoleIcon = getRoleIcon(member.role)
                      return (
                        <Badge key={memberIndex} variant="secondary" className="flex items-center gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {member.role}
                        </Badge>
                      )
                    })}
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* Squad Editor */}
        <div className="lg:col-span-2">
          {selectedSquad !== null && squads[selectedSquad] ? (
            <div className="space-y-6">
              {/* Squad Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Squad Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Squad Name</Label>
                      <Input
                        value={squads[selectedSquad].name}
                        onChange={(e) => updateSquad(selectedSquad, { name: e.target.value })}
                        placeholder="Enter squad name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Routing Strategy</Label>
                      <Select
                        value={squads[selectedSquad].routingStrategy}
                        onValueChange={(value) => updateSquad(selectedSquad, { routingStrategy: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round_robin">Round Robin</SelectItem>
                          <SelectItem value="priority">Priority Based</SelectItem>
                          <SelectItem value="load_balanced">Load Balanced</SelectItem>
                          <SelectItem value="conditional">Conditional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={squads[selectedSquad].description}
                      onChange={(e) => updateSquad(selectedSquad, { description: e.target.value })}
                      placeholder="Describe the purpose of this squad"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Squad Members */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Squad Members</CardTitle>
                    <Button onClick={() => addMember(selectedSquad)} size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {squads[selectedSquad].members.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h4 className="font-semibold mb-2">No Members</h4>
                      <p className="text-sm">Add assistants to this squad</p>
                    </div>
                  )}

                  {squads[selectedSquad].members.map((member, memberIndex) => {
                    const RoleIcon = getRoleIcon(member.role)
                    
                    return (
                      <div key={memberIndex} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getRoleColor(member.role)}`}>
                              <RoleIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">Member {memberIndex + 1}</h4>
                              <Badge variant="secondary">{member.role}</Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeMember(selectedSquad, memberIndex)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Assistant ID</Label>
                            <Input
                              value={member.assistantId}
                              onChange={(e) => updateMember(selectedSquad, memberIndex, { assistantId: e.target.value })}
                              placeholder="Enter assistant ID"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                              value={member.role}
                              onValueChange={(value) => updateMember(selectedSquad, memberIndex, { role: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="primary">Primary</SelectItem>
                                <SelectItem value="fallback">Fallback</SelectItem>
                                <SelectItem value="escalation">Escalation</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Routing Conditions</Label>
                          <Textarea
                            value={member.conditions?.join('\n') || ''}
                            onChange={(e) => updateMember(selectedSquad, memberIndex, { 
                              conditions: e.target.value.split('\n').filter(c => c.trim()) 
                            })}
                            placeholder="Enter routing conditions (one per line)&#10;e.g., user.intent === 'sales'&#10;call.duration > 300"
                            rows={3}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Squad Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Squad Metadata</CardTitle>
                  <CardDescription>
                    Additional configuration and tracking data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Metadata (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(squads[selectedSquad].metadata || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const metadata = JSON.parse(e.target.value)
                          updateSquad(selectedSquad, { metadata })
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      placeholder={`{
  "department": "sales",
  "priority": "high",
  "timezone": "UTC"
}`}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a Squad</h3>
                  <p>Choose a squad from the list to view and edit its configuration</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          <strong>VAPI Squads:</strong> Squads enable sophisticated call routing with multiple assistants. Configure primary, fallback, and escalation assistants with conditional logic for optimal call handling.
        </AlertDescription>
      </Alert>
    </div>
  )
}
