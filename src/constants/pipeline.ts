import {
  UserPlus,
  FileText,
  Search,
  Calculator,
  CheckCircle,
  Send,
  Archive,
  Clock
} from 'lucide-react'

export interface PipelineStage {
  id: string
  title: string
  description: string
  icon: any
  color: string
  order: number
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'intake',
    title: 'Client Intake',
    description: 'Initial client onboarding and information gathering',
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-800',
    order: 1
  },
  {
    id: 'document_collection',
    title: 'Document Collection',
    description: 'Gathering required tax documents from client',
    icon: FileText,
    color: 'bg-yellow-100 text-yellow-800',
    order: 2
  },
  {
    id: 'document_review',
    title: 'Document Review',
    description: 'Reviewing and organizing collected documents',
    icon: Search,
    color: 'bg-orange-100 text-orange-800',
    order: 3
  },
  {
    id: 'tax_preparation',
    title: 'Tax Preparation',
    description: 'Preparing tax returns and calculations',
    icon: Calculator,
    color: 'bg-purple-100 text-purple-800',
    order: 4
  },
  {
    id: 'review_approval',
    title: 'Review & Approval',
    description: 'Final review and client approval of tax returns',
    icon: CheckCircle,
    color: 'bg-indigo-100 text-indigo-800',
    order: 5
  },
  {
    id: 'filing',
    title: 'Filing',
    description: 'Electronic filing of tax returns',
    icon: Send,
    color: 'bg-green-100 text-green-800',
    order: 6
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'Tax return filed and process completed',
    icon: Archive,
    color: 'bg-gray-100 text-gray-800',
    order: 7
  },
  {
    id: 'pending',
    title: 'Pending',
    description: 'Waiting for client response or additional information',
    icon: Clock,
    color: 'bg-red-100 text-red-800',
    order: 8
  }
]

// Pipeline stage mappings for database status values
export const STATUS_TO_STAGE_MAP: Record<string, string> = {
  'active': 'intake',
  'pending': 'pending',
  'complete': 'completed',
  'inactive': 'pending'
}

export const STAGE_TO_STATUS_MAP: Record<string, string> = {
  'intake': 'active',
  'document_collection': 'active',
  'document_review': 'active',
  'tax_preparation': 'active',
  'review_approval': 'active',
  'filing': 'active',
  'completed': 'complete',
  'pending': 'pending'
}

// Progress percentages for each stage
export const STAGE_PROGRESS_MAP: Record<string, number> = {
  'intake': 10,
  'document_collection': 25,
  'document_review': 40,
  'tax_preparation': 60,
  'review_approval': 80,
  'filing': 95,
  'completed': 100,
  'pending': 5
}

// Default pipeline configuration
export const PIPELINE_CONFIG = {
  defaultStage: 'intake',
  finalStage: 'completed',
  pendingStage: 'pending',
  autoAdvanceStages: ['document_collection', 'document_review'],
  requiresApproval: ['review_approval', 'filing'],
  estimatedDaysPerStage: {
    'intake': 1,
    'document_collection': 7,
    'document_review': 2,
    'tax_preparation': 5,
    'review_approval': 3,
    'filing': 1,
    'completed': 0,
    'pending': 0
  }
}
