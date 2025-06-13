'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, Calendar, FileText, MoreHorizontal, User } from 'lucide-react'
import { PipelineClient } from '@/types/pipeline'
interface PipelineClientCardProps {
  client: PipelineClient
  isAdvancing: boolean
  onAdvance: (clientId: string) => void
  onView: (clientId: string) => void
}
export function PipelineClientCard({
  client,
  isAdvancing,
  onAdvance,
  onView
}: PipelineClientCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="font-medium">{client.name}</span>
          </div>
          <Badge variant="secondary" className={getPriorityColor(client.priority)}>
            {client.priority}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          {client.email}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span>{client.progress}%</span>
          </div>
          <Progress value={client.progress} className="h-2" />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <FileText className="w-3 h-3" />
            <span>{client.documents_count} docs</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(client.last_activity)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(client.id)}
          >
            <User className="w-4 h-4 mr-1" />
            View
          </Button>
          {client.status !== 'completed' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onAdvance(client.id)}
              disabled={isAdvancing}
              className={isAdvancing ? 'animate-pulse' : ''}
            >
              {isAdvancing ? (
                <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-1" />
              )}
              {isAdvancing ? 'Advancing...' : 'Advance'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
