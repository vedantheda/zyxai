import { PIPELINE_STAGES } from '@/constants/pipeline'
import { ClientStatus, PipelineClient, DatabaseClient } from '@/types/pipeline'

/**
 * Maps a database client to a pipeline client status
 */
export function mapClientStatusToPipeline(client: DatabaseClient): ClientStatus {
  // First check if client has explicit pipeline_stage field
  if (client.pipeline_stage && PIPELINE_STAGES.find(s => s.id === client.pipeline_stage)) {
    return client.pipeline_stage as ClientStatus
  }

  // Fallback: Map existing client status to pipeline stages based on progress
  if (client.status === 'pending') return 'intake_complete'
  if (client.status === 'complete') return 'completed'

  // For active clients, determine stage by progress
  const progress = client.progress || 0
  if (progress < 12.5) return 'intake_complete'
  if (progress < 25) return 'documents_pending'
  if (progress < 37.5) return 'documents_received'
  if (progress < 50) return 'ai_processing'
  if (progress < 62.5) return 'forms_generated'
  if (progress < 75) return 'review_needed'
  if (progress < 87.5) return 'client_approval'
  if (progress < 100) return 'ready_to_file'

  return 'intake_complete'
}

/**
 * Calculates estimated completion date based on current progress
 */
export function calculateEstimatedCompletion(client: DatabaseClient): string {
  // Simple estimation based on current progress
  const daysRemaining = Math.max(1, Math.ceil((100 - (client.progress || 0)) / 10))
  const date = new Date()
  date.setDate(date.getDate() + daysRemaining)
  return date.toLocaleDateString()
}

/**
 * Transforms a database client to a pipeline client
 */
export function transformDatabaseClientToPipelineClient(client: DatabaseClient): PipelineClient {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    status: mapClientStatusToPipeline(client),
    progress: client.progress || 0,
    documents_count: client.documents_count || 0,
    forms_count: client.forms_count || 0,
    last_activity: client.last_activity || new Date().toISOString(),
    priority: client.priority || 'medium',
    estimated_completion: calculateEstimatedCompletion(client)
  }
}

/**
 * Gets the next stage in the pipeline
 */
export function getNextPipelineStage(currentStatus: ClientStatus): {
  nextStage: typeof PIPELINE_STAGES[0] | null
  isAtFinalStage: boolean
} {
  const currentStageIndex = PIPELINE_STAGES.findIndex(stage => stage.id === currentStatus)

  if (currentStageIndex === -1) {
    throw new Error(`Current stage ${currentStatus} not found in pipeline`)
  }

  const nextStageIndex = Math.min(currentStageIndex + 1, PIPELINE_STAGES.length - 1)
  const isAtFinalStage = currentStageIndex === nextStageIndex

  return {
    nextStage: isAtFinalStage ? null : PIPELINE_STAGES[nextStageIndex],
    isAtFinalStage
  }
}

/**
 * Calculates progress percentage based on stage position
 */
export function calculateProgressFromStage(stageIndex: number): number {
  return Math.round(((stageIndex + 1) / PIPELINE_STAGES.length) * 100)
}
