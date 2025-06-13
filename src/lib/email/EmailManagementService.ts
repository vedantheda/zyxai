import { supabase } from '@/lib/supabase'
export interface EmailMessage {
  id: string
  messageId: string
  threadId?: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  htmlBody?: string
  attachments: EmailAttachment[]
  receivedAt: Date
  isRead: boolean
  isImportant: boolean
  labels: string[]
  clientId?: string
  aiSummary?: string
  aiCategory?: string
  aiPriority?: 'low' | 'medium' | 'high' | 'urgent'
  aiActionItems?: string[]
  routedTo?: string
  routedAt?: Date
  processedAt?: Date
}
export interface EmailAttachment {
  id: string
  filename: string
  contentType: string
  size: number
  downloadUrl?: string
}
export interface EmailSummary {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  suggestedResponse?: string
  clientMentioned?: string
  deadlineMentioned?: Date
  amountMentioned?: number
}
export interface EmailRoutingRule {
  id: string
  name: string
  conditions: EmailCondition[]
  actions: EmailAction[]
  isActive: boolean
  priority: number
}
export interface EmailCondition {
  field: 'from' | 'subject' | 'body' | 'attachment' | 'ai_category' | 'ai_priority'
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex'
  value: string
}
export interface EmailAction {
  type: 'route_to_team' | 'assign_to_user' | 'add_label' | 'set_priority' | 'create_task' | 'notify'
  value: string
}
export interface TeamMember {
  id: string
  name: string
  email: string
  department: string
  specialties: string[]
  workload: number
  isAvailable: boolean
}
export class EmailManagementService {
  private apiKey: string
  constructor(private userId: string) {
    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || ''
  }
  /**
   * Process incoming email with AI analysis
   */
  async processIncomingEmail(emailData: Partial<EmailMessage>): Promise<EmailMessage> {
    try {
      // Generate AI summary and analysis
      const aiAnalysis = await this.analyzeEmailWithAI(emailData.body || '', emailData.subject || '')
      // Detect client from email content
      const clientId = await this.detectClientFromEmail(emailData)
      // Create email record
      const email: EmailMessage = {
        id: this.generateId(),
        messageId: emailData.messageId || this.generateId(),
        threadId: emailData.threadId,
        from: emailData.from || '',
        to: emailData.to || [],
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject || '',
        body: emailData.body || '',
        htmlBody: emailData.htmlBody,
        attachments: emailData.attachments || [],
        receivedAt: new Date(),
        isRead: false,
        isImportant: aiAnalysis.priority === 'urgent' || aiAnalysis.priority === 'high',
        labels: [aiAnalysis.category],
        clientId,
        aiSummary: aiAnalysis.summary,
        aiCategory: aiAnalysis.category,
        aiPriority: aiAnalysis.priority,
        aiActionItems: aiAnalysis.actionItems,
        processedAt: new Date()
      }
      // Save to database
      await this.saveEmail(email)
      // Apply routing rules
      await this.applyRoutingRules(email)
      // Create tasks if needed
      if (aiAnalysis.actionItems.length > 0) {
        await this.createTasksFromActionItems(email, aiAnalysis.actionItems)
      }
      return email
    } catch (error) {
      throw new Error('Failed to process email')
    }
  }
  /**
   * Analyze email content with AI
   */
  async analyzeEmailWithAI(body: string, subject: string): Promise<EmailSummary> {
    try {
      if (!this.apiKey) {
        return this.generateMockAnalysis(body, subject)
      }
      const prompt = `Analyze this email and provide a structured response:
Subject: ${subject}
Body: ${body}
Please provide:
1. A concise summary (2-3 sentences)
2. Key points (bullet list)
3. Action items (if any)
4. Category (tax_question, document_request, appointment, payment, compliance, general)
5. Priority (low, medium, high, urgent)
6. Suggested response (if appropriate)
7. Any client names mentioned
8. Any deadlines mentioned
9. Any dollar amounts mentioned
Format as JSON.`
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-sonnet',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 1000
        })
      })
      if (!response.ok) {
        throw new Error('AI analysis failed')
      }
      const data = await response.json()
      const analysis = JSON.parse(data.choices[0]?.message?.content || '{}')
      return {
        summary: analysis.summary || 'Email received',
        keyPoints: analysis.keyPoints || [],
        actionItems: analysis.actionItems || [],
        category: analysis.category || 'general',
        priority: analysis.priority || 'medium',
        suggestedResponse: analysis.suggestedResponse,
        clientMentioned: analysis.clientMentioned,
        deadlineMentioned: analysis.deadlineMentioned ? new Date(analysis.deadlineMentioned) : undefined,
        amountMentioned: analysis.amountMentioned
      }
    } catch (error) {
      return this.generateMockAnalysis(body, subject)
    }
  }
  /**
   * Route email to appropriate team member
   */
  async routeEmail(emailId: string, teamMemberId?: string): Promise<void> {
    try {
      const email = await this.getEmail(emailId)
      if (!email) throw new Error('Email not found')
      let assignedTo = teamMemberId
      if (!assignedTo) {
        // Auto-assign based on AI analysis and team availability
        assignedTo = await this.findBestTeamMember(email)
      }
      if (assignedTo) {
        await supabase
          .from('emails')
          .update({
            routed_to: assignedTo,
            routed_at: new Date().toISOString()
          })
          .eq('id', emailId)
        // Notify team member
        await this.notifyTeamMember(assignedTo, email)
      }
    } catch (error) {
      throw new Error('Failed to route email')
    }
  }
  /**
   * Get email summary for dashboard
   */
  async getEmailSummary(timeframe: 'today' | 'week' | 'month' = 'today'): Promise<{
    totalEmails: number
    unreadEmails: number
    urgentEmails: number
    categoryBreakdown: Record<string, number>
    teamWorkload: Record<string, number>
  }> {
    try {
      const startDate = this.getStartDate(timeframe)
      const { data: emails, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', this.userId)
        .gte('received_at', startDate.toISOString())
      if (error) throw error
      const totalEmails = emails?.length || 0
      const unreadEmails = emails?.filter(e => !e.is_read).length || 0
      const urgentEmails = emails?.filter(e => e.ai_priority === 'urgent').length || 0
      const categoryBreakdown = emails?.reduce((acc, email) => {
        const category = email.ai_category || 'general'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      const teamWorkload = emails?.reduce((acc, email) => {
        if (email.routed_to) {
          acc[email.routed_to] = (acc[email.routed_to] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}
      return {
        totalEmails,
        unreadEmails,
        urgentEmails,
        categoryBreakdown,
        teamWorkload
      }
    } catch (error) {
      throw new Error('Failed to get email summary')
    }
  }
  /**
   * Create routing rule
   */
  async createRoutingRule(rule: Omit<EmailRoutingRule, 'id'>): Promise<EmailRoutingRule> {
    try {
      const { data, error } = await supabase
        .from('email_routing_rules')
        .insert({
          ...rule,
          user_id: this.userId
        })
        .select()
        .single()
      if (error) throw error
      return this.transformRoutingRule(data)
    } catch (error) {
      throw new Error('Failed to create routing rule')
    }
  }
  /**
   * Get team performance metrics
   */
  async getTeamPerformance(): Promise<{
    responseTime: Record<string, number>
    resolutionRate: Record<string, number>
    workloadDistribution: Record<string, number>
    clientSatisfaction: Record<string, number>
  }> {
    try {
      // Implementation would calculate actual metrics from database
      return {
        responseTime: {
          'john_doe': 2.5,
          'jane_smith': 1.8,
          'mike_johnson': 3.2
        },
        resolutionRate: {
          'john_doe': 95,
          'jane_smith': 98,
          'mike_johnson': 92
        },
        workloadDistribution: {
          'john_doe': 45,
          'jane_smith': 38,
          'mike_johnson': 52
        },
        clientSatisfaction: {
          'john_doe': 4.8,
          'jane_smith': 4.9,
          'mike_johnson': 4.6
        }
      }
    } catch (error) {
      throw new Error('Failed to get team performance')
    }
  }
  // Private helper methods
  private async saveEmail(email: EmailMessage): Promise<void> {
    await supabase
      .from('emails')
      .insert({
        id: email.id,
        user_id: this.userId,
        message_id: email.messageId,
        thread_id: email.threadId,
        from_address: email.from,
        to_addresses: email.to,
        cc_addresses: email.cc,
        bcc_addresses: email.bcc,
        subject: email.subject,
        body: email.body,
        html_body: email.htmlBody,
        attachments: email.attachments,
        received_at: email.receivedAt.toISOString(),
        is_read: email.isRead,
        is_important: email.isImportant,
        labels: email.labels,
        client_id: email.clientId,
        ai_summary: email.aiSummary,
        ai_category: email.aiCategory,
        ai_priority: email.aiPriority,
        ai_action_items: email.aiActionItems,
        processed_at: email.processedAt?.toISOString()
      })
  }
  private async getEmail(emailId: string): Promise<EmailMessage | null> {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .single()
    if (error || !data) return null
    return this.transformEmailData(data)
  }
  private async detectClientFromEmail(emailData: Partial<EmailMessage>): Promise<string | undefined> {
    // Implementation would use AI to detect client from email content
    return undefined
  }
  private async applyRoutingRules(email: EmailMessage): Promise<void> {
    // Implementation would apply routing rules based on email content
  }
  private async createTasksFromActionItems(email: EmailMessage, actionItems: string[]): Promise<void> {
    // Implementation would create tasks from action items
  }
  private async findBestTeamMember(email: EmailMessage): Promise<string | undefined> {
    // Implementation would find best team member based on workload and expertise
    return undefined
  }
  private async notifyTeamMember(teamMemberId: string, email: EmailMessage): Promise<void> {
    // Implementation would notify team member of new assignment
  }
  private generateMockAnalysis(body: string, subject: string): EmailSummary {
    return {
      summary: `Email regarding ${subject.toLowerCase()}`,
      keyPoints: ['Client inquiry received', 'Requires follow-up'],
      actionItems: ['Review and respond within 24 hours'],
      category: 'general',
      priority: 'medium'
    }
  }
  private getStartDate(timeframe: string): Date {
    const now = new Date()
    switch (timeframe) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        return weekStart
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }
  }
  private transformEmailData(data: any): EmailMessage {
    return {
      id: data.id,
      messageId: data.message_id,
      threadId: data.thread_id,
      from: data.from_address,
      to: data.to_addresses || [],
      cc: data.cc_addresses,
      bcc: data.bcc_addresses,
      subject: data.subject,
      body: data.body,
      htmlBody: data.html_body,
      attachments: data.attachments || [],
      receivedAt: new Date(data.received_at),
      isRead: data.is_read,
      isImportant: data.is_important,
      labels: data.labels || [],
      clientId: data.client_id,
      aiSummary: data.ai_summary,
      aiCategory: data.ai_category,
      aiPriority: data.ai_priority,
      aiActionItems: data.ai_action_items || [],
      routedTo: data.routed_to,
      routedAt: data.routed_at ? new Date(data.routed_at) : undefined,
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined
    }
  }
  private transformRoutingRule(data: any): EmailRoutingRule {
    return {
      id: data.id,
      name: data.name,
      conditions: data.conditions || [],
      actions: data.actions || [],
      isActive: data.is_active,
      priority: data.priority
    }
  }
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}
