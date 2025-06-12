export interface DocumentTrackingEntry {
  id: string
  clientId: string
  documentId: string
  documentName: string
  documentType: string
  status: 'uploaded' | 'processing' | 'completed' | 'failed' | 'reviewed' | 'approved'
  priority: 'critical' | 'high' | 'medium' | 'low'
  uploadedAt: Date
  lastUpdated: Date
  dueDate?: Date
  completedAt?: Date
  assignedTo?: string
  tags: string[]
  notes: string[]
  alerts: DocumentAlert[]
  dependencies: string[]
  estimatedCompletionTime: number
  actualCompletionTime?: number
  qualityScore?: number
}

export interface DocumentAlert {
  id: string
  type: 'deadline' | 'quality' | 'dependency' | 'compliance' | 'review'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  createdAt: Date
  resolvedAt?: Date
  actionRequired: string
  deadline?: Date
  assignedTo?: string
}

export interface TrackingDashboard {
  clientId: string
  generatedAt: Date
  summary: TrackingSummary
  documents: DocumentTrackingEntry[]
  alerts: DocumentAlert[]
  milestones: Milestone[]
  timeline: TimelineEvent[]
  recommendations: TrackingRecommendation[]
}

export interface TrackingSummary {
  totalDocuments: number
  completedDocuments: number
  pendingDocuments: number
  overdueDocuments: number
  averageProcessingTime: number
  qualityScore: number
  complianceScore: number
  estimatedCompletion: Date
  criticalAlerts: number
}

export interface Milestone {
  id: string
  title: string
  description: string
  targetDate: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  dependencies: string[]
  completionPercentage: number
}

export interface TimelineEvent {
  id: string
  timestamp: Date
  type: 'upload' | 'processing' | 'completion' | 'review' | 'alert' | 'milestone'
  description: string
  documentId?: string
  userId?: string
  metadata: Record<string, any>
}

export interface TrackingRecommendation {
  id: string
  type: 'workflow' | 'quality' | 'efficiency' | 'compliance'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  actionSteps: string[]
}

export class DocumentTrackingSystem {
  private trackingEntries: Map<string, DocumentTrackingEntry> = new Map()
  private alerts: Map<string, DocumentAlert> = new Map()
  private milestones: Map<string, Milestone> = new Map()
  private timeline: TimelineEvent[] = []

  /**
   * Add document to tracking system
   */
  addDocument(
    clientId: string,
    documentId: string,
    documentName: string,
    documentType: string,
    priority: DocumentTrackingEntry['priority'] = 'medium',
    dueDate?: Date
  ): DocumentTrackingEntry {
    const entry: DocumentTrackingEntry = {
      id: `track_${documentId}`,
      clientId,
      documentId,
      documentName,
      documentType,
      status: 'uploaded',
      priority,
      uploadedAt: new Date(),
      lastUpdated: new Date(),
      dueDate,
      tags: [],
      notes: [],
      alerts: [],
      dependencies: [],
      estimatedCompletionTime: this.estimateProcessingTime(documentType),
    }

    this.trackingEntries.set(entry.id, entry)
    this.addTimelineEvent('upload', `Document uploaded: ${documentName}`, documentId)
    this.checkForAlerts(entry)

    return entry
  }

  /**
   * Update document status
   */
  updateDocumentStatus(
    documentId: string,
    status: DocumentTrackingEntry['status'],
    notes?: string
  ): void {
    const entry = this.findEntryByDocumentId(documentId)
    if (!entry) return

    const previousStatus = entry.status
    entry.status = status
    entry.lastUpdated = new Date()

    if (notes) {
      entry.notes.push(`${new Date().toISOString()}: ${notes}`)
    }

    if (status === 'completed') {
      entry.completedAt = new Date()
      entry.actualCompletionTime = this.calculateActualTime(entry)
      this.resolveAlertsForDocument(documentId)
    }

    this.addTimelineEvent(
      'processing',
      `Status changed from ${previousStatus} to ${status}`,
      documentId
    )

    this.checkForAlerts(entry)
  }

