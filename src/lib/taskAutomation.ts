import { supabase } from './supabase'

export interface TaskTemplate {
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimated_duration: number
  completion_triggers?: string[]
  dependencies?: string[]
}

export interface WorkflowStage {
  stage: string
  tasks: TaskTemplate[]
}

// Predefined workflow templates for different client types
export const CLIENT_WORKFLOWS: Record<string, WorkflowStage[]> = {
  individual: [
    {
      stage: 'intake_complete',
      tasks: [
        {
          title: 'Send welcome email and document checklist',
          description: 'Send personalized welcome email with document collection checklist',
          category: 'client_communication',
          priority: 'high',
          estimated_duration: 15,
          completion_triggers: ['document_collection_setup']
        },
        {
          title: 'Set up client folder and document collection',
          description: 'Create organized folder structure and set up document collection portal',
          category: 'document_collection',
          priority: 'high',
          estimated_duration: 10,
          completion_triggers: ['client_follow_up']
        }
      ]
    },
    {
      stage: 'documents_pending',
      tasks: [
        {
          title: 'Follow up on missing documents',
          description: 'Contact client about any missing or incomplete documents',
          category: 'client_communication',
          priority: 'medium',
          estimated_duration: 20,
          completion_triggers: ['document_review']
        },
        {
          title: 'Review uploaded documents',
          description: 'Check all uploaded documents for completeness and accuracy',
          category: 'review',
          priority: 'medium',
          estimated_duration: 30,
          completion_triggers: ['form_preparation']
        }
      ]
    },
    {
      stage: 'documents_received',
      tasks: [
        {
          title: 'Organize and categorize documents',
          description: 'Sort documents by type and verify all required forms are present',
          category: 'document_collection',
          priority: 'high',
          estimated_duration: 45,
          completion_triggers: ['ai_processing']
        },
        {
          title: 'Initial document review',
          description: 'Perform preliminary review of all submitted documents',
          category: 'review',
          priority: 'medium',
          estimated_duration: 60,
          completion_triggers: ['form_preparation']
        }
      ]
    },
    {
      stage: 'ai_processing',
      tasks: [
        {
          title: 'Review AI-extracted data',
          description: 'Verify accuracy of AI-extracted information from documents',
          category: 'review',
          priority: 'high',
          estimated_duration: 30,
          completion_triggers: ['form_preparation']
        },
        {
          title: 'Resolve data extraction issues',
          description: 'Address any flagged issues or low-confidence extractions',
          category: 'review',
          priority: 'medium',
          estimated_duration: 20
        }
      ]
    },
    {
      stage: 'forms_generated',
      tasks: [
        {
          title: 'Review auto-generated tax forms',
          description: 'Thoroughly review all auto-filled tax forms for accuracy',
          category: 'form_preparation',
          priority: 'high',
          estimated_duration: 90,
          completion_triggers: ['client_approval']
        },
        {
          title: 'Calculate tax liability and refund',
          description: 'Verify tax calculations and optimize for best outcome',
          category: 'form_preparation',
          priority: 'high',
          estimated_duration: 45
        }
      ]
    },
    {
      stage: 'review_needed',
      tasks: [
        {
          title: 'Final quality review',
          description: 'Comprehensive final review of completed tax return',
          category: 'review',
          priority: 'high',
          estimated_duration: 60,
          completion_triggers: ['client_approval']
        },
        {
          title: 'Prepare client review package',
          description: 'Compile return summary and supporting documents for client review',
          category: 'client_communication',
          priority: 'medium',
          estimated_duration: 30
        }
      ]
    },
    {
      stage: 'client_approval',
      tasks: [
        {
          title: 'Send return to client for approval',
          description: 'Email completed return to client with approval instructions',
          category: 'client_communication',
          priority: 'high',
          estimated_duration: 15,
          completion_triggers: ['filing_preparation']
        },
        {
          title: 'Schedule client review meeting',
          description: 'Set up meeting to review return with client if needed',
          category: 'client_communication',
          priority: 'medium',
          estimated_duration: 10
        }
      ]
    },
    {
      stage: 'ready_to_file',
      tasks: [
        {
          title: 'Prepare e-filing submission',
          description: 'Final preparation and validation for IRS e-filing',
          category: 'filing',
          priority: 'high',
          estimated_duration: 30,
          completion_triggers: ['filing_complete']
        },
        {
          title: 'Submit tax return to IRS',
          description: 'Electronic filing of completed and approved tax return',
          category: 'filing',
          priority: 'urgent',
          estimated_duration: 15
        }
      ]
    },
    {
      stage: 'filed',
      tasks: [
        {
          title: 'Send filing confirmation to client',
          description: 'Notify client of successful filing and provide confirmation details',
          category: 'client_communication',
          priority: 'high',
          estimated_duration: 10
        },
        {
          title: 'Archive client documents',
          description: 'Organize and archive all client documents and correspondence',
          category: 'compliance',
          priority: 'medium',
          estimated_duration: 20
        }
      ]
    }
  ],
  business: [
    {
      stage: 'intake_complete',
      tasks: [
        {
          title: 'Send business tax document checklist',
          description: 'Provide comprehensive checklist for business tax documents',
          category: 'client_communication',
          priority: 'high',
          estimated_duration: 20,
          completion_triggers: ['document_collection_setup']
        },
        {
          title: 'Schedule business tax consultation',
          description: 'Set up initial consultation to discuss business tax strategy',
          category: 'client_communication',
          priority: 'high',
          estimated_duration: 15
        }
      ]
    },
    {
      stage: 'documents_received',
      tasks: [
        {
          title: 'Review business financial statements',
          description: 'Analyze P&L, balance sheet, and other financial documents',
          category: 'review',
          priority: 'high',
          estimated_duration: 120,
          completion_triggers: ['form_preparation']
        },
        {
          title: 'Verify business deductions',
          description: 'Review and validate all claimed business deductions',
          category: 'review',
          priority: 'high',
          estimated_duration: 90
        }
      ]
    }
  ]
}

