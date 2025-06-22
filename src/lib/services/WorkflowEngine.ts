import { supabase } from '@/lib/supabase'

export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'branch'
  name: string
  description: string
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[] // IDs of connected nodes
}

export interface WorkflowTrigger extends WorkflowNode {
  type: 'trigger'
  triggerType: 'call_completed' | 'campaign_started' | 'contact_added' | 'manual' | 'scheduled' | 'webhook'
  conditions?: Record<string, any>
}

export interface WorkflowAction extends WorkflowNode {
  type: 'action'
  actionType: 'send_email' | 'create_task' | 'update_contact' | 'make_call' | 'sync_crm' | 'send_sms' | 'create_deal'
  parameters: Record<string, any>
}

export interface WorkflowCondition extends WorkflowNode {
  type: 'condition'
  conditionType: 'if_then' | 'switch' | 'filter'
  logic: 'and' | 'or'
  rules: Array<{
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists'
    value: any
  }>
  truePath: string[]
  falsePath: string[]
}

export interface WorkflowDelay extends WorkflowNode {
  type: 'delay'
  delayType: 'fixed' | 'dynamic'
  duration: number // in seconds
  unit: 'seconds' | 'minutes' | 'hours' | 'days'
}

export interface Workflow {
  id: string
  name: string
  description: string
  organization_id: string
  is_active: boolean
  trigger: WorkflowTrigger
  nodes: WorkflowNode[]
  created_at: string
  updated_at: string
  created_by: string
  version: number
  execution_count: number
  success_rate: number
  last_executed: string | null
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  trigger_data: Record<string, any>
  status: 'running' | 'completed' | 'failed' | 'paused'
  current_node: string | null
  execution_path: string[]
  started_at: string
  completed_at: string | null
  error_message: string | null
  context: Record<string, any>
}

export class WorkflowEngine {
  /**
   * Create a new workflow
   */
  static async createWorkflow(
    organizationId: string,
    workflowData: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'success_rate' | 'last_executed'>
  ): Promise<{ workflow: Workflow | null; error: string | null }> {
    try {
      console.log(`🔧 Creating workflow: ${workflowData.name}`)

      const workflow: Workflow = {
        ...workflowData,
        id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        execution_count: 0,
        success_rate: 0,
        last_executed: null
      }

      const { data, error } = await supabase
        .from('workflows')
        .insert(workflow)
        .select()
        .single()

      if (error) {
        console.error('Failed to create workflow:', error)
        return { workflow: null, error: error.message }
      }

      console.log('✅ Workflow created successfully')
      return { workflow: data, error: null }

    } catch (error: any) {
      console.error('Workflow creation failed:', error)
      return { workflow: null, error: error.message }
    }
  }

