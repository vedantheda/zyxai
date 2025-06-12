// 1099 Compliance Tracking
export { ComplianceTrackingService } from '@/lib/compliance/ComplianceTrackingService'
export type {
  W9Status,
  VendorInfo,
  ComplianceAlert,
  ComplianceReport
} from '@/lib/compliance/ComplianceTrackingService'

// AI-Powered Email Management
export { EmailManagementService } from '@/lib/email/EmailManagementService'
export type {
  EmailMessage,
  EmailSummary,
  EmailRoutingRule,
  TeamMember
} from '@/lib/email/EmailManagementService'

// Partner KPI Dashboards
export { KPIDashboardService } from '@/lib/analytics/KPIDashboardService'
export type {
  ClientMetrics,
  PartnerMetrics,
  RevenueAnalytics,
  EngagementMetrics,
  WorkloadMetrics,
  ProfitabilityAnalysis,
  KPIDashboard as KPIDashboardType,
  KPIAlert
} from '@/lib/analytics/KPIDashboardService'

// Compliance & Deadline Alerts
export { DeadlineAlertService } from '@/lib/alerts/DeadlineAlertService'
export type {
  TaxDeadline,
  ReminderSchedule,
  ClientInactivityAlert,
  EscalationWorkflow,
  ComplianceAlert as DeadlineComplianceAlert,
  AlertDashboard
} from '@/lib/alerts/DeadlineAlertService'

// Components
export { default as ComplianceDashboard } from '@/components/compliance/ComplianceDashboard'
export { default as KPIDashboard } from '@/components/analytics/KPIDashboard'
export { default as EmailManagementDashboard } from '@/components/email/EmailManagementDashboard'
export { default as DeadlineAlertsDashboard } from '@/components/alerts/DeadlineAlertsDashboard'

// Hooks
export { useCompliance } from '@/hooks/useCompliance'
export { useKPIDashboard } from '@/hooks/useKPIDashboard'
export { useEmailManagement } from '@/hooks/useEmailManagement'
export { useDeadlineAlerts } from '@/hooks/useDeadlineAlerts'

// Types
export type { UseComplianceOptions } from '@/hooks/useCompliance'
export type { UseKPIDashboardOptions } from '@/hooks/useKPIDashboard'
export type { UseEmailManagementOptions } from '@/hooks/useEmailManagement'
export type { UseDeadlineAlertsOptions } from '@/hooks/useDeadlineAlerts'

// Enhancement utilities
export const EnhancementUtils = {
  /**
   * Format compliance score for display
   */
  formatComplianceScore: (score: number): { level: string; color: string; description: string } => {
    if (score >= 95) {
      return {
        level: 'Excellent',
        color: 'text-green-600',
        description: 'Outstanding compliance record'
      }
    } else if (score >= 85) {
      return {
        level: 'Good',
        color: 'text-blue-600',
        description: 'Good compliance with minor issues'
      }
    } else if (score >= 70) {
      return {
        level: 'Fair',
        color: 'text-yellow-600',
        description: 'Acceptable compliance, needs improvement'
      }
    } else {
      return {
        level: 'Poor',
        color: 'text-red-600',
        description: 'Critical compliance issues require immediate attention'
      }
    }
  },

  /**
   * Calculate revenue growth rate
   */
  calculateGrowthRate: (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  },

  /**
   * Format currency with appropriate precision
   */
  formatCurrency: (amount: number, precision: number = 0): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(amount)
  },

  /**
   * Format percentage with appropriate precision
   */
  formatPercentage: (value: number, precision: number = 1): string => {
    return `${value.toFixed(precision)}%`
  },

  /**
   * Calculate days between dates
   */
  daysBetween: (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  },

  /**
   * Get priority color for UI elements
   */
  getPriorityColor: (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  },

  /**
   * Get status color for UI elements
   */
  getStatusColor: (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'resolved':
      case 'received': return 'text-green-600'
      case 'in_progress':
      case 'processing': return 'text-blue-600'
      case 'pending':
      case 'requested': return 'text-yellow-600'
      case 'overdue':
      case 'expired':
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  },

  /**
   * Generate alert severity badge variant
   */
  getAlertSeverityVariant: (severity: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive'
      case 'error': return 'destructive'
      case 'warning': return 'default'
      case 'info': return 'secondary'
      default: return 'outline'
    }
  },

  /**
   * Calculate utilization rate
   */
  calculateUtilizationRate: (billableHours: number, totalHours: number): number => {
    if (totalHours === 0) return 0
    return (billableHours / totalHours) * 100
  },

  /**
   * Calculate client lifetime value
   */
  calculateClientLifetimeValue: (
    averageMonthlyRevenue: number,
    averageClientLifespanMonths: number,
    profitMargin: number
  ): number => {
    return averageMonthlyRevenue * averageClientLifespanMonths * (profitMargin / 100)
  },

  /**
   * Generate compliance recommendations
   */
  generateComplianceRecommendations: (score: number, issues: string[]): string[] => {
    const recommendations: string[] = []

    if (score < 70) {
      recommendations.push('Immediate review of all compliance processes required')
      recommendations.push('Consider hiring compliance specialist')
    }

    if (score < 85) {
      recommendations.push('Implement automated compliance monitoring')
      recommendations.push('Schedule quarterly compliance reviews')
    }

    if (issues.includes('w9_missing')) {
      recommendations.push('Automate W-9 collection process')
      recommendations.push('Set up vendor onboarding workflow')
    }

    if (issues.includes('deadline_overdue')) {
      recommendations.push('Implement deadline tracking system')
      recommendations.push('Set up automated reminders')
    }

    return recommendations
  },

  /**
   * Calculate email processing efficiency
   */
  calculateEmailEfficiency: (
    totalEmails: number,
    processedEmails: number,
    averageProcessingTime: number
  ): { efficiency: number; throughput: number } => {
    const efficiency = totalEmails > 0 ? (processedEmails / totalEmails) * 100 : 0
    const throughput = averageProcessingTime > 0 ? 60 / averageProcessingTime : 0 // emails per hour

    return { efficiency, throughput }
  },

  /**
   * Generate workload distribution recommendations
   */
  generateWorkloadRecommendations: (
    utilizationRate: number,
    overtimeHours: number,
    teamSize: number
  ): string[] => {
    const recommendations: string[] = []

    if (utilizationRate > 90) {
      recommendations.push('Consider hiring additional team members')
      recommendations.push('Review and optimize current processes')
    }

    if (utilizationRate < 60) {
      recommendations.push('Increase client acquisition efforts')
      recommendations.push('Cross-train team members for flexibility')
    }

    if (overtimeHours > teamSize * 10) {
      recommendations.push('Redistribute workload more evenly')
      recommendations.push('Consider temporary staffing solutions')
    }

    return recommendations
  }
}