export class TaskAutomationService {
  static async generateTasksForClient(clientId: string, clientType: string = 'individual', currentStage: string) {
    try {
      const workflow = CLIENT_WORKFLOWS[clientType] || CLIENT_WORKFLOWS.individual
      const stageWorkflow = workflow.find(w => w.stage === currentStage)
      
      if (!stageWorkflow) {
        console.log(`No workflow found for stage: ${currentStage}`)
        return
      }

      // Get client info
      const { data: client } = await supabase
        .from('clients')
        .select('name, user_id')
        .eq('id', clientId)
        .single()

      if (!client) {
        throw new Error('Client not found')
      }

      // Check if tasks already exist for this stage
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('client_id', clientId)
        .eq('trigger_event', `stage_${currentStage}`)

      if (existingTasks && existingTasks.length > 0) {
        console.log(`Tasks already exist for client ${clientId} stage ${currentStage}`)
        return
      }

      // Generate tasks for this stage
      const tasksToCreate = stageWorkflow.tasks.map(template => ({
        user_id: client.user_id,
        client_id: clientId,
        title: template.title.replace('{{client_name}}', client.name),
        description: template.description.replace('{{client_name}}', client.name),
        category: template.category,
        priority: template.priority,
        status: 'pending',
        estimated_duration: template.estimated_duration,
        completion_triggers: template.completion_triggers || [],
        dependencies: template.dependencies || [],
        auto_generated: true,
        trigger_event: `stage_${currentStage}`,
        progress: 0
      }))

      const { data: createdTasks, error } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select()

      if (error) throw error

      console.log(`Generated ${createdTasks.length} tasks for client ${clientId} stage ${currentStage}`)
      return createdTasks
    } catch (error) {
      console.error('Error generating tasks for client:', error)
      throw error
    }
  }

