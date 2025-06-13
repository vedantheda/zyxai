import { LucideIcon } from 'lucide-react'
// Client status in the pipeline
export type ClientStatus =
  | 'intake_complete'      // Just completed intake
  | 'documents_pending'    // Waiting for documents
  | 'documents_received'   // Documents uploaded, ready for AI
  | 'ai_processing'        // AI is processing documents
  | 'forms_generated'      // Tax forms auto-filled
  | 'review_needed'        // Needs professional review
  | 'client_approval'      // Waiting for client approval
  | 'ready_to_file'        // Ready for e-filing
  | 'filed'               // Return filed
  | 'completed'           // Process complete
export interface PipelineClient {
  id: string
  name: string
  email: string
  status: ClientStatus
  progress: number
  documents_count: number
  forms_count: number
  last_activity: string
  priority: 'high' | 'medium' | 'low'
  estimated_completion: string
}
export interface PipelineStage {
  id: ClientStatus
  title: string
  icon: LucideIcon
  color: string
  description: string
}
export interface PipelineStageWithCount extends PipelineStage {
  count: number
}
// Database client type (what comes from Supabase)
export interface DatabaseClient {
  id: string
  name: string
  email: string
  status: string
  progress: number
  documents_count?: number
  last_activity?: string
  priority?: 'high' | 'medium' | 'low'
  pipeline_stage?: ClientStatus
  created_at: string
  updated_at: string
}
// Client update data type
export interface ClientUpdateData {
  status?: string
  progress?: number
  pipeline_stage?: ClientStatus
  last_activity?: string
}
