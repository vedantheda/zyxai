import { hubspotIntegration } from './hubspot'
import { supabaseAdmin } from '@/lib/supabase'

interface HubSpotWorkflow {
  id?: string
  name: string
  type: 'DRIP_DELAY' | 'PROPERTY_ANCHOR' | 'DATE_ANCHOR' | 'FORM_SUBMISSION' | 'CONTACT_CREATE'
  enabled: boolean
  description?: string
  contactListIds?: string[]
  goalCriteria?: any[]
  actions?: WorkflowAction[]
  enrollmentCriteria?: any[]
}

interface WorkflowAction {
  type: 'DELAY' | 'EMAIL' | 'TASK' | 'PROPERTY_UPDATE' | 'WEBHOOK' | 'IF_THEN'
  delayMillis?: number
  emailId?: string
  taskBody?: string
  taskSubject?: string
  propertyName?: string
  propertyValue?: string
  webhookUrl?: string
  conditions?: any[]
}

interface WorkflowSyncResult {
  workflowsCreated: number
  workflowsUpdated: number
  triggersCreated: number
  errors: string[]
}

class HubSpotWorkflowIntegration {
  private accessToken: string
  private baseUrl = 'https://api.hubapi.com'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HubSpot API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Create HubSpot workflow from ZyxAI workflow
  async createHubSpotWorkflow(zyxaiWorkflowId: string) {
    console.log(`⚡ Creating HubSpot workflow for ZyxAI workflow: ${zyxaiWorkflowId}`)

    try {
      // Get ZyxAI workflow details
      const { data: workflow, error } = await supabaseAdmin
        .from('workflows')
        .select(`
          *,
          workflow_steps (*)
        `)
        .eq('id', zyxaiWorkflowId)
        .single()

      if (error || !workflow) {
        throw new Error('ZyxAI workflow not found')
      }

      // Convert ZyxAI workflow to HubSpot format
      const hubspotWorkflow: HubSpotWorkflow = {
        name: `${workflow.name} (ZyxAI Automation)`,
        type: this.mapWorkflowType(workflow.trigger_type),
        enabled: workflow.is_active,
        description: `Automated workflow from ZyxAI: ${workflow.description || 'No description'}`,
        enrollmentCriteria: this.convertTriggerConditions(workflow.trigger_conditions),
        actions: this.convertWorkflowSteps(workflow.workflow_steps)
      }

      // Create workflow in HubSpot
      const hubspotWorkflowResult = await this.makeRequest('/automation/v3/workflows', {
        method: 'POST',
        body: JSON.stringify(hubspotWorkflow)
      })

      // Update ZyxAI workflow with HubSpot ID
      await supabaseAdmin
        .from('workflows')
        .update({ 
          hubspot_workflow_id: hubspotWorkflowResult.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', zyxaiWorkflowId)

      console.log(`✅ Created HubSpot workflow: ${hubspotWorkflowResult.id}`)
      return hubspotWorkflowResult

    } catch (error) {
      console.error('❌ Error creating HubSpot workflow:', error)
      throw error
    }
  }

  // Convert ZyxAI workflow steps to HubSpot actions
  private convertWorkflowSteps(steps: any[]): WorkflowAction[] {
    const actions: WorkflowAction[] = []

    for (const step of steps || []) {
      switch (step.step_type) {
        case 'delay':
          actions.push({
            type: 'DELAY',
            delayMillis: (step.config?.delay_minutes || 60) * 60 * 1000
          })
          break

        case 'send_email':
          actions.push({
            type: 'EMAIL',
            emailId: step.config?.email_template_id
          })
          break

        case 'create_task':
          actions.push({
            type: 'TASK',
            taskSubject: step.config?.task_title || 'Follow up required',
            taskBody: step.config?.task_description || 'Task created by ZyxAI workflow'
          })
          break

        case 'update_contact':
          actions.push({
            type: 'PROPERTY_UPDATE',
            propertyName: step.config?.property_name || 'zyxai_workflow_status',
            propertyValue: step.config?.property_value || 'processed'
          })
          break

        case 'webhook':
          actions.push({
            type: 'WEBHOOK',
            webhookUrl: step.config?.webhook_url
          })
          break

        case 'condition':
          actions.push({
            type: 'IF_THEN',
            conditions: step.config?.conditions || []
          })
          break

        default:
          console.log(`⚠️ Unknown step type: ${step.step_type}`)
      }
    }

    return actions
  }

  // Convert ZyxAI trigger conditions to HubSpot enrollment criteria
  private convertTriggerConditions(conditions: any): any[] {
    if (!conditions) return []

    const criteria = []

    // Convert common trigger conditions
    if (conditions.lead_score_min) {
      criteria.push({
        filterFamily: 'PropertyValue',
        property: 'zyxai_lead_score',
        operator: 'GTE',
        value: conditions.lead_score_min
      })
    }

    if (conditions.contact_status) {
      criteria.push({
        filterFamily: 'PropertyValue',
        property: 'zyxai_contact_status',
        operator: 'EQ',
        value: conditions.contact_status
      })
    }

    if (conditions.last_call_days_ago) {
      criteria.push({
        filterFamily: 'PropertyValue',
        property: 'zyxai_last_call_date',
        operator: 'LT',
        value: new Date(Date.now() - conditions.last_call_days_ago * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    return criteria
  }

  // Map ZyxAI workflow type to HubSpot type
  private mapWorkflowType(zyxaiType: string): HubSpotWorkflow['type'] {
    const typeMap: Record<string, HubSpotWorkflow['type']> = {
      'contact_created': 'CONTACT_CREATE',
      'property_changed': 'PROPERTY_ANCHOR',
      'form_submitted': 'FORM_SUBMISSION',
      'date_based': 'DATE_ANCHOR',
      'drip_sequence': 'DRIP_DELAY'
    }
    return typeMap[zyxaiType] || 'PROPERTY_ANCHOR'
  }

  // Sync workflow execution results back to ZyxAI
  async syncWorkflowResults(hubspotWorkflowId: string) {
    console.log(`📊 Syncing workflow results for: ${hubspotWorkflowId}`)

    try {
      // Get workflow execution data from HubSpot
      const workflowData = await this.makeRequest(`/automation/v3/workflows/${hubspotWorkflowId}`)
      const enrollments = await this.makeRequest(`/automation/v3/workflows/${hubspotWorkflowId}/enrollments`)

      // Find corresponding ZyxAI workflow
      const { data: zyxaiWorkflow } = await supabaseAdmin
        .from('workflows')
        .select('id, name')
        .eq('hubspot_workflow_id', hubspotWorkflowId)
        .single()

      if (!zyxaiWorkflow) {
        throw new Error('ZyxAI workflow not found')
      }

      // Update workflow statistics
      const stats = {
        total_enrollments: enrollments.total || 0,
        active_enrollments: enrollments.results?.filter(e => e.currentStepOrder > 0).length || 0,
        completed_enrollments: enrollments.results?.filter(e => e.completed).length || 0,
        last_sync_at: new Date().toISOString()
      }

      await supabaseAdmin
        .from('workflows')
        .update({
          hubspot_stats: stats,
          updated_at: new Date().toISOString()
        })
        .eq('id', zyxaiWorkflow.id)

      console.log(`✅ Synced workflow results: ${stats.total_enrollments} enrollments`)
      return stats

    } catch (error) {
      console.error('❌ Error syncing workflow results:', error)
      throw error
    }
  }

  // Create workflow triggers based on ZyxAI events
  async createWorkflowTriggers(organizationId: string) {
    console.log('🎯 Creating workflow triggers for ZyxAI events...')

    const triggers = [
      {
        name: 'ZyxAI High-Score Lead',
        description: 'Trigger when lead score exceeds 80',
        conditions: {
          filterFamily: 'PropertyValue',
          property: 'zyxai_lead_score',
          operator: 'GTE',
          value: 80
        },
        actions: [
          {
            type: 'TASK',
            taskSubject: 'High-score lead requires immediate attention',
            taskBody: 'This lead has achieved a score of 80+ and should be contacted immediately.'
          }
        ]
      },
      {
        name: 'ZyxAI Call Completed',
        description: 'Trigger when a call is completed',
        conditions: {
          filterFamily: 'PropertyValue',
          property: 'zyxai_last_call_date',
          operator: 'HAS_PROPERTY'
        },
        actions: [
          {
            type: 'DELAY',
            delayMillis: 24 * 60 * 60 * 1000 // 24 hours
          },
          {
            type: 'TASK',
            taskSubject: 'Follow up on recent call',
            taskBody: 'Follow up on the call completed yesterday.'
          }
        ]
      },
      {
        name: 'ZyxAI Qualified Lead',
        description: 'Trigger when lead becomes qualified',
        conditions: {
          filterFamily: 'PropertyValue',
          property: 'zyxai_contact_status',
          operator: 'EQ',
          value: 'qualified'
        },
        actions: [
          {
            type: 'EMAIL',
            emailId: 'qualified_lead_template'
          },
          {
            type: 'TASK',
            taskSubject: 'Send proposal to qualified lead',
            taskBody: 'This lead has been qualified and is ready for a proposal.'
          }
        ]
      }
    ]

    let triggersCreated = 0

    for (const trigger of triggers) {
      try {
        const workflow: HubSpotWorkflow = {
          name: trigger.name,
          type: 'PROPERTY_ANCHOR',
          enabled: true,
          description: trigger.description,
          enrollmentCriteria: [trigger.conditions],
          actions: trigger.actions as WorkflowAction[]
        }

        await this.makeRequest('/automation/v3/workflows', {
          method: 'POST',
          body: JSON.stringify(workflow)
        })

        triggersCreated++
        console.log(`✅ Created trigger: ${trigger.name}`)

      } catch (error) {
        console.error(`❌ Failed to create trigger ${trigger.name}:`, error)
      }
    }

    console.log(`✅ Created ${triggersCreated} workflow triggers`)
    return triggersCreated
  }

  // Sync all workflows to HubSpot
  async syncAllWorkflows(organizationId: string): Promise<WorkflowSyncResult> {
    console.log('🔄 Syncing all workflows to HubSpot...')

    const result: WorkflowSyncResult = {
      workflowsCreated: 0,
      workflowsUpdated: 0,
      triggersCreated: 0,
      errors: []
    }

    try {
      // Get workflows without HubSpot IDs
      const { data: workflows, error } = await supabaseAdmin
        .from('workflows')
        .select('id, name, is_active')
        .eq('organization_id', organizationId)
        .is('hubspot_workflow_id', null)

      if (error) throw error

      // Create new workflows
      for (const workflow of workflows || []) {
        try {
          await this.createHubSpotWorkflow(workflow.id)
          result.workflowsCreated++
        } catch (error: any) {
          result.errors.push(`Workflow ${workflow.id}: ${error.message}`)
        }
      }

      // Update existing workflows
      const { data: existingWorkflows } = await supabaseAdmin
        .from('workflows')
        .select('id, hubspot_workflow_id')
        .eq('organization_id', organizationId)
        .not('hubspot_workflow_id', 'is', null)

      for (const workflow of existingWorkflows || []) {
        try {
          await this.syncWorkflowResults(workflow.hubspot_workflow_id)
          result.workflowsUpdated++
        } catch (error: any) {
          result.errors.push(`Workflow ${workflow.id}: ${error.message}`)
        }
      }

      // Create workflow triggers
      result.triggersCreated = await this.createWorkflowTriggers(organizationId)

      console.log(`✅ Workflow sync complete! Created ${result.workflowsCreated}, updated ${result.workflowsUpdated}`)
      return result

    } catch (error) {
      console.error('❌ Error syncing workflows:', error)
      throw error
    }
  }

  // Handle workflow completion from ZyxAI
  async handleWorkflowCompletion(workflowId: string, contactId: string, result: any) {
    console.log(`🎯 Handling workflow completion: ${workflowId}`)

    try {
      // Get contact's HubSpot ID
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('hubspot_id, first_name, last_name')
        .eq('id', contactId)
        .single()

      if (!contact?.hubspot_id) {
        throw new Error('Contact has no HubSpot ID')
      }

      // Update contact with workflow completion data
      const updateData = {
        zyxai_last_workflow_completion: new Date().toISOString().split('T')[0],
        zyxai_workflow_completion_count: 1, // This would need proper calculation
        zyxai_last_workflow_result: result.status || 'completed'
      }

      await this.makeRequest(`/crm/v3/objects/contacts/${contact.hubspot_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          properties: updateData
        })
      })

      console.log(`✅ Updated contact with workflow completion: ${contact.first_name} ${contact.last_name}`)

    } catch (error) {
      console.error('❌ Error handling workflow completion:', error)
      throw error
    }
  }

  // Full workflow integration sync
  async performFullWorkflowSync(organizationId: string) {
    console.log('🚀 Starting full workflow integration sync...')

    try {
      // 1. Sync all workflows
      const syncResult = await this.syncAllWorkflows(organizationId)

      // 2. Create workflow properties if needed
      await this.createWorkflowProperties()

      console.log('🎉 Full workflow sync complete!')

      return {
        success: true,
        syncResult,
        message: `Successfully synced workflows: ${syncResult.workflowsCreated} created, ${syncResult.workflowsUpdated} updated`
      }

    } catch (error) {
      console.error('❌ Full workflow sync failed:', error)
      throw error
    }
  }

  // Create workflow-related custom properties
  private async createWorkflowProperties() {
    const properties = [
      {
        name: 'zyxai_last_workflow_completion',
        label: 'ZyxAI Last Workflow Completion',
        type: 'date',
        fieldType: 'date',
        groupName: 'zyxai_workflows',
        description: 'Date of last workflow completion'
      },
      {
        name: 'zyxai_workflow_completion_count',
        label: 'ZyxAI Workflow Completion Count',
        type: 'number',
        fieldType: 'number',
        groupName: 'zyxai_workflows',
        description: 'Total number of completed workflows'
      },
      {
        name: 'zyxai_last_workflow_result',
        label: 'ZyxAI Last Workflow Result',
        type: 'string',
        fieldType: 'text',
        groupName: 'zyxai_workflows',
        description: 'Result of last workflow execution'
      }
    ]

    for (const property of properties) {
      try {
        await this.makeRequest('/crm/v3/properties/contacts', {
          method: 'POST',
          body: JSON.stringify(property)
        })
      } catch (error: any) {
        if (!error.message.includes('409')) {
          console.error(`❌ Failed to create property ${property.name}:`, error)
        }
      }
    }
  }
}

// Export singleton instance
export const hubspotWorkflowIntegration = new HubSpotWorkflowIntegration(process.env.CRM_ACCESS_TOKEN || '')

// Export class for testing
export { HubSpotWorkflowIntegration }
