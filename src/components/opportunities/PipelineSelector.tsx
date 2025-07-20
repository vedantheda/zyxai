'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, Plus } from 'lucide-react'

interface Pipeline {
  id: string
  name: string
  stages: Stage[]
  isDefault?: boolean
}

interface Stage {
  id: string
  name: string
  probability: number
  color: string
  order: number
}

interface PipelineSelectorProps {
  pipelines: Pipeline[]
  selectedPipeline: string
  onPipelineChange: (pipelineId: string) => void
  showManageButton?: boolean
  onManagePipelines?: () => void
}

export function PipelineSelector({
  pipelines,
  selectedPipeline,
  onPipelineChange,
  showManageButton = true,
  onManagePipelines
}: PipelineSelectorProps) {
  const selectedPipelineData = pipelines.find(p => p.id === selectedPipeline)

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedPipeline} onValueChange={onPipelineChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select pipeline">
            {selectedPipelineData && (
              <div className="flex items-center gap-2">
                <span>{selectedPipelineData.name}</span>
                {selectedPipelineData.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {pipelines.map((pipeline) => (
            <SelectItem key={pipeline.id} value={pipeline.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span>{pipeline.name}</span>
                  {pipeline.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {pipeline.stages.length} stages
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showManageButton && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onManagePipelines}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Pipeline
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManagePipelines}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
