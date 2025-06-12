import {
  Users,
  FileText,
  Brain,
  CheckCircle,
  Eye,
  ArrowRight,
} from 'lucide-react'
import { PipelineStage } from '@/types/pipeline'

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'intake_complete',
    title: 'Intake Complete',
    icon: Users,
    color: 'bg-blue-100 text-blue-800',
    description: 'Client information collected'
  },
  {
    id: 'documents_pending',
    title: 'Documents Pending',
    icon: FileText,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Waiting for document upload'
  },
  {
    id: 'documents_received',
    title: 'Documents Received',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    description: 'Ready for AI processing'
  },
  {
    id: 'ai_processing',
    title: 'AI Processing',
    icon: Brain,
    color: 'bg-purple-100 text-purple-800',
    description: 'AI extracting data'
  },
  {
    id: 'forms_generated',
    title: 'Forms Generated',
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Tax forms auto-filled'
  },
  {
    id: 'review_needed',
    title: 'Review Needed',
    icon: Eye,
    color: 'bg-orange-100 text-orange-800',
    description: 'Professional review required'
  },
  {
    id: 'ready_to_file',
    title: 'Ready to File',
    icon: ArrowRight,
    color: 'bg-green-100 text-green-800',
    description: 'Approved and ready for e-filing'
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    color: 'bg-gray-100 text-gray-800',
    description: 'Process complete'
  }
]