// Enhancement constants
export const ENHANCEMENT_CONSTANTS = {
  // Compliance thresholds
  COMPLIANCE_THRESHOLDS: {
    EXCELLENT: 95,
    GOOD: 85,
    FAIR: 70,
    POOR: 0
  },

  // 1099 reporting thresholds
  TAX_THRESHOLDS: {
    FORM_1099_MISC: 600,
    FORM_1099_NEC: 600,
    BACKUP_WITHHOLDING: 3000
  },

  // KPI benchmarks
  KPI_BENCHMARKS: {
    PROFIT_MARGIN: {
      EXCELLENT: 25,
      GOOD: 20,
      FAIR: 15,
      POOR: 10
    },
    UTILIZATION_RATE: {
      EXCELLENT: 85,
      GOOD: 75,
      FAIR: 65,
      POOR: 50
    },
    CLIENT_SATISFACTION: {
      EXCELLENT: 4.5,
      GOOD: 4.0,
      FAIR: 3.5,
      POOR: 3.0
    }
  },

  // Alert priorities
  ALERT_PRIORITIES: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  },

  // Email categories
  EMAIL_CATEGORIES: {
    TAX_QUESTION: 'tax_question',
    DOCUMENT_REQUEST: 'document_request',
    APPOINTMENT: 'appointment',
    PAYMENT: 'payment',
    COMPLIANCE: 'compliance',
    GENERAL: 'general'
  },

  // Deadline types
  DEADLINE_TYPES: {
    INDIVIDUAL: 'individual',
    BUSINESS: 'business',
    QUARTERLY: 'quarterly',
    ANNUAL: 'annual',
    EXTENSION: 'extension',
    AMENDMENT: 'amendment'
  },

  // Refresh intervals (in milliseconds)
  REFRESH_INTERVALS: {
    REAL_TIME: 30000,      // 30 seconds
    FREQUENT: 300000,      // 5 minutes
    NORMAL: 900000,        // 15 minutes
    SLOW: 3600000          // 1 hour
  }
}

// Error types for enhancements
export class EnhancementError extends Error {
  constructor(
    message: string,
    public code: string,
    public module: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'EnhancementError'
  }
}

export class ComplianceError extends EnhancementError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'COMPLIANCE_ERROR', 'compliance', details)
    this.name = 'ComplianceError'
  }
}

export class EmailProcessingError extends EnhancementError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'EMAIL_PROCESSING_ERROR', 'email', details)
    this.name = 'EmailProcessingError'
  }
}

export class KPICalculationError extends EnhancementError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'KPI_CALCULATION_ERROR', 'analytics', details)
    this.name = 'KPICalculationError'
  }
}

export class AlertProcessingError extends EnhancementError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ALERT_PROCESSING_ERROR', 'alerts', details)
    this.name = 'AlertProcessingError'
  }
}