  static async advanceClientStage(clientId: string, newStage: string) {
    try {
      // Update client stage
      const { error: clientError } = await supabase
        .from('clients')
        .update({ 
          status: newStage,
          last_activity: new Date().toISOString()
        })
        .eq('id', clientId)

      if (clientError) throw clientError

      // Get client type to determine workflow
      const { data: client } = await supabase
        .from('clients')
        .select('type')
        .eq('id', clientId)
        .single()

      const clientType = client?.type || 'individual'

      // Generate tasks for new stage
      await this.generateTasksForClient(clientId, clientType, newStage)

      console.log(`Advanced client ${clientId} to stage ${newStage}`)
    } catch (error) {
      console.error('Error advancing client stage:', error)
      throw error
    }
  }

  static async completeTask(taskId: string) {
    try {
      // Get task details
      const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (!task) throw new Error('Task not found')

      // Mark task as completed
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (updateError) throw updateError

      // Generate follow-up tasks if specified
      if (task.completion_triggers && task.completion_triggers.length > 0) {
        await this.generateFollowUpTasks(task)
      }

      // Update client progress
      if (task.client_id) {
        await this.updateClientProgress(task.client_id)
      }

      console.log(`Completed task ${taskId} and triggered follow-up actions`)
    } catch (error) {
      console.error('Error completing task:', error)
      throw error
    }
  }

  static async generateFollowUpTasks(completedTask: any) {
    try {
      const followUpTemplates: Record<string, TaskTemplate> = {
        document_collection_setup: {
          title: 'Monitor document uploads',
          description: 'Check for new document uploads and follow up if needed',
          category: 'document_collection',
          priority: 'medium',
          estimated_duration: 15
        },
        document_review: {
          title: 'Process reviewed documents',
          description: 'Begin processing documents that have been reviewed',
          category: 'form_preparation',
          priority: 'high',
          estimated_duration: 60
        },
        form_preparation: {
          title: 'Quality check prepared forms',
          description: 'Review prepared tax forms for accuracy and completeness',
          category: 'review',
          priority: 'high',
          estimated_duration: 45
        },
        client_approval: {
          title: 'Process client approval',
          description: 'Handle approved return and prepare for filing',
          category: 'filing',
          priority: 'high',
          estimated_duration: 30
        }
      }

      const tasksToCreate = []

      for (const trigger of completedTask.completion_triggers) {
        const template = followUpTemplates[trigger]
        if (template) {
          tasksToCreate.push({
            user_id: completedTask.user_id,
            client_id: completedTask.client_id,
            title: template.title,
            description: template.description,
            category: template.category,
            priority: template.priority,
            status: 'pending',
            estimated_duration: template.estimated_duration,
            auto_generated: true,
            trigger_event: `completion_of_${completedTask.id}`,
            progress: 0
          })
        }
      }

      if (tasksToCreate.length > 0) {
        const { error } = await supabase
          .from('tasks')
          .insert(tasksToCreate)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error generating follow-up tasks:', error)
      throw error
    }
  }

  static async updateClientProgress(clientId: string) {
    try {
      // Get all tasks for this client
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('client_id', clientId)

      if (!tasks || tasks.length === 0) return

      // Calculate progress based on completed tasks
      const completedTasks = tasks.filter(task => task.status === 'completed').length
      const totalTasks = tasks.length
      const progressPercentage = Math.round((completedTasks / totalTasks) * 100)

      // Update client progress
      const { error } = await supabase
        .from('clients')
        .update({
          progress: progressPercentage,
          last_activity: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) throw error

      console.log(`Updated client ${clientId} progress to ${progressPercentage}%`)
    } catch (error) {
      console.error('Error updating client progress:', error)
      throw error
    }
  }

  static async initializeClientWorkflow(clientId: string, clientType: string = 'individual') {
    try {
      // Start with intake_complete stage
      await this.generateTasksForClient(clientId, clientType, 'intake_complete')
      console.log(`Initialized workflow for client ${clientId}`)
    } catch (error) {
      console.error('Error initializing client workflow:', error)
      throw error
    }
  }
}
