import { supabase } from '@/lib/supabase'
export interface W9Status {
  id: string
  vendorId: string
  clientId: string
  status: 'not_requested' | 'requested' | 'received' | 'expired' | 'invalid'
  requestedDate?: Date
  receivedDate?: Date
  expirationDate?: Date
  documentId?: string
  reminderCount: number
  lastReminderDate?: Date
  notes?: string
}
export interface VendorInfo {
  id: string
  clientId: string
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  businessType: 'individual' | 'corporation' | 'partnership' | 'llc' | 'other'
  totalPayments: number
  requires1099: boolean
  w9Status: W9Status
  createdAt: Date
  updatedAt: Date
}
export interface ComplianceAlert {
  id: string
  type: 'w9_missing' | 'w9_expired' | '1099_deadline' | 'threshold_exceeded' | 'backup_withholding'
  priority: 'low' | 'medium' | 'high' | 'critical'
  vendorId?: string
  clientId: string
  title: string
  description: string
  dueDate?: Date
  isResolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  createdAt: Date
}
export interface ComplianceReport {
  totalVendors: number
  requires1099Count: number
  w9StatusBreakdown: Record<string, number>
  upcomingDeadlines: ComplianceAlert[]
  criticalIssues: ComplianceAlert[]
  complianceScore: number
}
export class ComplianceTrackingService {
  constructor(private userId: string) {}
  /**
   * Add or update vendor information
   */
  async addVendor(vendorData: Omit<VendorInfo, 'id' | 'w9Status' | 'createdAt' | 'updatedAt'>): Promise<VendorInfo> {
    try {
      // Check if vendor already exists
      const { data: existingVendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('client_id', vendorData.clientId)
        .eq('name', vendorData.name)
        .single()
      if (existingVendor) {
        // Update existing vendor
        const { data: updatedVendor, error } = await supabase
          .from('vendors')
          .update({
            ...vendorData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVendor.id)
          .select()
          .single()
        if (error) throw error
        return this.transformVendorData(updatedVendor)
      }
      // Create new vendor
      const { data: newVendor, error } = await supabase
        .from('vendors')
        .insert({
          ...vendorData,
          user_id: this.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      if (error) throw error
      // Create initial W-9 status
      await this.createW9Status(newVendor.id, vendorData.clientId)
      return this.transformVendorData(newVendor)
    } catch (error) {
      throw new Error('Failed to add vendor')
    }
  }
  /**
   * Update vendor payment total and check 1099 requirements
   */
  async updateVendorPayments(vendorId: string, paymentAmount: number): Promise<void> {
    try {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single()
      if (vendorError || !vendor) throw new Error('Vendor not found')
      const newTotal = vendor.total_payments + paymentAmount
      const requires1099 = newTotal >= 600 // IRS threshold
      // Update vendor
      await supabase
        .from('vendors')
        .update({
          total_payments: newTotal,
          requires_1099: requires1099,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId)
      // Check if W-9 is needed and create alerts
      if (requires1099) {
        await this.checkW9Requirements(vendorId)
      }
      // Create compliance alert if threshold exceeded
      if (vendor.total_payments < 600 && newTotal >= 600) {
        await this.createComplianceAlert({
          type: 'threshold_exceeded',
          priority: 'medium',
          vendorId,
          clientId: vendor.client_id,
          title: '1099 Threshold Exceeded',
          description: `Vendor ${vendor.name} has exceeded $600 in payments and now requires 1099 reporting.`,
          dueDate: new Date(new Date().getFullYear() + 1, 0, 31) // January 31st next year
        })
      }
    } catch (error) {
      throw new Error('Failed to update vendor payments')
    }
  }
  /**
   * Request W-9 from vendor
   */
  async requestW9(vendorId: string, sendEmail: boolean = true): Promise<void> {
    try {
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select(`
          *,
          w9_status (*)
        `)
        .eq('id', vendorId)
        .single()
      if (error || !vendor) throw new Error('Vendor not found')
      // Update W-9 status
      await supabase
        .from('w9_status')
        .update({
          status: 'requested',
          requested_date: new Date().toISOString(),
          reminder_count: vendor.w9_status?.reminder_count || 0 + 1,
          last_reminder_date: new Date().toISOString()
        })
        .eq('vendor_id', vendorId)
      if (sendEmail && vendor.email) {
        await this.sendW9RequestEmail(vendor)
      }
      // Create follow-up reminder
      await this.scheduleW9Reminder(vendorId, 7) // Remind in 7 days
    } catch (error) {
      throw new Error('Failed to request W-9')
    }
  }
  /**
   * Mark W-9 as received
   */
  async markW9Received(vendorId: string, documentId: string): Promise<void> {
    try {
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 3) // W-9s expire after 3 years
      await supabase
        .from('w9_status')
        .update({
          status: 'received',
          received_date: new Date().toISOString(),
          expiration_date: expirationDate.toISOString(),
          document_id: documentId
        })
        .eq('vendor_id', vendorId)
      // Resolve any related compliance alerts
      await this.resolveComplianceAlerts(vendorId, 'w9_missing')
    } catch (error) {
      throw new Error('Failed to mark W-9 as received')
    }
  }
  /**
   * Get compliance dashboard data
   */
  async getComplianceReport(clientId?: string): Promise<ComplianceReport> {
    try {
      let vendorsQuery = supabase
        .from('vendors')
        .select(`
          *,
          w9_status (*)
        `)
        .eq('user_id', this.userId)
      if (clientId) {
        vendorsQuery = vendorsQuery.eq('client_id', clientId)
      }
      const { data: vendors, error: vendorsError } = await vendorsQuery
      if (vendorsError) throw vendorsError
      const { data: alerts, error: alertsError } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('user_id', this.userId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
      if (alertsError) throw alertsError
      // Calculate metrics
      const totalVendors = vendors?.length || 0
      const requires1099Count = vendors?.filter(v => v.requires_1099).length || 0
      const w9StatusBreakdown = vendors?.reduce((acc, vendor) => {
        const status = vendor.w9_status?.status || 'not_requested'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      const upcomingDeadlines = alerts?.filter(alert =>
        alert.due_date && new Date(alert.due_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ) || []
      const criticalIssues = alerts?.filter(alert => alert.priority === 'critical') || []
      // Calculate compliance score (0-100)
      const w9Received = vendors?.filter(v => v.w9_status?.status === 'received').length || 0
      const complianceScore = requires1099Count > 0 ? Math.round((w9Received / requires1099Count) * 100) : 100
      return {
        totalVendors,
        requires1099Count,
        w9StatusBreakdown,
        upcomingDeadlines: upcomingDeadlines.map(this.transformAlertData),
        criticalIssues: criticalIssues.map(this.transformAlertData),
        complianceScore
      }
    } catch (error) {
      throw new Error('Failed to get compliance report')
    }
  }
  /**
   * Get vendors requiring attention
   */
  async getVendorsRequiringAttention(): Promise<VendorInfo[]> {
    try {
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select(`
          *,
          w9_status (*)
        `)
        .eq('user_id', this.userId)
        .eq('requires_1099', true)
        .or('w9_status.status.eq.not_requested,w9_status.status.eq.expired,w9_status.status.eq.invalid')
      if (error) throw error
      return vendors?.map(this.transformVendorData) || []
    } catch (error) {
      throw new Error('Failed to get vendors requiring attention')
    }
  }
  /**
   * Automated compliance check (run daily)
   */
  async runComplianceCheck(): Promise<void> {
    try {
      // Check for expired W-9s
      await this.checkExpiredW9s()
      // Check for missing W-9s
      await this.checkMissingW9s()
      // Check for upcoming deadlines
      await this.checkUpcomingDeadlines()
      // Send reminder emails
      await this.sendScheduledReminders()
    } catch (error) {
      
    }
  }
  // Private helper methods
  private async createW9Status(vendorId: string, clientId: string): Promise<void> {
    await supabase
      .from('w9_status')
      .insert({
        vendor_id: vendorId,
        client_id: clientId,
        status: 'not_requested',
        reminder_count: 0
      })
  }
  private async checkW9Requirements(vendorId: string): Promise<void> {
    const { data: w9Status } = await supabase
      .from('w9_status')
      .select('*')
      .eq('vendor_id', vendorId)
      .single()
    if (!w9Status || w9Status.status === 'not_requested') {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single()
      if (vendor) {
        await this.createComplianceAlert({
          type: 'w9_missing',
          priority: 'high',
          vendorId,
          clientId: vendor.client_id,
          title: 'W-9 Required',
          description: `W-9 form is required for vendor ${vendor.name} who has exceeded the 1099 reporting threshold.`
        })
      }
    }
  }
  private async createComplianceAlert(alertData: Omit<ComplianceAlert, 'id' | 'isResolved' | 'createdAt'>): Promise<void> {
    await supabase
      .from('compliance_alerts')
      .insert({
        ...alertData,
        user_id: this.userId,
        is_resolved: false,
        created_at: new Date().toISOString()
      })
  }
  private async resolveComplianceAlerts(vendorId: string, type: string): Promise<void> {
    await supabase
      .from('compliance_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: this.userId
      })
      .eq('vendor_id', vendorId)
      .eq('type', type)
      .eq('is_resolved', false)
  }
  private async sendW9RequestEmail(vendor: any): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Sending W-9 request email to ${vendor.email}`)
  }
  private async scheduleW9Reminder(vendorId: string, daysFromNow: number): Promise<void> {
    // Implementation would integrate with scheduling service
    console.log(`Scheduling W-9 reminder for vendor ${vendorId} in ${daysFromNow} days`)
  }
  private async checkExpiredW9s(): Promise<void> {
    const { data: expiredW9s } = await supabase
      .from('w9_status')
      .select(`
        *,
        vendors (*)
      `)
      .eq('status', 'received')
      .lt('expiration_date', new Date().toISOString())
    for (const w9 of expiredW9s || []) {
      await supabase
        .from('w9_status')
        .update({ status: 'expired' })
        .eq('id', w9.id)
      await this.createComplianceAlert({
        type: 'w9_expired',
        priority: 'high',
        vendorId: w9.vendor_id,
        clientId: w9.client_id,
        title: 'W-9 Expired',
        description: `W-9 form for vendor ${w9.vendors.name} has expired and needs to be renewed.`
      })
    }
  }
  private async checkMissingW9s(): Promise<void> {
    const { data: vendorsWithoutW9 } = await supabase
      .from('vendors')
      .select(`
        *,
        w9_status (*)
      `)
      .eq('user_id', this.userId)
      .eq('requires_1099', true)
      .is('w9_status.id', null)
    for (const vendor of vendorsWithoutW9 || []) {
      await this.createComplianceAlert({
        type: 'w9_missing',
        priority: 'medium',
        vendorId: vendor.id,
        clientId: vendor.client_id,
        title: 'Missing W-9 Form',
        description: `W-9 form required for vendor ${vendor.name} but not yet requested.`
      })
    }
  }
  private async checkUpcomingDeadlines(): Promise<void> {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const { data: upcomingDeadlines } = await supabase
      .from('w9_status')
      .select(`
        *,
        vendors (*)
      `)
      .eq('status', 'received')
      .lte('expiration_date', thirtyDaysFromNow.toISOString())
      .gt('expiration_date', new Date().toISOString())
    for (const w9 of upcomingDeadlines || []) {
      await this.createComplianceAlert({
        type: 'w9_expiring',
        priority: 'medium',
        vendorId: w9.vendor_id,
        clientId: w9.client_id,
        title: 'W-9 Expiring Soon',
        description: `W-9 form for vendor ${w9.vendors.name} expires on ${new Date(w9.expiration_date).toLocaleDateString()}.`,
        dueDate: new Date(w9.expiration_date)
      })
    }
  }
  private async sendScheduledReminders(): Promise<void> {
    const { data: pendingReminders } = await supabase
      .from('w9_status')
      .select(`
        *,
        vendors (*)
      `)
      .eq('status', 'not_requested')
      .lt('reminder_count', 3) // Max 3 reminders
    for (const w9 of pendingReminders || []) {
      // Check if enough time has passed since last reminder (7 days)
      const lastReminder = w9.last_reminder_date ? new Date(w9.last_reminder_date) : null
      const daysSinceLastReminder = lastReminder
        ? Math.floor((new Date().getTime() - lastReminder.getTime()) / (1000 * 60 * 60 * 24))
        : 999
      if (daysSinceLastReminder >= 7) {
        // Update reminder count and date
        await supabase
          .from('w9_status')
          .update({
            reminder_count: w9.reminder_count + 1,
            last_reminder_date: new Date().toISOString()
          })
          .eq('id', w9.id)
        // Create alert for manual follow-up
        await this.createComplianceAlert({
          type: 'w9_reminder',
          priority: 'low',
          vendorId: w9.vendor_id,
          clientId: w9.client_id,
          title: 'W-9 Reminder Needed',
          description: `Send reminder #${w9.reminder_count + 1} to vendor ${w9.vendors.name} for W-9 form.`
        })
      }
    }
  }
  private transformVendorData(vendor: any): VendorInfo {
    return {
      id: vendor.id,
      clientId: vendor.client_id,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      taxId: vendor.tax_id,
      businessType: vendor.business_type,
      totalPayments: vendor.total_payments,
      requires1099: vendor.requires_1099,
      w9Status: vendor.w9_status ? {
        id: vendor.w9_status.id,
        vendorId: vendor.w9_status.vendor_id,
        clientId: vendor.w9_status.client_id,
        status: vendor.w9_status.status,
        requestedDate: vendor.w9_status.requested_date ? new Date(vendor.w9_status.requested_date) : undefined,
        receivedDate: vendor.w9_status.received_date ? new Date(vendor.w9_status.received_date) : undefined,
        expirationDate: vendor.w9_status.expiration_date ? new Date(vendor.w9_status.expiration_date) : undefined,
        documentId: vendor.w9_status.document_id,
        reminderCount: vendor.w9_status.reminder_count,
        lastReminderDate: vendor.w9_status.last_reminder_date ? new Date(vendor.w9_status.last_reminder_date) : undefined,
        notes: vendor.w9_status.notes
      } : {} as W9Status,
      createdAt: new Date(vendor.created_at),
      updatedAt: new Date(vendor.updated_at)
    }
  }
  private transformAlertData(alert: any): ComplianceAlert {
    return {
      id: alert.id,
      type: alert.type,
      priority: alert.priority,
      vendorId: alert.vendor_id,
      clientId: alert.client_id,
      title: alert.title,
      description: alert.description,
      dueDate: alert.due_date ? new Date(alert.due_date) : undefined,
      isResolved: alert.is_resolved,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : undefined,
      resolvedBy: alert.resolved_by,
      createdAt: new Date(alert.created_at)
    }
  }
}
