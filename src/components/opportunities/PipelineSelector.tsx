'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PipelineSelectorProps {
  pipelines?: any[]
  selectedPipeline?: string
  onPipelineChange?: (pipelineId: string) => void
}

export function PipelineSelector({ 
  pipelines = [], 
  selectedPipeline, 
  onPipelineChange 
}: PipelineSelectorProps) {
  return (
    <Select value={selectedPipeline} onValueChange={onPipelineChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select pipeline" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">Default Pipeline</SelectItem>
        {pipelines.map((pipeline) => (
          <SelectItem key={pipeline.id} value={pipeline.id}>
            {pipeline.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
