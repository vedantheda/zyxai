'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { PersonalizedChecklist, PersonalizedChecklistItem } from '@/types/document-collection'
import { documentCollectionService } from '@/lib/document-collection/DocumentCollectionService'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  ChevronDown,
  ChevronRight,
  Calendar,
  Target,
  TrendingUp,
  Info,
  ExternalLink,
  MessageSquare,
  Timer
} from 'lucide-react'

interface PersonalizedChecklistProps {
  clientId: string
  onItemComplete?: (itemId: string) => void
  onUploadDocument?: (itemId: string) => void
}

export function PersonalizedChecklist({
  clientId,
  onItemComplete,
  onUploadDocument
}: PersonalizedChecklistProps) {
  const { toast } = useToast()
  const [checklist, setChecklist] = useState<PersonalizedChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadChecklist()
  }, [clientId])

  const loadChecklist = async () => {
    try {
      setLoading(true)
      const data = await documentCollectionService.getClientChecklist(clientId)
      setChecklist(data)
    } catch (error) {
      toast({
        title: 'Error loading checklist',
        description: 'Failed to load document checklist',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleItemToggle = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleMarkComplete = async (item: PersonalizedChecklistItem) => {
    try {
      await documentCollectionService.markItemComplete(item.id, [])
      await loadChecklist()
      onItemComplete?.(item.id)

      toast({
        title: 'Item completed',
        description: `${item.title} has been marked as complete`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark item as complete',
        variant: 'destructive'
      })
    }
  }

  const handleUpload = (item: PersonalizedChecklistItem) => {
    onUploadDocument?.(item.id)
  }

  const getStatusIcon = (status: PersonalizedChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'blocked':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: PersonalizedChecklistItem['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const formatTimeEstimate = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin mr-2" />
            Loading checklist...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!checklist) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No checklist found for this client
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingItems = checklist.items.filter(item => item.status === 'pending')
  const inProgressItems = checklist.items.filter(item => item.status === 'in_progress')
  const completedItems = checklist.items.filter(item => item.status === 'completed')
  const blockedItems = checklist.items.filter(item => item.status === 'blocked')

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                {checklist.name}
              </CardTitle>
              <CardDescription>
                Document collection progress
              </CardDescription>
            </div>
            <Badge variant={checklist.status === 'completed' ? 'default' : 'secondary'}>
              {checklist.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {checklist.completedItems} of {checklist.totalItems} items
                </span>
              </div>
              <Progress value={checklist.progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedItems.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inProgressItems.length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingItems.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{blockedItems.length}</div>
                <div className="text-sm text-muted-foreground">Blocked</div>
              </div>
            </div>

            {checklist.deadline && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Deadline</span>
                </div>
                <span className="text-sm text-blue-600">
                  {checklist.deadline.toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Timer className="w-4 h-4 text-gray-600 mr-2" />
                <span className="text-sm font-medium">Time Estimate</span>
              </div>
              <span className="text-sm text-gray-600">
                {formatTimeEstimate(checklist.estimatedCompletionTime)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({pendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressItems.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedItems.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Items ({checklist.items.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ChecklistItemsList
            items={pendingItems}
            expandedItems={expandedItems}
            onToggle={handleItemToggle}
            onMarkComplete={handleMarkComplete}
            onUpload={handleUpload}
          />
        </TabsContent>

        <TabsContent value="in_progress">
          <ChecklistItemsList
            items={inProgressItems}
            expandedItems={expandedItems}
            onToggle={handleItemToggle}
            onMarkComplete={handleMarkComplete}
            onUpload={handleUpload}
          />
        </TabsContent>

        <TabsContent value="completed">
          <ChecklistItemsList
            items={completedItems}
            expandedItems={expandedItems}
            onToggle={handleItemToggle}
            onMarkComplete={handleMarkComplete}
            onUpload={handleUpload}
          />
        </TabsContent>

        <TabsContent value="all">
          <ChecklistItemsList
            items={checklist.items}
            expandedItems={expandedItems}
            onToggle={handleItemToggle}
            onMarkComplete={handleMarkComplete}
            onUpload={handleUpload}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ChecklistItemsListProps {
  items: PersonalizedChecklistItem[]
  expandedItems: Set<string>
  onToggle: (itemId: string) => void
  onMarkComplete: (item: PersonalizedChecklistItem) => void
  onUpload: (item: PersonalizedChecklistItem) => void
}

function ChecklistItemsList({
  items,
  expandedItems,
  onToggle,
  onMarkComplete,
  onUpload
}: ChecklistItemsListProps) {
  const getStatusIcon = (status: PersonalizedChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'blocked':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: PersonalizedChecklistItem['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No items in this category
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div>
            <div
              className="w-full cursor-pointer"
              onClick={() => onToggle(item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{item.title}</h3>
                        {item.isRequired && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(item.priority)}`}
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.uploadedDocuments.length > 0 && (
                      <Badge variant="secondary">
                        {item.uploadedDocuments.length} file{item.uploadedDocuments.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {expandedItems.has(item.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </CardContent>
            </div>

            {expandedItems.has(item.id) && (
              <CardContent className="pt-0 pb-4 px-4">
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h4 className="font-medium mb-2">Instructions</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.instructions}
                    </p>
                  </div>

                  {item.uploadedDocuments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Uploaded Documents</h4>
                      <div className="space-y-2">
                        {item.uploadedDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">{doc.fileName}</span>
                            </div>
                            <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                              {doc.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    {item.status !== 'completed' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onUpload(item)}
                          className="flex items-center space-x-1"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkComplete(item)}
                        >
                          Mark Complete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