  /**
   * Execute a workflow
   */
  static async executeWorkflow(
    workflowId: string,
    triggerData: Record<string, any>
  ): Promise<{ execution: WorkflowExecution | null; error: string | null }> {
    try {
      console.log(`🚀 Executing workflow: ${workflowId}`)

      // Get workflow definition
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (workflowError || !workflow) {
        return { execution: null, error: 'Workflow not found' }
      }

      if (!workflow.is_active) {
        return { execution: null, error: 'Workflow is not active' }
      }

      // Create execution record
      const execution: WorkflowExecution = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workflow_id: workflowId,
        trigger_data: triggerData,
        status: 'running',
        current_node: workflow.trigger.id,
        execution_path: [workflow.trigger.id],
        started_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        context: { ...triggerData }
      }

      const { data: executionData, error: executionError } = await supabase
        .from('workflow_executions')
        .insert(execution)
        .select()
        .single()

      if (executionError) {
        return { execution: null, error: executionError.message }
      }

      // Execute workflow asynchronously
      this.processWorkflowExecution(execution, workflow).catch(error => {
        console.error('Workflow execution failed:', error)
      })

      return { execution: executionData, error: null }

    } catch (error: any) {
      console.error('Workflow execution failed:', error)
      return { execution: null, error: error.message }
    }
  }

  /**
   * Process workflow execution
   */
  private static async processWorkflowExecution(
    execution: WorkflowExecution,
    workflow: Workflow
  ): Promise<void> {
    try {
      console.log(`⚙️ Processing workflow execution: ${execution.id}`)

      let currentNode = workflow.trigger
      let context = { ...execution.context }

      // Process each node in the workflow
      while (currentNode) {
        console.log(`📍 Processing node: ${currentNode.name} (${currentNode.type})`)

        // Update current node in execution
        await supabase
          .from('workflow_executions')
          .update({ 
            current_node: currentNode.id,
            execution_path: [...execution.execution_path, currentNode.id],
            context: context
          })
          .eq('id', execution.id)

        // Process node based on type
        const result = await this.processNode(currentNode, context, workflow)
        
        if (result.error) {
          // Mark execution as failed
          await supabase
            .from('workflow_executions')
            .update({
              status: 'failed',
              error_message: result.error,
              completed_at: new Date().toISOString()
            })
            .eq('id', execution.id)
          return
        }

        // Update context with result
        context = { ...context, ...result.context }

        // Get next node
        currentNode = result.nextNode ? 
          workflow.nodes.find(n => n.id === result.nextNode) || null : 
          null
      }

      // Mark execution as completed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          context: context
        })
        .eq('id', execution.id)

      // Update workflow statistics
      await this.updateWorkflowStats(workflow.id)

      console.log('✅ Workflow execution completed successfully')

    } catch (error: any) {
      console.error('Workflow processing failed:', error)
      
      // Mark execution as failed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id)
    }
  }

  /**
   * Process individual workflow node
   */
  private static async processNode(
    node: WorkflowNode,
    context: Record<string, any>,
    workflow: Workflow
  ): Promise<{
    nextNode: string | null
    context: Record<string, any>
    error: string | null
  }> {
    try {
      switch (node.type) {
        case 'trigger':
          // Trigger nodes are entry points, move to first connected node
          return {
            nextNode: node.connections[0] || null,
            context,
            error: null
          }

        case 'action':
          const actionResult = await this.executeAction(node as WorkflowAction, context)
          return {
            nextNode: node.connections[0] || null,
            context: { ...context, ...actionResult.context },
            error: actionResult.error
          }

        case 'condition':
          const conditionResult = await this.evaluateCondition(node as WorkflowCondition, context)
          return {
            nextNode: conditionResult.nextNode,
            context: { ...context, ...conditionResult.context },
            error: conditionResult.error
          }

        case 'delay':
          const delayResult = await this.processDelay(node as WorkflowDelay, context)
          return {
            nextNode: node.connections[0] || null,
            context: { ...context, ...delayResult.context },
            error: delayResult.error
          }

        default:
          return {
            nextNode: node.connections[0] || null,
            context,
            error: null
          }
      }
    } catch (error: any) {
      return {
        nextNode: null,
        context,
        error: error.message
      }
    }
  }

  /**
   * Execute workflow action
   */
  private static async executeAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<{ context: Record<string, any>; error: string | null }> {
    try {
      console.log(`🎬 Executing action: ${action.actionType}`)

      switch (action.actionType) {
        case 'send_email':
          return await this.sendEmail(action.parameters, context)
        
        case 'create_task':
          return await this.createTask(action.parameters, context)
        
        case 'update_contact':
          return await this.updateContact(action.parameters, context)
        
        case 'make_call':
          return await this.makeCall(action.parameters, context)
        
        case 'sync_crm':
          return await this.syncCRM(action.parameters, context)
        
        case 'send_sms':
          return await this.sendSMS(action.parameters, context)
        
        case 'create_deal':
          return await this.createDeal(action.parameters, context)
        
        default:
          return { context: {}, error: `Unknown action type: ${action.actionType}` }
      }
    } catch (error: any) {
      return { context: {}, error: error.message }
    }
  }

  /**
   * Evaluate workflow condition
   */
  private static async evaluateCondition(
    condition: WorkflowCondition,
    context: Record<string, any>
  ): Promise<{ nextNode: string | null; context: Record<string, any>; error: string | null }> {
    try {
      console.log(`🔍 Evaluating condition: ${condition.conditionType}`)

      let result = false

      for (const rule of condition.rules) {
        const fieldValue = this.getFieldValue(rule.field, context)
        const ruleResult = this.evaluateRule(fieldValue, rule.operator, rule.value)

        if (condition.logic === 'and') {
          result = result && ruleResult
        } else {
          result = result || ruleResult
        }
      }

      const nextPath = result ? condition.truePath : condition.falsePath
      const nextNode = nextPath[0] || null

      return {
        nextNode,
        context: { ...context, [`${condition.id}_result`]: result },
        error: null
      }
    } catch (error: any) {
      return { nextNode: null, context, error: error.message }
    }
  }

  /**
   * Process workflow delay
   */
  private static async processDelay(
    delay: WorkflowDelay,
    context: Record<string, any>
  ): Promise<{ context: Record<string, any>; error: string | null }> {
    try {
      console.log(`⏱️ Processing delay: ${delay.duration} ${delay.unit}`)

      let delayMs = delay.duration * 1000 // Convert to milliseconds

      switch (delay.unit) {
        case 'minutes':
          delayMs *= 60
          break
        case 'hours':
          delayMs *= 60 * 60
          break
        case 'days':
          delayMs *= 60 * 60 * 24
          break
      }

      // For demo purposes, we'll use a shorter delay
      const actualDelay = Math.min(delayMs, 5000) // Max 5 seconds for demo

      await new Promise(resolve => setTimeout(resolve, actualDelay))

      return {
        context: { ...context, [`${delay.id}_delayed_at`]: new Date().toISOString() },
        error: null
      }
    } catch (error: any) {
      return { context, error: error.message }
    }
  }

  /**
   * Helper methods for actions
   */
  private static async sendEmail(
    parameters: Record<string, any>,
    context: Record<string, any>
  ): Promise<{ context: Record<string, any>; error: string | null }> {
    // Simulate email sending
    console.log(`📧 Sending email to: ${parameters.to}`)
    return {
      context: { email_sent: true, email_sent_at: new Date().toISOString() },
      error: null
    }
  }

  private static async createTask(
    parameters: Record<string, any>,
    context: Record<string, any>
  ): Promise<{ context: Record<string, any>; error: string | null }> {
    // Simulate task creation
    console.log(`📋 Creating task: ${parameters.title}`)
    return {
      context: { task_created: true, task_id: `task-${Date.now()}` },
      error: null
    }
  }

  private static async updateContact(
    parameters: Record<string, any>,
    context: Record<string, any>
  ): Promise<{ context: Record<string, any>; error: string | null }> {
    // Simulate contact update
    console.log(`👤 Updating contact: ${parameters.contact_id}`)
    return {
      context: { contact_updated: true, updated_fields: parameters.fields },
      error: null
    }
  }

  private static async makeCall(
    parameters: Record<string, any>,
    context: Record<string, any>
  ): Promise<{ context: Record<string, any>; error: string | null }> {
    // Simulate call initiation
    console.log(`📞 Making call to: ${parameters.phone}`)
    return {
      context: { call_initiated: true, call_id: `call-${Date.now()}` },
      error: null
    }
  }

  private static async syncCRM(
    parameters: Record<string, any>,
    context: Record<string, any>
  ): Promise<{ context: Record<string, any>; error: string | null }> {
    // Simulate CRM sync
    console.log(`🔄 Syncing to CRM: ${parameters.crm_type}`)
    return {
      context: { crm_synced: true, sync_timestamp: new Date().toISOString() },
      error: null
    }
  }

  private static async sendSMS(
    parameters: Record<string, any>,
    context: Record<string, any>
  ): Promise<{ context: Record<string, any>; error: string | null }> {
    // Simulate SMS sending
    console.log(`💬 Sending SMS to: ${parameters.phone}`)
    return {
      context: { sms_sent: true, sms_sent_at: new Date().toISOString() },
      error: null
    }
  }

  private static async createDeal(
    parameters: Record<string, any>,
    context: Record<string, any>
  ): Promise<{ context: Record<string, any>; error: string | null }> {
    // Simulate deal creation
    console.log(`💰 Creating deal: ${parameters.title}`)
    return {
      context: { deal_created: true, deal_id: `deal-${Date.now()}`, deal_value: parameters.value },
      error: null
    }
  }

  /**
   * Helper methods
   */
  private static getFieldValue(field: string, context: Record<string, any>): any {
    return field.split('.').reduce((obj, key) => obj?.[key], context)
  }

  private static evaluateRule(fieldValue: any, operator: string, value: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'not_equals':
        return fieldValue !== value
      case 'contains':
        return String(fieldValue).includes(String(value))
      case 'greater_than':
        return Number(fieldValue) > Number(value)
      case 'less_than':
        return Number(fieldValue) < Number(value)
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null
      default:
        return false
    }
  }

  private static async updateWorkflowStats(workflowId: string): Promise<void> {
    // Update workflow execution statistics
    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('status')
      .eq('workflow_id', workflowId)

    if (executions) {
      const totalExecutions = executions.length
      const successfulExecutions = executions.filter(e => e.status === 'completed').length
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0

      await supabase
        .from('workflows')
        .update({
          execution_count: totalExecutions,
          success_rate: successRate,
          last_executed: new Date().toISOString()
        })
        .eq('id', workflowId)
    }
  }

  /**
   * Get workflow by ID
   */
  static async getWorkflow(workflowId: string): Promise<{ workflow: Workflow | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (error) {
        return { workflow: null, error: error.message }
      }

      return { workflow: data, error: null }
    } catch (error: any) {
      return { workflow: null, error: error.message }
    }
  }

  /**
   * List workflows for organization
   */
  static async listWorkflows(organizationId: string): Promise<{ workflows: Workflow[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        return { workflows: [], error: error.message }
      }

      return { workflows: data || [], error: null }
    } catch (error: any) {
      return { workflows: [], error: error.message }
    }
  }

  /**
   * Trigger workflow by event
   */
  static async triggerWorkflow(
    organizationId: string,
    triggerType: string,
    triggerData: Record<string, any>
  ): Promise<void> {
    try {
      console.log(`🎯 Triggering workflows for: ${triggerType}`)

      // Find workflows with matching trigger
      const { data: workflows } = await supabase
        .from('workflows')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (!workflows) return

      // Filter workflows by trigger type
      const matchingWorkflows = workflows.filter(w => 
        w.trigger?.triggerType === triggerType
      )

      // Execute matching workflows
      for (const workflow of matchingWorkflows) {
        this.executeWorkflow(workflow.id, triggerData).catch(error => {
          console.error(`Failed to execute workflow ${workflow.id}:`, error)
        })
      }

    } catch (error) {
      console.error('Failed to trigger workflows:', error)
    }
  }
}

export default WorkflowEngine
