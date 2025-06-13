import { supabase } from '@/lib/supabase'
export interface TaxDeadline {
  id: string
  type: 'individual' | 'business' | 'quarterly' | 'annual' | 'extension' | 'amendment'
  formType: string
  description: string
  dueDate: Date
  clientId?: string
  isRecurring: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'extended'
  assignedTo?: string
  estimatedHours?: number
  dependencies?: string[]
  reminderSchedule: ReminderSchedule[]
  complianceRequirements: string[]
}
export interface ReminderSchedule {
  id: string
  deadlineId: string
  reminderDate: Date
  reminderType: 'email' | 'sms' | 'in_app' | 'slack'
  recipients: string[]
  message: string
  isSent: boolean
  sentAt?: Date
}
export interface ClientInactivityAlert {
  id: string
  clientId: string
  clientName: string
  lastActivity: Date
  inactiveDays: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  suggestedActions: string[]
  assignedTo?: string
  isResolved: boolean
  resolvedAt?: Date
}
export interface EscalationWorkflow {
  id: string
  name: string
  triggerConditions: EscalationCondition[]
  escalationSteps: EscalationStep[]
  isActive: boolean
  priority: number
}
export interface EscalationCondition {
  field: 'days_overdue' | 'client_inactivity' | 'missing_documents' | 'compliance_score'
  operator: 'greater_than' | 'less_than' | 'equals'
  value: number
}
export interface EscalationStep {
  stepNumber: number
  delayHours: number
  action: 'notify_manager' | 'reassign_task' | 'send_urgent_email' | 'create_high_priority_task'
  recipients: string[]
  message?: string
}
export interface ComplianceAlert {
  id: string
  type: 'deadline_approaching' | 'deadline_overdue' | 'client_inactive' | 'document_missing' | 'compliance_violation'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  description: string
  clientId?: string
  deadlineId?: string
  dueDate?: Date
  assignedTo?: string
  escalationLevel: number
  isAcknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  isResolved: boolean
  resolvedAt?: Date
  createdAt: Date
  metadata?: Record<string, any>
}
export interface AlertDashboard {
  summary: {
    totalAlerts: number
    criticalAlerts: number
    overdueDeadlines: number
    inactiveClients: number
    complianceIssues: number
  }
  upcomingDeadlines: TaxDeadline[]
  overdueItems: TaxDeadline[]
  inactiveClients: ClientInactivityAlert[]
  recentAlerts: ComplianceAlert[]
  escalatedItems: ComplianceAlert[]
}
export class DeadlineAlertService {
  constructor(private userId: string) {}
  /**
   * Get comprehensive alert dashboard
   */
  async getAlertDashboard(): Promise<AlertDashboard> {
    try {
      const [
        upcomingDeadlines,
        overdueItems,
        inactiveClients,
        recentAlerts,
        escalatedItems
      ] = await Promise.all([
        this.getUpcomingDeadlines(30), // Next 30 days
        this.getOverdueDeadlines(),
        this.getInactiveClients(),
        this.getRecentAlerts(50),
        this.getEscalatedItems()
      ])
      const summary = {
        totalAlerts: recentAlerts.length,
        criticalAlerts: recentAlerts.filter(alert => alert.severity === 'critical').length,
        overdueDeadlines: overdueItems.length,
        inactiveClients: inactiveClients.length,
        complianceIssues: recentAlerts.filter(alert => alert.type === 'compliance_violation').length
      }
      return {
        summary,
        upcomingDeadlines,
        overdueItems,
        inactiveClients,
        recentAlerts,
        escalatedItems
      }
    } catch (error) {
      throw new Error('Failed to get alert dashboard')
    }
  }
  /**
   * Create tax deadline with automatic reminders
   */
  async createTaxDeadline(deadline: Omit<TaxDeadline, 'id' | 'reminderSchedule'>): Promise<TaxDeadline> {
    try {
      const { data, error } = await supabase
        .from('tax_deadlines')
        .insert({
          ...deadline,
          user_id: this.userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      if (error) throw error
      // Create automatic reminder schedule
      const reminderSchedule = this.generateReminderSchedule(data.id, deadline.dueDate, deadline.priority)
      await this.createReminderSchedule(reminderSchedule)
      return this.transformDeadlineData({ ...data, reminder_schedule: reminderSchedule })
    } catch (error) {
      throw new Error('Failed to create tax deadline')
    }
  }
  /**
   * Monitor client inactivity and create alerts
   */
  async monitorClientInactivity(): Promise<ClientInactivityAlert[]> {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          *,
          tasks (created_at, updated_at),
          documents (created_at),
          emails (received_at)
        `)
        .eq('user_id', this.userId)
      if (error) throw error
      const inactiveClients: ClientInactivityAlert[] = []
      const now = new Date()
      for (const client of clients || []) {
        const lastActivity = this.getLastActivity(client)
        const inactiveDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        if (inactiveDays > 30) { // 30 days threshold
          const riskLevel = this.calculateRiskLevel(inactiveDays)
          const alert: ClientInactivityAlert = {
            id: this.generateId(),
            clientId: client.id,
            clientName: client.name,
            lastActivity,
            inactiveDays,
            riskLevel,
            suggestedActions: this.generateSuggestedActions(inactiveDays, riskLevel),
            isResolved: false
          }
          inactiveClients.push(alert)
          // Create compliance alert
          await this.createComplianceAlert({
            type: 'client_inactive',
            severity: riskLevel === 'critical' ? 'critical' : 'warning',
            title: 'Client Inactivity Detected',
            description: `Client ${client.name} has been inactive for ${inactiveDays} days`,
            clientId: client.id,
            escalationLevel: 0
          })
        }
      }
      return inactiveClients
    } catch (error) {
      
      throw new Error('Failed to monitor client inactivity')
    }
  }
  /**
   * Run automated compliance checks
   */
  async runComplianceChecks(): Promise<void> {
    try {
      // Check upcoming deadlines
      await this.checkUpcomingDeadlines()
      // Check overdue items
      await this.checkOverdueDeadlines()
      // Monitor client inactivity
      await this.monitorClientInactivity()
      // Check missing documents
      await this.checkMissingDocuments()
      // Process escalation workflows
      await this.processEscalationWorkflows()
      // Send scheduled reminders
      await this.sendScheduledReminders()
    } catch (error) {
      
    }
  }
  /**
   * Create escalation workflow
   */
  async createEscalationWorkflow(workflow: Omit<EscalationWorkflow, 'id'>): Promise<EscalationWorkflow> {
    try {
      const { data, error } = await supabase
        .from('escalation_workflows')
        .insert({
          ...workflow,
          user_id: this.userId
        })
        .select()
        .single()
      if (error) throw error
      return this.transformWorkflowData(data)
    } catch (error) {
      throw new Error('Failed to create escalation workflow')
    }
  }
  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await supabase
        .from('compliance_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_by: this.userId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .eq('user_id', this.userId)
    } catch (error) {
      throw new Error('Failed to acknowledge alert')
    }
  }
  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolution?: string): Promise<void> {
    try {
      await supabase
        .from('compliance_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          metadata: { resolution }
        })
        .eq('id', alertId)
        .eq('user_id', this.userId)
    } catch (error) {
      throw new Error('Failed to resolve alert')
    }
  }
  // Private helper methods
  private async getUpcomingDeadlines(days: number): Promise<TaxDeadline[]> {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)
    const { data, error } = await supabase
      .from('tax_deadlines')
      .select('*')
      .eq('user_id', this.userId)
      .gte('due_date', new Date().toISOString())
      .lte('due_date', endDate.toISOString())
      .neq('status', 'completed')
      .order('due_date', { ascending: true })
    if (error) throw error
    return (data || []).map(this.transformDeadlineData)
  }
  private async getOverdueDeadlines(): Promise<TaxDeadline[]> {
    const { data, error } = await supabase
      .from('tax_deadlines')
      .select('*')
      .eq('user_id', this.userId)
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed')
      .order('due_date', { ascending: true })
    if (error) throw error
    return (data || []).map(this.transformDeadlineData)
  }
  private async getInactiveClients(): Promise<ClientInactivityAlert[]> {
    const { data, error } = await supabase
      .from('client_inactivity_alerts')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_resolved', false)
      .order('inactive_days', { ascending: false })
    if (error) throw error
    return (data || []).map(this.transformInactivityAlert)
  }
  private async getRecentAlerts(limit: number): Promise<ComplianceAlert[]> {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data || []).map(this.transformAlertData)
  }
  private async getEscalatedItems(): Promise<ComplianceAlert[]> {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .select('*')
      .eq('user_id', this.userId)
      .gt('escalation_level', 0)
      .eq('is_resolved', false)
      .order('escalation_level', { ascending: false })
    if (error) throw error
    return (data || []).map(this.transformAlertData)
  }
  private generateReminderSchedule(deadlineId: string, dueDate: Date, priority: string): ReminderSchedule[] {
    const reminders: ReminderSchedule[] = []
    const reminderDays = priority === 'critical' ? [30, 14, 7, 3, 1] : [30, 7, 1]
    reminderDays.forEach((days, index) => {
      const reminderDate = new Date(dueDate)
      reminderDate.setDate(reminderDate.getDate() - days)
      if (reminderDate > new Date()) {
        reminders.push({
          id: this.generateId(),
          deadlineId,
          reminderDate,
          reminderType: 'email',
          recipients: [this.userId],
          message: `Reminder: Tax deadline approaching in ${days} days`,
          isSent: false
        })
      }
    })
    return reminders
  }
  private async createReminderSchedule(reminders: ReminderSchedule[]): Promise<void> {
    if (reminders.length === 0) return
    await supabase
      .from('reminder_schedule')
      .insert(reminders.map(reminder => ({
        ...reminder,
        user_id: this.userId
      })))
  }
  private async createComplianceAlert(alert: Omit<ComplianceAlert, 'id' | 'isAcknowledged' | 'isResolved' | 'createdAt'>): Promise<void> {
    await supabase
      .from('compliance_alerts')
      .insert({
        ...alert,
        user_id: this.userId,
        is_acknowledged: false,
        is_resolved: false,
        created_at: new Date().toISOString()
      })
  }
  private getLastActivity(client: any): Date {
    const activities = [
      ...(client.tasks || []).map((t: any) => new Date(t.updated_at || t.created_at)),
      ...(client.documents || []).map((d: any) => new Date(d.created_at)),
      ...(client.emails || []).map((e: any) => new Date(e.received_at))
    ]
    return activities.length > 0 ? new Date(Math.max(...activities.map(d => d.getTime()))) : new Date(client.created_at)
  }
  private calculateRiskLevel(inactiveDays: number): 'low' | 'medium' | 'high' | 'critical' {
    if (inactiveDays > 90) return 'critical'
    if (inactiveDays > 60) return 'high'
    if (inactiveDays > 45) return 'medium'
    return 'low'
  }
  private generateSuggestedActions(inactiveDays: number, riskLevel: string): string[] {
    const actions = ['Send check-in email', 'Schedule follow-up call']
    if (riskLevel === 'high' || riskLevel === 'critical') {
      actions.push('Review client status', 'Consider retention strategy')
    }
    if (inactiveDays > 90) {
      actions.push('Escalate to manager', 'Review contract terms')
    }
    return actions
  }
  private async checkUpcomingDeadlines(): Promise<void> {
    const upcomingDeadlines = await this.getUpcomingDeadlines(7) // Next 7 days
    for (const deadline of upcomingDeadlines) {
      if (deadline.status === 'pending') {
        await this.createComplianceAlert({
          type: 'deadline_approaching',
          severity: deadline.priority === 'critical' ? 'critical' : 'warning',
          title: 'Tax Deadline Approaching',
          description: `${deadline.formType} deadline is approaching on ${deadline.dueDate.toLocaleDateString()}`,
          clientId: deadline.clientId,
          deadlineId: deadline.id,
          dueDate: deadline.dueDate,
          escalationLevel: 0
        })
      }
    }
  }
  private async checkOverdueDeadlines(): Promise<void> {
    const overdueDeadlines = await this.getOverdueDeadlines()
    for (const deadline of overdueDeadlines) {
      await this.createComplianceAlert({
        type: 'deadline_overdue',
        severity: 'critical',
        title: 'Tax Deadline Overdue',
        description: `${deadline.formType} deadline was due on ${deadline.dueDate.toLocaleDateString()}`,
        clientId: deadline.clientId,
        deadlineId: deadline.id,
        dueDate: deadline.dueDate,
        escalationLevel: 1
      })
    }
  }
  private async checkMissingDocuments(): Promise<void> {
    // Implementation would check for missing required documents
  }
  private async processEscalationWorkflows(): Promise<void> {
    // Implementation would process escalation workflows
  }
  private async sendScheduledReminders(): Promise<void> {
    // Implementation would send scheduled reminders
  }
  private transformDeadlineData(data: any): TaxDeadline {
    return {
      id: data.id,
      type: data.type,
      formType: data.form_type,
      description: data.description,
      dueDate: new Date(data.due_date),
      clientId: data.client_id,
      isRecurring: data.is_recurring,
      priority: data.priority,
      status: data.status,
      assignedTo: data.assigned_to,
      estimatedHours: data.estimated_hours,
      dependencies: data.dependencies || [],
      reminderSchedule: data.reminder_schedule || [],
      complianceRequirements: data.compliance_requirements || []
    }
  }
  private transformInactivityAlert(data: any): ClientInactivityAlert {
    return {
      id: data.id,
      clientId: data.client_id,
      clientName: data.client_name,
      lastActivity: new Date(data.last_activity),
      inactiveDays: data.inactive_days,
      riskLevel: data.risk_level,
      suggestedActions: data.suggested_actions || [],
      assignedTo: data.assigned_to,
      isResolved: data.is_resolved,
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined
    }
  }
  private transformAlertData(data: any): ComplianceAlert {
    return {
      id: data.id,
      type: data.type,
      severity: data.severity,
      title: data.title,
      description: data.description,
      clientId: data.client_id,
      deadlineId: data.deadline_id,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      assignedTo: data.assigned_to,
      escalationLevel: data.escalation_level,
      isAcknowledged: data.is_acknowledged,
      acknowledgedBy: data.acknowledged_by,
      acknowledgedAt: data.acknowledged_at ? new Date(data.acknowledged_at) : undefined,
      isResolved: data.is_resolved,
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      createdAt: new Date(data.created_at),
      metadata: data.metadata
    }
  }
  private transformWorkflowData(data: any): EscalationWorkflow {
    return {
      id: data.id,
      name: data.name,
      triggerConditions: data.trigger_conditions || [],
      escalationSteps: data.escalation_steps || [],
      isActive: data.is_active,
      priority: data.priority
    }
  }
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}
