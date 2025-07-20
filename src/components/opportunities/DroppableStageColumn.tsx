'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DroppableStageColumnProps {
  stageId: string
  children: React.ReactNode
}

export function DroppableStageColumn({ stageId, children }: DroppableStageColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: stageId,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-all duration-200',
        isOver && 'ring-2 ring-primary ring-offset-2 rounded-lg'
      )}
    >
      {children}
    </div>
  )
}