  /**
   * Add alert for document
   */
  addAlert(
    documentId: string,
    type: DocumentAlert['type'],
    severity: DocumentAlert['severity'],
    message: string,
    actionRequired: string,
    deadline?: Date
  ): DocumentAlert {
    const alert: DocumentAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      createdAt: new Date(),
      actionRequired,
      deadline,
    }

    this.alerts.set(alert.id, alert)

    const entry = this.findEntryByDocumentId(documentId)
    if (entry) {
      entry.alerts.push(alert)
    }

    this.addTimelineEvent('alert', `Alert created: ${message}`, documentId)

    return alert
  }

  /**
   * Generate comprehensive tracking dashboard
   */
  generateTrackingDashboard(clientId: string): TrackingDashboard {
    const clientDocuments = Array.from(this.trackingEntries.values())
      .filter(entry => entry.clientId === clientId)

    const summary = this.generateTrackingSummary(clientDocuments)
    const alerts = this.getActiveAlertsForClient(clientId)
    const milestones = this.generateMilestones(clientDocuments)
    const timeline = this.getTimelineForClient(clientId)
    const recommendations = this.generateRecommendations(clientDocuments)

    return {
      clientId,
      generatedAt: new Date(),
      summary,
      documents: clientDocuments,
      alerts,
      milestones,
      timeline,
      recommendations,
    }
  }

  /**
   * Generate tracking summary
   */
  private generateTrackingSummary(documents: DocumentTrackingEntry[]): TrackingSummary {
    const totalDocuments = documents.length
    const completedDocuments = documents.filter(d => d.status === 'completed').length
    const pendingDocuments = documents.filter(d =>
      ['uploaded', 'processing'].includes(d.status)
    ).length
    const overdueDocuments = documents.filter(d =>
      d.dueDate && d.dueDate < new Date() && d.status !== 'completed'
    ).length

    const completedDocs = documents.filter(d => d.actualCompletionTime)
    const averageProcessingTime = completedDocs.length > 0
      ? completedDocs.reduce((sum, d) => sum + (d.actualCompletionTime || 0), 0) / completedDocs.length
      : 0

    const qualityScore = this.calculateQualityScore(documents)
    const complianceScore = this.calculateComplianceScore(documents)
    const estimatedCompletion = this.estimateCompletionDate(documents)

    const criticalAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.severity === 'critical' && !alert.resolvedAt).length

    return {
      totalDocuments,
      completedDocuments,
      pendingDocuments,
      overdueDocuments,
      averageProcessingTime,
      qualityScore,
      complianceScore,
      estimatedCompletion,
      criticalAlerts,
    }
  }

  /**
   * Generate milestones for client
   */
  private generateMilestones(documents: DocumentTrackingEntry[]): Milestone[] {
    const milestones: Milestone[] = []

    // Document collection milestone
    const totalDocs = documents.length
    const uploadedDocs = documents.filter(d => d.status !== 'uploaded').length
    milestones.push({
      id: 'document_collection',
      title: 'Document Collection',
      description: 'All required documents uploaded',
      targetDate: this.calculateMilestoneDate(documents, 'collection'),
      status: uploadedDocs === totalDocs ? 'completed' : 'in_progress',
      dependencies: [],
      completionPercentage: totalDocs > 0 ? (uploadedDocs / totalDocs) * 100 : 0,
    })

    // Processing milestone
    const processedDocs = documents.filter(d =>
      ['completed', 'reviewed', 'approved'].includes(d.status)
    ).length
    milestones.push({
      id: 'document_processing',
      title: 'Document Processing',
      description: 'All documents processed and analyzed',
      targetDate: this.calculateMilestoneDate(documents, 'processing'),
      status: processedDocs === totalDocs ? 'completed' : 'in_progress',
      dependencies: ['document_collection'],
      completionPercentage: totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 0,
    })

    // Review milestone
    const reviewedDocs = documents.filter(d =>
      ['reviewed', 'approved'].includes(d.status)
    ).length
    milestones.push({
      id: 'document_review',
      title: 'Document Review',
      description: 'All documents reviewed and approved',
      targetDate: this.calculateMilestoneDate(documents, 'review'),
      status: reviewedDocs === totalDocs ? 'completed' : 'in_progress',
      dependencies: ['document_processing'],
      completionPercentage: totalDocs > 0 ? (reviewedDocs / totalDocs) * 100 : 0,
    })

    return milestones
  }

  /**
   * Generate recommendations based on tracking data
   */
  private generateRecommendations(documents: DocumentTrackingEntry[]): TrackingRecommendation[] {
    const recommendations: TrackingRecommendation[] = []

    // Check for bottlenecks
    const processingDocs = documents.filter(d => d.status === 'processing')
    if (processingDocs.length > 5) {
      recommendations.push({
        id: 'processing_bottleneck',
        type: 'workflow',
        title: 'Processing Bottleneck Detected',
        description: 'Multiple documents are stuck in processing stage',
        impact: 'high',
        effort: 'medium',
        actionSteps: [
          'Review processing queue',
          'Allocate additional resources',
          'Identify automation opportunities'
        ],
      })
    }

    // Check for overdue documents
    const overdueDocs = documents.filter(d =>
      d.dueDate && d.dueDate < new Date() && d.status !== 'completed'
    )
    if (overdueDocs.length > 0) {
      recommendations.push({
        id: 'overdue_documents',
        type: 'compliance',
        title: 'Overdue Documents Require Attention',
        description: `${overdueDocs.length} documents are past their due date`,
        impact: 'high',
        effort: 'low',
        actionSteps: [
          'Prioritize overdue documents',
          'Contact client for missing information',
          'Expedite processing'
        ],
      })
    }

    // Check for quality issues
    const lowQualityDocs = documents.filter(d =>
      d.qualityScore && d.qualityScore < 0.8
    )
    if (lowQualityDocs.length > 0) {
      recommendations.push({
        id: 'quality_improvement',
        type: 'quality',
        title: 'Document Quality Issues',
        description: 'Some documents have low quality scores',
        impact: 'medium',
        effort: 'medium',
        actionSteps: [
          'Review document quality criteria',
          'Provide client guidance on document submission',
          'Implement quality checks'
        ],
      })
    }

    // Check for efficiency opportunities
    const avgProcessingTime = documents
      .filter(d => d.actualCompletionTime)
      .reduce((sum, d) => sum + (d.actualCompletionTime || 0), 0) / documents.length

    if (avgProcessingTime > 60) { // More than 1 hour average
      recommendations.push({
        id: 'efficiency_improvement',
        type: 'efficiency',
        title: 'Processing Time Optimization',
        description: 'Average processing time is higher than expected',
        impact: 'medium',
        effort: 'high',
        actionSteps: [
          'Analyze processing workflows',
          'Identify automation opportunities',
          'Streamline review processes'
        ],
      })
    }

    return recommendations
  }

  /**
   * Helper methods
   */
  private findEntryByDocumentId(documentId: string): DocumentTrackingEntry | undefined {
    return Array.from(this.trackingEntries.values())
      .find(entry => entry.documentId === documentId)
  }

  private estimateProcessingTime(documentType: string): number {
    const timeEstimates: Record<string, number> = {
      'W-2': 15,
      '1099-INT': 10,
      '1099-DIV': 10,
      '1099-NEC': 20,
      'K-1': 45,
      'Brokerage Statement': 30,
      'Business Receipt': 5,
      'Bank Statement': 25,
      'Unknown': 20,
    }

    return timeEstimates[documentType] || 20
  }

  private calculateActualTime(entry: DocumentTrackingEntry): number {
    if (!entry.completedAt) return 0
    return Math.round((entry.completedAt.getTime() - entry.uploadedAt.getTime()) / (1000 * 60))
  }

  private checkForAlerts(entry: DocumentTrackingEntry): void {
    // Check for deadline alerts
    if (entry.dueDate && entry.status !== 'completed') {
      const daysUntilDue = Math.ceil(
        (entry.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilDue <= 0) {
        this.addAlert(
          entry.documentId,
          'deadline',
          'critical',
          `Document ${entry.documentName} is overdue`,
          'Complete processing immediately'
        )
      } else if (daysUntilDue <= 3) {
        this.addAlert(
          entry.documentId,
          'deadline',
          'warning',
          `Document ${entry.documentName} due in ${daysUntilDue} days`,
          'Prioritize processing',
          entry.dueDate
        )
      }
    }

    // Check for processing time alerts
    const processingTime = new Date().getTime() - entry.uploadedAt.getTime()
    const processingHours = processingTime / (1000 * 60 * 60)

    if (processingHours > 24 && entry.status === 'processing') {
      this.addAlert(
        entry.documentId,
        'quality',
        'warning',
        `Document ${entry.documentName} has been processing for over 24 hours`,
        'Review processing status'
      )
    }
  }

  private resolveAlertsForDocument(documentId: string): void {
    const entry = this.findEntryByDocumentId(documentId)
    if (!entry) return

    entry.alerts.forEach(alert => {
      if (!alert.resolvedAt) {
        alert.resolvedAt = new Date()
      }
    })
  }

  private getActiveAlertsForClient(clientId: string): DocumentAlert[] {
    const clientDocuments = Array.from(this.trackingEntries.values())
      .filter(entry => entry.clientId === clientId)

    const alerts: DocumentAlert[] = []
    clientDocuments.forEach(doc => {
      alerts.push(...doc.alerts.filter(alert => !alert.resolvedAt))
    })

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  private getTimelineForClient(clientId: string): TimelineEvent[] {
    return this.timeline
      .filter(event => {
        if (event.documentId) {
          const entry = this.findEntryByDocumentId(event.documentId)
          return entry?.clientId === clientId
        }
        return false
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50) // Last 50 events
  }

  private addTimelineEvent(
    type: TimelineEvent['type'],
    description: string,
    documentId?: string,
    metadata: Record<string, any> = {}
  ): void {
    const event: TimelineEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      description,
      documentId,
      metadata,
    }

    this.timeline.push(event)
  }

  private calculateQualityScore(documents: DocumentTrackingEntry[]): number {
    if (documents.length === 0) return 100

    const qualityScores = documents
      .filter(d => d.qualityScore !== undefined)
      .map(d => d.qualityScore!)

    if (qualityScores.length === 0) return 85 // Default score

    return Math.round(
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length * 100
    )
  }

  private calculateComplianceScore(documents: DocumentTrackingEntry[]): number {
    if (documents.length === 0) return 100

    const overdueDocs = documents.filter(d =>
      d.dueDate && d.dueDate < new Date() && d.status !== 'completed'
    ).length

    const complianceRate = 1 - (overdueDocs / documents.length)
    return Math.round(complianceRate * 100)
  }

  private estimateCompletionDate(documents: DocumentTrackingEntry[]): Date {
    const pendingDocs = documents.filter(d => d.status !== 'completed')
    const totalEstimatedTime = pendingDocs.reduce(
      (sum, doc) => sum + doc.estimatedCompletionTime, 0
    )

    const completionDate = new Date()
    completionDate.setMinutes(completionDate.getMinutes() + totalEstimatedTime)
    return completionDate
  }

  private calculateMilestoneDate(
    documents: DocumentTrackingEntry[],
    type: 'collection' | 'processing' | 'review'
  ): Date {
    const baseDate = new Date()

    switch (type) {
      case 'collection':
        baseDate.setDate(baseDate.getDate() + 7) // 1 week for collection
        break
      case 'processing':
        baseDate.setDate(baseDate.getDate() + 14) // 2 weeks for processing
        break
      case 'review':
        baseDate.setDate(baseDate.getDate() + 21) // 3 weeks for review
        break
    }

    return baseDate
  }
}
