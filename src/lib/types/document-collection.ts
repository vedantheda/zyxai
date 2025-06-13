// Enhanced Document Collection Types
export interface DocumentChecklistTemplate {
  id: string
  name: string
  description: string
  category: 'individual' | 'business' | 'estate' | 'nonprofit' | 'custom'
  taxYear: number
  isActive: boolean
  items: ChecklistTemplateItem[]
  createdAt: Date
  updatedAt: Date
}
export interface ChecklistTemplateItem {
  id: string
  documentType: string
  documentCategory: string
  title: string
  description: string
  instructions: string
  isRequired: boolean
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedTime: number // minutes
  dependencies: string[] // other item IDs that must be completed first
  conditionalLogic?: ConditionalRule[]
  acceptedFormats: string[]
  maxFileSize: number // MB
  examples: string[]
  commonMistakes: string[]
  helpLinks: string[]
}
export interface ConditionalRule {
  condition: string // e.g., "hasBusinessIncome", "isMarried", "hasRentalProperty"
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  value: any
  action: 'show' | 'hide' | 'require' | 'optional'
}
export interface PersonalizedChecklist {
  id: string
  clientId: string
  templateId: string
  name: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  progress: number // 0-100
  totalItems: number
  completedItems: number
  requiredItems: number
  completedRequiredItems: number
  estimatedCompletionTime: number // minutes
  actualTimeSpent: number // minutes
  deadline?: Date
  startedAt?: Date
  completedAt?: Date
  items: PersonalizedChecklistItem[]
  alerts: ChecklistAlert[]
  notes: string[]
  createdAt: Date
  updatedAt: Date
}
export interface PersonalizedChecklistItem {
  id: string
  checklistId: string
  templateItemId: string
  title: string
  description: string
  instructions: string
  isRequired: boolean
  isVisible: boolean // based on conditional logic
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked'
  uploadedDocuments: UploadedDocument[]
  dueDate?: Date
  completedAt?: Date
  timeSpent: number // minutes
  attempts: number
  lastAttemptAt?: Date
  blockedReason?: string
  skipReason?: string
  userNotes: string[]
  systemNotes: string[]
  reminders: Reminder[]
}
export interface UploadedDocument {
  id: string
  documentId: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: Date
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'needs_review'
  reviewNotes?: string
  qualityScore?: number
  extractedData?: any
}
export interface ChecklistAlert {
  id: string
  type: 'deadline_approaching' | 'overdue' | 'missing_required' | 'quality_issue' | 'dependency_blocked' | 'client_action_needed'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  actionRequired: string
  itemId?: string
  deadline?: Date
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
  autoResolve: boolean
}
export interface Reminder {
  id: string
  type: 'email' | 'sms' | 'in_app' | 'phone_call'
  scheduledFor: Date
  sentAt?: Date
  status: 'scheduled' | 'sent' | 'delivered' | 'failed' | 'cancelled'
  message: string
  escalationLevel: number
  nextReminderAt?: Date
}
export interface DocumentCollectionSession {
  id: string
  clientId: string
  checklistId: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  currentStep: number
  totalSteps: number
  timeSpent: number // minutes
  lastActivity: Date
  completionPercentage: number
  estimatedTimeRemaining: number // minutes
  blockedItems: string[]
  priorityItems: string[]
  upcomingDeadlines: Date[]
  clientEngagement: ClientEngagement
  createdAt: Date
  updatedAt: Date
}
export interface ClientEngagement {
  loginCount: number
  lastLogin: Date
  documentsUploaded: number
  messagesExchanged: number
  helpRequestsCount: number
  averageResponseTime: number // hours
  engagementScore: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' // risk of not completing
}
export interface UploadTrackingMetrics {
  totalDocuments: number
  completedDocuments: number
  pendingDocuments: number
  rejectedDocuments: number
  averageUploadTime: number // minutes
  averageReviewTime: number // minutes
  qualityScore: number // 0-100
  clientSatisfactionScore: number // 0-100
  onTimeCompletionRate: number // percentage
  firstTimeAcceptanceRate: number // percentage
}
export interface DocumentAlert {
  id: string
  clientId: string
  checklistId?: string
  itemId?: string
  documentId?: string
  type: 'missing_document' | 'deadline_approaching' | 'quality_issue' | 'review_needed' | 'client_action_required' | 'system_error'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  actionRequired: string
  assignedTo?: string
  deadline?: Date
  escalationRules: EscalationRule[]
  status: 'active' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed'
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
  metadata: Record<string, any>
}
export interface EscalationRule {
  level: number
  triggerAfter: number // hours
  action: 'email' | 'sms' | 'phone_call' | 'assign_to_manager' | 'create_task'
  recipients: string[]
  message: string
  isActive: boolean
}
// Service Interfaces
export interface DocumentCollectionService {
  // Template Management
  getTemplates(): Promise<DocumentChecklistTemplate[]>
  createTemplate(template: Omit<DocumentChecklistTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentChecklistTemplate>
  updateTemplate(id: string, updates: Partial<DocumentChecklistTemplate>): Promise<void>
  // Personalized Checklists
  createPersonalizedChecklist(clientId: string, templateId: string, customizations?: any): Promise<PersonalizedChecklist>
  getClientChecklist(clientId: string): Promise<PersonalizedChecklist | null>
  updateChecklistItem(itemId: string, updates: Partial<PersonalizedChecklistItem>): Promise<void>
  markItemComplete(itemId: string, documentIds: string[]): Promise<void>
  // Upload Tracking
  getUploadMetrics(clientId?: string): Promise<UploadTrackingMetrics>
  trackDocumentUpload(itemId: string, documentId: string): Promise<void>
  // Alerts & Monitoring
  getActiveAlerts(clientId?: string): Promise<DocumentAlert[]>
  createAlert(alert: Omit<DocumentAlert, 'id' | 'createdAt'>): Promise<DocumentAlert>
  resolveAlert(alertId: string, resolution: string): Promise<void>
  // Session Management
  getCollectionSession(clientId: string): Promise<DocumentCollectionSession | null>
  updateSessionProgress(sessionId: string, progress: Partial<DocumentCollectionSession>): Promise<void>
}
