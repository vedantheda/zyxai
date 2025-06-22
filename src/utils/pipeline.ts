import { 
  PIPELINE_STAGES, 
  STATUS_TO_STAGE_MAP, 
  STAGE_PROGRESS_MAP,
  PIPELINE_CONFIG 
} from '@/constants/pipeline'
import type { 
  PipelineClient, 
  DatabaseClient, 
  PipelineStageInfo,
  StageTransition 
} from '@/types/pipeline'

/**
 * Transform a database client to a pipeline client format
 */
export function transformDatabaseClientToPipelineClient(dbClient: DatabaseClient): PipelineClient {
  // Determine the pipeline stage from status or explicit pipeline_stage
  const pipelineStage = dbClient.pipeline_stage || STATUS_TO_STAGE_MAP[dbClient.status] || 'intake'
  
  // Calculate estimated completion date
  const estimatedCompletion = calculateEstimatedCompletion(pipelineStage, dbClient.created_at)
  
  // Calculate days in current stage
  const daysInStage = calculateDaysInStage(dbClient.updated_at)
  
  return {
    id: dbClient.id,
    name: dbClient.name,
    email: dbClient.email,
    phone: dbClient.phone || undefined,
    type: dbClient.type,
    status: pipelineStage,
    priority: dbClient.priority,
    progress: dbClient.progress,
    estimated_completion: estimatedCompletion,
    last_activity: dbClient.last_activity,
    created_at: dbClient.created_at,
    updated_at: dbClient.updated_at,
    pipeline_stage: pipelineStage,
    days_in_current_stage: daysInStage,
    documents_count: dbClient.documents_count,
    next_action: getNextAction(pipelineStage)
  }
}

/**
 * Get the next stage in the pipeline
 */
export function getNextPipelineStage(currentStageId: string): {
  nextStage: PipelineStageInfo | null
  isAtFinalStage: boolean
} {
  const currentStage = PIPELINE_STAGES.find(stage => stage.id === currentStageId)
  
  if (!currentStage) {
    return { nextStage: null, isAtFinalStage: false }
  }
  
  // If already completed, can't advance further
  if (currentStageId === 'completed') {
    return { nextStage: null, isAtFinalStage: true }
  }
  
  // Find next stage by order
  const nextStage = PIPELINE_STAGES.find(stage => stage.order === currentStage.order + 1)
  
  // If no next stage found, assume we're at the final stage
  if (!nextStage) {
    return { nextStage: null, isAtFinalStage: true }
  }
  
  return { nextStage, isAtFinalStage: false }
}

/**
 * Get the previous stage in the pipeline
 */
export function getPreviousPipelineStage(currentStageId: string): {
  previousStage: PipelineStageInfo | null
  isAtFirstStage: boolean
} {
  const currentStage = PIPELINE_STAGES.find(stage => stage.id === currentStageId)
  
  if (!currentStage) {
    return { previousStage: null, isAtFirstStage: false }
  }
  
  // If at intake, can't go back further
  if (currentStageId === 'intake') {
    return { previousStage: null, isAtFirstStage: true }
  }
  
  // Find previous stage by order
  const previousStage = PIPELINE_STAGES.find(stage => stage.order === currentStage.order - 1)
  
  return { 
    previousStage: previousStage || null, 
    isAtFirstStage: !previousStage 
  }
}

/**
 * Calculate progress percentage based on stage
 */
export function calculateProgressFromStage(stageIndex: number): number {
  const totalStages = PIPELINE_STAGES.length - 1 // Exclude pending stage
  const progress = Math.round((stageIndex / totalStages) * 100)
  return Math.min(Math.max(progress, 0), 100)
}

/**
 * Calculate progress percentage based on stage ID
 */
export function getProgressForStage(stageId: string): number {
  return STAGE_PROGRESS_MAP[stageId] || 0
}

/**
 * Calculate estimated completion date
 */
