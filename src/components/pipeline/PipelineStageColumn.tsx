'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PipelineStageWithCount } from '@/types/pipeline'

interface PipelineStageColumnProps {
  stage: PipelineStageWithCount
  isSelected: boolean
  onClick: () => void
}

export function PipelineStageColumn({ stage, isSelected, onClick }: PipelineStageColumnProps) {
  const Icon = stage.icon

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4" />
            <span className="font-medium">{stage.count}</span>
          </div>
          <Badge variant="secondary" className={stage.color}>
            {stage.title}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">
          {stage.description}
        </p>
      </CardContent>
    </Card>
  )
}
