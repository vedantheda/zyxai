import { 
  DocumentChecklistTemplate, 
  PersonalizedChecklist, 
  PersonalizedChecklistItem,
  DocumentAlert,
  DocumentCollectionSession,
  UploadTrackingMetrics,
  DocumentCollectionService,
  ChecklistAlert,
  ClientEngagement
} from '@/types/document-collection'

export class MockDocumentCollectionService implements DocumentCollectionService {
  private templates: DocumentChecklistTemplate[] = []
  private checklists: PersonalizedChecklist[] = []
  private alerts: DocumentAlert[] = []
  private sessions: DocumentCollectionSession[] = []

  constructor() {
    this.initializeMockData()
  }

  private initializeMockData() {
    // Create default templates
    this.templates = [
      {
        id: 'template-individual-2024',
        name: '2024 Individual Tax Return',
        description: 'Complete document checklist for individual tax returns',
        category: 'individual',
        taxYear: 2024,
        isActive: true,
        items: [
          {
            id: 'item-w2',
            documentType: 'W-2',
            documentCategory: 'Income',
            title: 'W-2 Wage and Tax Statement',
            description: 'Form W-2 from all employers for 2024',
            instructions: 'Collect W-2 forms from all employers. If you haven\'t received them by January 31st, contact your employer.',
            isRequired: true,
            priority: 'critical',
            estimatedTime: 5,
            dependencies: [],
            acceptedFormats: ['.pdf', '.jpg', '.png'],
            maxFileSize: 10,
            examples: ['W-2 from ABC Company', 'W-2 from XYZ Corp'],
            commonMistakes: ['Missing employer copy', 'Blurry or incomplete scan'],
            helpLinks: ['https://irs.gov/w2-help']
          },
          {
            id: 'item-1099-int',
            documentType: '1099-INT',
            documentCategory: 'Income',
            title: '1099-INT Interest Income',
            description: 'Interest income statements from banks and financial institutions',
            instructions: 'Gather all 1099-INT forms showing interest earned on savings accounts, CDs, and other investments.',
            isRequired: false,
            priority: 'high',
            estimatedTime: 3,
            dependencies: [],
            acceptedFormats: ['.pdf', '.jpg', '.png'],
            maxFileSize: 10,
            examples: ['Bank interest statement', 'CD interest form'],
            commonMistakes: ['Missing small amounts under $10'],
            helpLinks: ['https://irs.gov/1099-int-help']
          },
          {
            id: 'item-receipts',
            documentType: 'Receipt',
            documentCategory: 'Deductions',
            title: 'Deductible Expense Receipts',
            description: 'Receipts for tax-deductible expenses',
            instructions: 'Collect receipts for charitable donations, medical expenses, business expenses, and other deductible items.',
            isRequired: false,
            priority: 'medium',
            estimatedTime: 15,
            dependencies: [],
            acceptedFormats: ['.pdf', '.jpg', '.png'],
            maxFileSize: 5,
            examples: ['Charity donation receipt', 'Medical bill', 'Business meal receipt'],
            commonMistakes: ['Faded receipts', 'Missing date or amount'],
            helpLinks: ['https://irs.gov/deductions-help']
          }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
      }
    ]

    // Create sample personalized checklist
    this.checklists = [
      {
        id: 'checklist-client-1',
        clientId: 'client-1',
        templateId: 'template-individual-2024',
        name: 'John Doe - 2024 Tax Documents',
        status: 'active',
        progress: 33,
        totalItems: 3,
        completedItems: 1,
        requiredItems: 1,
        completedRequiredItems: 1,
        estimatedCompletionTime: 23,
        actualTimeSpent: 8,
        deadline: new Date('2024-04-15'),
        startedAt: new Date('2024-02-01'),
        items: [
          {
            id: 'item-w2-client-1',
            checklistId: 'checklist-client-1',
            templateItemId: 'item-w2',
            title: 'W-2 Wage and Tax Statement',
            description: 'Form W-2 from all employers for 2024',
            instructions: 'Collect W-2 forms from all employers.',
            isRequired: true,
            isVisible: true,
            priority: 'critical',
            status: 'completed',
            uploadedDocuments: [
              {
                id: 'doc-1',
                documentId: 'doc-w2-abc-company',
                fileName: 'W2_ABC_Company_2024.pdf',
                fileSize: 245760,
                fileType: 'application/pdf',
                uploadedAt: new Date('2024-02-05'),
                status: 'approved',
                qualityScore: 95
              }
            ],
            completedAt: new Date('2024-02-05'),
            timeSpent: 8,
            attempts: 1,
            lastAttemptAt: new Date('2024-02-05'),
            userNotes: ['Uploaded W-2 from ABC Company'],
            systemNotes: ['Document automatically approved - high quality scan'],
            reminders: []
          },
          {
            id: 'item-1099-int-client-1',
            checklistId: 'checklist-client-1',
            templateItemId: 'item-1099-int',
            title: '1099-INT Interest Income',
            description: 'Interest income statements from banks',
            instructions: 'Gather all 1099-INT forms.',
            isRequired: false,
            isVisible: true,
            priority: 'high',
            status: 'pending',
            uploadedDocuments: [],
            timeSpent: 0,
            attempts: 0,
            userNotes: [],
            systemNotes: ['Reminder sent on 2024-02-10'],
            reminders: [
              {
                id: 'reminder-1',
                type: 'email',
                scheduledFor: new Date('2024-02-15'),
                status: 'scheduled',
                message: 'Don\'t forget to upload your 1099-INT forms',
                escalationLevel: 1
              }
            ]
          },
          {
            id: 'item-receipts-client-1',
            checklistId: 'checklist-client-1',
            templateItemId: 'item-receipts',
            title: 'Deductible Expense Receipts',
            description: 'Receipts for tax-deductible expenses',
            instructions: 'Collect receipts for deductible items.',
            isRequired: false,
            isVisible: true,
            priority: 'medium',
            status: 'pending',
            uploadedDocuments: [],
            timeSpent: 0,
            attempts: 0,
            userNotes: [],
            systemNotes: [],
            reminders: []
          }
        ],
        alerts: [
          {
            id: 'alert-deadline-1',
            type: 'deadline_approaching',
            severity: 'warning',
            title: 'Tax Deadline Approaching',
            message: 'You have 45 days remaining to complete your tax document collection',
            actionRequired: 'Upload remaining documents',
            deadline: new Date('2024-04-15'),
            createdAt: new Date('2024-02-28'),
            autoResolve: true
          }
        ],
        notes: ['Client prefers email communication', 'Has business income - may need additional forms'],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-10')
      }
    ]

    // Create sample alerts
    this.alerts = [
      {
        id: 'alert-missing-1099',
        clientId: 'client-1',
        checklistId: 'checklist-client-1',
        itemId: 'item-1099-int-client-1',
        type: 'missing_document',
        severity: 'warning',
        title: 'Missing 1099-INT Forms',
        message: 'Client has not uploaded 1099-INT forms. Deadline is approaching.',
        actionRequired: 'Follow up with client about interest income documents',
        deadline: new Date('2024-03-15'),
        escalationRules: [
          {
            level: 1,
            triggerAfter: 24,
            action: 'email',
            recipients: ['client@example.com'],
            message: 'Reminder: Please upload your 1099-INT forms',
            isActive: true
          },
          {
            level: 2,
            triggerAfter: 72,
            action: 'assign_to_manager',
            recipients: ['manager@firm.com'],
            message: 'Client has not responded to document requests',
            isActive: true
          }
        ],
        status: 'active',
        createdAt: new Date('2024-02-10'),
        metadata: {
          clientName: 'John Doe',
          documentType: '1099-INT',
          daysOverdue: 5
        }
      }
    ]

    // Create sample session
    this.sessions = [
      {
        id: 'session-client-1',
        clientId: 'client-1',
        checklistId: 'checklist-client-1',
        status: 'active',
        currentStep: 2,
        totalSteps: 3,
        timeSpent: 8,
        lastActivity: new Date('2024-02-10'),
        completionPercentage: 33,
        estimatedTimeRemaining: 15,
        blockedItems: [],
        priorityItems: ['item-1099-int-client-1'],
        upcomingDeadlines: [new Date('2024-03-15'), new Date('2024-04-15')],
        clientEngagement: {
          loginCount: 3,
          lastLogin: new Date('2024-02-10'),
          documentsUploaded: 1,
          messagesExchanged: 2,
          helpRequestsCount: 0,
          averageResponseTime: 12,
          engagementScore: 75,
          riskLevel: 'low'
        },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-10')
      }
    ]
  }

  async getTemplates(): Promise<DocumentChecklistTemplate[]> {
    return [...this.templates]
  }

  async createTemplate(template: Omit<DocumentChecklistTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentChecklistTemplate> {
    const newTemplate: DocumentChecklistTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.templates.push(newTemplate)
    return newTemplate
  }

  async updateTemplate(id: string, updates: Partial<DocumentChecklistTemplate>): Promise<void> {
    const index = this.templates.findIndex(t => t.id === id)
    if (index !== -1) {
      this.templates[index] = { ...this.templates[index], ...updates, updatedAt: new Date() }
    }
  }

  async createPersonalizedChecklist(clientId: string, templateId: string, customizations?: any): Promise<PersonalizedChecklist> {
    const template = this.templates.find(t => t.id === templateId)
    if (!template) throw new Error('Template not found')

    const checklist: PersonalizedChecklist = {
      id: `checklist-${clientId}-${Date.now()}`,
      clientId,
      templateId,
      name: `${customizations?.clientName || 'Client'} - ${template.name}`,
      status: 'active',
      progress: 0,
      totalItems: template.items.length,
      completedItems: 0,
      requiredItems: template.items.filter(item => item.isRequired).length,
      completedRequiredItems: 0,
      estimatedCompletionTime: template.items.reduce((sum, item) => sum + item.estimatedTime, 0),
      actualTimeSpent: 0,
      deadline: customizations?.deadline,
      items: template.items.map(templateItem => ({
        id: `${templateItem.id}-${clientId}`,
        checklistId: `checklist-${clientId}-${Date.now()}`,
        templateItemId: templateItem.id,
        title: templateItem.title,
        description: templateItem.description,
        instructions: templateItem.instructions,
        isRequired: templateItem.isRequired,
        isVisible: true,
        priority: templateItem.priority,
        status: 'pending' as const,
        uploadedDocuments: [],
        timeSpent: 0,
        attempts: 0,
        userNotes: [],
        systemNotes: [],
        reminders: []
      })),
      alerts: [],
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.checklists.push(checklist)
    return checklist
  }

  async getClientChecklist(clientId: string): Promise<PersonalizedChecklist | null> {
    return this.checklists.find(c => c.clientId === clientId) || null
  }

  async updateChecklistItem(itemId: string, updates: Partial<PersonalizedChecklistItem>): Promise<void> {
    for (const checklist of this.checklists) {
      const itemIndex = checklist.items.findIndex(item => item.id === itemId)
      if (itemIndex !== -1) {
        checklist.items[itemIndex] = { ...checklist.items[itemIndex], ...updates }
        checklist.updatedAt = new Date()
        this.updateChecklistProgress(checklist)
        break
      }
    }
  }

  async markItemComplete(itemId: string, documentIds: string[]): Promise<void> {
    await this.updateChecklistItem(itemId, {
      status: 'completed',
      completedAt: new Date(),
      uploadedDocuments: documentIds.map(docId => ({
        id: `upload-${docId}`,
        documentId: docId,
        fileName: `document-${docId}.pdf`,
        fileSize: 100000,
        fileType: 'application/pdf',
        uploadedAt: new Date(),
        status: 'approved' as const
      }))
    })
  }

  async getUploadMetrics(clientId?: string): Promise<UploadTrackingMetrics> {
    const relevantChecklists = clientId 
      ? this.checklists.filter(c => c.clientId === clientId)
      : this.checklists

    const allItems = relevantChecklists.flatMap(c => c.items)
    const completedItems = allItems.filter(item => item.status === 'completed')
    const totalDocuments = allItems.reduce((sum, item) => sum + item.uploadedDocuments.length, 0)

    return {
      totalDocuments,
      completedDocuments: completedItems.length,
      pendingDocuments: allItems.filter(item => item.status === 'pending').length,
      rejectedDocuments: allItems.filter(item => 
        item.uploadedDocuments.some(doc => doc.status === 'rejected')
      ).length,
      averageUploadTime: 5,
      averageReviewTime: 2,
      qualityScore: 85,
      clientSatisfactionScore: 90,
      onTimeCompletionRate: 78,
      firstTimeAcceptanceRate: 82
    }
  }

  async trackDocumentUpload(itemId: string, documentId: string): Promise<void> {
    // Implementation would track the upload
    console.log(`Tracking upload: ${documentId} for item: ${itemId}`)
  }

  async getActiveAlerts(clientId?: string): Promise<DocumentAlert[]> {
    return clientId 
      ? this.alerts.filter(alert => alert.clientId === clientId && alert.status === 'active')
      : this.alerts.filter(alert => alert.status === 'active')
  }

  async createAlert(alert: Omit<DocumentAlert, 'id' | 'createdAt'>): Promise<DocumentAlert> {
    const newAlert: DocumentAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      createdAt: new Date()
    }
    this.alerts.push(newAlert)
    return newAlert
  }

  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.status = 'resolved'
      alert.resolvedAt = new Date()
      alert.metadata.resolution = resolution
    }
  }

  async getCollectionSession(clientId: string): Promise<DocumentCollectionSession | null> {
    return this.sessions.find(s => s.clientId === clientId) || null
  }

  async updateSessionProgress(sessionId: string, progress: Partial<DocumentCollectionSession>): Promise<void> {
    const session = this.sessions.find(s => s.id === sessionId)
    if (session) {
      Object.assign(session, progress, { updatedAt: new Date() })
    }
  }

  private updateChecklistProgress(checklist: PersonalizedChecklist): void {
    const completedItems = checklist.items.filter(item => item.status === 'completed').length
    const completedRequiredItems = checklist.items.filter(item => 
      item.isRequired && item.status === 'completed'
    ).length

    checklist.completedItems = completedItems
    checklist.completedRequiredItems = completedRequiredItems
    checklist.progress = Math.round((completedItems / checklist.totalItems) * 100)
    checklist.actualTimeSpent = checklist.items.reduce((sum, item) => sum + item.timeSpent, 0)

    if (completedItems === checklist.totalItems) {
      checklist.status = 'completed'
      checklist.completedAt = new Date()
    }
  }
}

// Export singleton instance
export const documentCollectionService = new MockDocumentCollectionService()