export function calculateEstimatedCompletion(currentStage: string, startDate: string): string {
  const start = new Date(startDate)
  const currentStageInfo = PIPELINE_STAGES.find(s => s.id === currentStage)
  
  if (!currentStageInfo) {
    return 'Unknown'
  }
  
  // Calculate remaining days based on remaining stages
  let remainingDays = 0
  const remainingStages = PIPELINE_STAGES.filter(s => s.order >= currentStageInfo.order && s.id !== 'pending')
  
  remainingStages.forEach(stage => {
    remainingDays += PIPELINE_CONFIG.estimatedDaysPerStage[stage.id] || 0
  })
  
  const estimatedDate = new Date(start)
  estimatedDate.setDate(estimatedDate.getDate() + remainingDays)
  
  return estimatedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Calculate days in current stage
 */
export function calculateDaysInStage(lastUpdated: string): number {
  const lastUpdate = new Date(lastUpdated)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - lastUpdate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Get next action for a stage
 */
export function getNextAction(stageId: string): string {
  const actionMap: Record<string, string> = {
    'intake': 'Complete client intake form',
    'document_collection': 'Collect required tax documents',
    'document_review': 'Review and organize documents',
    'tax_preparation': 'Prepare tax returns',
    'review_approval': 'Review with client and get approval',
    'filing': 'File tax returns electronically',
    'completed': 'Process completed',
    'pending': 'Waiting for client response'
  }
  
  return actionMap[stageId] || 'No action required'
}

/**
 * Validate stage transition
 */
export function validateStageTransition(fromStage: string, toStage: string): StageTransition {
  const fromStageInfo = PIPELINE_STAGES.find(s => s.id === fromStage)
  const toStageInfo = PIPELINE_STAGES.find(s => s.id === toStage)
  
  if (!fromStageInfo || !toStageInfo) {
    return {
      from_stage: fromStage,
      to_stage: toStage,
      is_valid: false
    }
  }
  
  // Allow moving to pending from any stage
  if (toStage === 'pending') {
    return {
      from_stage: fromStage,
      to_stage: toStage,
      is_valid: true
    }
  }
  
  // Allow moving from pending to any stage
  if (fromStage === 'pending') {
    return {
      from_stage: fromStage,
      to_stage: toStage,
      is_valid: true
    }
  }
  
  // Normal progression: can only move to next stage or back one stage
  const isForward = toStageInfo.order === fromStageInfo.order + 1
  const isBackward = toStageInfo.order === fromStageInfo.order - 1
  
  return {
    from_stage: fromStage,
    to_stage: toStage,
    is_valid: isForward || isBackward,
    requires_approval: PIPELINE_CONFIG.requiresApproval.includes(toStage),
    auto_advance: PIPELINE_CONFIG.autoAdvanceStages.includes(toStage)
  }
}

/**
 * Get stage by ID
 */
export function getStageById(stageId: string): PipelineStageInfo | null {
  return PIPELINE_STAGES.find(stage => stage.id === stageId) || null
}

/**
 * Get all stages except pending (for normal pipeline flow)
 */
export function getNormalPipelineStages(): PipelineStageInfo[] {
  return PIPELINE_STAGES.filter(stage => stage.id !== 'pending').sort((a, b) => a.order - b.order)
}

/**
 * Check if client is overdue in current stage
 */
export function isClientOverdue(client: PipelineClient): boolean {
  if (!client.days_in_current_stage) return false
  
  const expectedDays = PIPELINE_CONFIG.estimatedDaysPerStage[client.status] || 7
  return client.days_in_current_stage > expectedDays * 1.5 // 50% buffer
}

/**
 * Get pipeline statistics for a list of clients
 */
export function calculatePipelineStats(clients: PipelineClient[]) {
  const stats = {
    total: clients.length,
    by_stage: {} as Record<string, number>,
    average_progress: 0,
    overdue_count: 0
  }
  
  // Count clients by stage
  PIPELINE_STAGES.forEach(stage => {
    stats.by_stage[stage.id] = clients.filter(c => c.status === stage.id).length
  })
  
  // Calculate average progress
  if (clients.length > 0) {
    stats.average_progress = Math.round(
      clients.reduce((sum, client) => sum + client.progress, 0) / clients.length
    )
  }
  
  // Count overdue clients
  stats.overdue_count = clients.filter(isClientOverdue).length
  
  return stats
}
