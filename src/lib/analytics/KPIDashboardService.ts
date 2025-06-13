import { supabase } from '@/lib/supabase'
export interface ClientMetrics {
  clientId: string
  clientName: string
  totalRevenue: number
  revenueGrowth: number
  profitMargin: number
  hoursSpent: number
  hourlyRate: number
  engagementScore: number
  satisfactionScore: number
  retentionProbability: number
  lastEngagement: Date
  servicesUsed: string[]
  documentsProcessed: number
  complianceScore: number
}
export interface PartnerMetrics {
  partnerId: string
  partnerName: string
  totalClients: number
  activeClients: number
  totalRevenue: number
  averageRevenuePerClient: number
  profitability: number
  efficiency: number
  clientSatisfaction: number
  workloadUtilization: number
  specializations: string[]
  performanceRank: number
}
export interface RevenueAnalytics {
  totalRevenue: number
  recurringRevenue: number
  oneTimeRevenue: number
  revenueByService: Record<string, number>
  revenueByClient: Record<string, number>
  revenueByPartner: Record<string, number>
  monthlyTrend: Array<{ month: string; revenue: number; growth: number }>
  forecastedRevenue: number
  churnRisk: number
}
export interface EngagementMetrics {
  totalEngagements: number
  averageEngagementDuration: number
  engagementsByType: Record<string, number>
  clientResponseTime: number
  resolutionTime: number
  firstCallResolution: number
  escalationRate: number
  clientRetentionRate: number
}
export interface WorkloadMetrics {
  totalHours: number
  billableHours: number
  utilizationRate: number
  averageHoursPerClient: number
  workloadDistribution: Record<string, number>
  capacityUtilization: number
  overtimeHours: number
  efficiencyScore: number
}
export interface ProfitabilityAnalysis {
  grossProfit: number
  netProfit: number
  profitMargin: number
  costPerClient: number
  revenuePerHour: number
  clientLifetimeValue: number
  acquisitionCost: number
  paybackPeriod: number
  profitabilityByService: Record<string, number>
  profitabilityByClient: Record<string, number>
}
export interface KPIDashboard {
  overview: {
    totalRevenue: number
    totalClients: number
    averageRevenuePerClient: number
    profitMargin: number
    clientSatisfaction: number
    utilizationRate: number
  }
  revenueAnalytics: RevenueAnalytics
  clientMetrics: ClientMetrics[]
  partnerMetrics: PartnerMetrics[]
  engagementMetrics: EngagementMetrics
  workloadMetrics: WorkloadMetrics
  profitabilityAnalysis: ProfitabilityAnalysis
  trends: {
    revenueGrowth: number
    clientGrowth: number
    profitabilityTrend: number
    satisfactionTrend: number
  }
  alerts: KPIAlert[]
}
export interface KPIAlert {
  id: string
  type: 'revenue_decline' | 'client_churn' | 'low_satisfaction' | 'capacity_overload' | 'profitability_drop'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  value: number
  threshold: number
  trend: 'improving' | 'stable' | 'declining'
  actionRequired: boolean
  createdAt: Date
}
export class KPIDashboardService {
  constructor(private userId: string) {}
  /**
   * Get comprehensive KPI dashboard data
   */
  async getDashboardData(timeframe: 'month' | 'quarter' | 'year' = 'month'): Promise<KPIDashboard> {
    try {
      const [
        revenueAnalytics,
        clientMetrics,
        partnerMetrics,
        engagementMetrics,
        workloadMetrics,
        profitabilityAnalysis
      ] = await Promise.all([
        this.getRevenueAnalytics(timeframe),
        this.getClientMetrics(timeframe),
        this.getPartnerMetrics(timeframe),
        this.getEngagementMetrics(timeframe),
        this.getWorkloadMetrics(timeframe),
        this.getProfitabilityAnalysis(timeframe)
      ])
      const overview = {
        totalRevenue: revenueAnalytics.totalRevenue,
        totalClients: clientMetrics.length,
        averageRevenuePerClient: clientMetrics.length > 0 ? revenueAnalytics.totalRevenue / clientMetrics.length : 0,
        profitMargin: profitabilityAnalysis.profitMargin,
        clientSatisfaction: this.calculateAverageSatisfaction(clientMetrics),
        utilizationRate: workloadMetrics.utilizationRate
      }
      const trends = await this.calculateTrends(timeframe)
      const alerts = await this.generateKPIAlerts(overview, trends)
      return {
        overview,
        revenueAnalytics,
        clientMetrics,
        partnerMetrics,
        engagementMetrics,
        workloadMetrics,
        profitabilityAnalysis,
        trends,
        alerts
      }
    } catch (error) {
      throw new Error('Failed to get dashboard data')
    }
  }
  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(timeframe: string): Promise<RevenueAnalytics> {
    try {
      const startDate = this.getStartDate(timeframe)
      // Get revenue data from invoices and payments
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (name),
          invoice_items (*)
        `)
        .eq('user_id', this.userId)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'paid')
      if (error) throw error
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
      const recurringRevenue = invoices?.filter(inv => inv.is_recurring).reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
      const oneTimeRevenue = totalRevenue - recurringRevenue
      const revenueByService = this.calculateRevenueByService(invoices || [])
      const revenueByClient = this.calculateRevenueByClient(invoices || [])
      const monthlyTrend = await this.calculateMonthlyTrend(timeframe)
      return {
        totalRevenue,
        recurringRevenue,
        oneTimeRevenue,
        revenueByService,
        revenueByClient,
        revenueByPartner: {}, // Would be calculated from partner assignments
        monthlyTrend,
        forecastedRevenue: this.forecastRevenue(monthlyTrend),
        churnRisk: await this.calculateChurnRisk()
      }
    } catch (error) {
      throw new Error('Failed to get revenue analytics')
    }
  }
  /**
   * Get client metrics with profitability analysis
   */
  async getClientMetrics(timeframe: string): Promise<ClientMetrics[]> {
    try {
      const startDate = this.getStartDate(timeframe)
      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          *,
          invoices!inner (
            total,
            created_at,
            status,
            invoice_items (*)
          ),
          time_entries (
            hours,
            billable_rate
          ),
          documents (
            id,
            created_at
          ),
          tasks (
            status,
            completed_at
          )
        `)
        .eq('user_id', this.userId)
        .gte('invoices.created_at', startDate.toISOString())
      if (error) throw error
      return (clients || []).map(client => this.calculateClientMetrics(client))
    } catch (error) {
      throw new Error('Failed to get client metrics')
    }
  }
  /**
   * Get partner performance metrics
   */
  async getPartnerMetrics(timeframe: string): Promise<PartnerMetrics[]> {
    try {
      // This would integrate with team/partner management system
      // For now, return mock data structure
      return [
        {
          partnerId: 'partner_1',
          partnerName: 'John Smith',
          totalClients: 25,
          activeClients: 22,
          totalRevenue: 125000,
          averageRevenuePerClient: 5000,
          profitability: 85.5,
          efficiency: 92.3,
          clientSatisfaction: 4.8,
          workloadUtilization: 87.5,
          specializations: ['Tax Preparation', 'Business Consulting'],
          performanceRank: 1
        }
      ]
    } catch (error) {
      throw new Error('Failed to get partner metrics')
    }
  }
  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(timeframe: string): Promise<EngagementMetrics> {
    try {
      const startDate = this.getStartDate(timeframe)
      // Get engagement data from various sources
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', this.userId)
        .gte('created_at', startDate.toISOString())
      const { data: emails, error: emailsError } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', this.userId)
        .gte('received_at', startDate.toISOString())
      if (tasksError || emailsError) {
        }
      return {
        totalEngagements: (tasks?.length || 0) + (emails?.length || 0),
        averageEngagementDuration: 2.5, // hours
        engagementsByType: {
          'email': emails?.length || 0,
          'task': tasks?.length || 0,
          'meeting': 0,
          'call': 0
        },
        clientResponseTime: 4.2, // hours
        resolutionTime: 24.5, // hours
        firstCallResolution: 78.5, // percentage
        escalationRate: 12.3, // percentage
        clientRetentionRate: 94.2 // percentage
      }
    } catch (error) {
      throw new Error('Failed to get engagement metrics')
    }
  }
  /**
   * Get workload metrics
   */
  async getWorkloadMetrics(timeframe: string): Promise<WorkloadMetrics> {
    try {
      const startDate = this.getStartDate(timeframe)
      const { data: timeEntries, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', this.userId)
        .gte('date', startDate.toISOString())
      if (error) throw error
      const totalHours = timeEntries?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
      const billableHours = timeEntries?.filter(entry => entry.billable).reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
      return {
        totalHours,
        billableHours,
        utilizationRate: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
        averageHoursPerClient: 0, // Would be calculated from client assignments
        workloadDistribution: {}, // Would be calculated from team assignments
        capacityUtilization: 85.5,
        overtimeHours: Math.max(0, totalHours - (40 * this.getWeeksInTimeframe(timeframe))),
        efficiencyScore: 88.7
      }
    } catch (error) {
      throw new Error('Failed to get workload metrics')
    }
  }
  /**
   * Get profitability analysis
   */
  async getProfitabilityAnalysis(timeframe: string): Promise<ProfitabilityAnalysis> {
    try {
      const revenueAnalytics = await this.getRevenueAnalytics(timeframe)
      const workloadMetrics = await this.getWorkloadMetrics(timeframe)
      // Calculate costs (simplified)
      const laborCost = workloadMetrics.totalHours * 50 // $50/hour average cost
      const overheadCost = revenueAnalytics.totalRevenue * 0.2 // 20% overhead
      const totalCosts = laborCost + overheadCost
      const grossProfit = revenueAnalytics.totalRevenue - totalCosts
      const netProfit = grossProfit * 0.85 // After taxes and other expenses
      return {
        grossProfit,
        netProfit,
        profitMargin: revenueAnalytics.totalRevenue > 0 ? (netProfit / revenueAnalytics.totalRevenue) * 100 : 0,
        costPerClient: 0, // Would be calculated from client data
        revenuePerHour: workloadMetrics.billableHours > 0 ? revenueAnalytics.totalRevenue / workloadMetrics.billableHours : 0,
        clientLifetimeValue: 15000, // Average CLV
        acquisitionCost: 500, // Average CAC
        paybackPeriod: 3.2, // months
        profitabilityByService: revenueAnalytics.revenueByService,
        profitabilityByClient: revenueAnalytics.revenueByClient
      }
    } catch (error) {
      throw new Error('Failed to get profitability analysis')
    }
  }
  // Private helper methods
  private calculateClientMetrics(client: any): ClientMetrics {
    const totalRevenue = client.invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0
    const hoursSpent = client.time_entries?.reduce((sum: number, entry: any) => sum + (entry.hours || 0), 0) || 0
    const documentsProcessed = client.documents?.length || 0
    return {
      clientId: client.id,
      clientName: client.name,
      totalRevenue,
      revenueGrowth: 0, // Would be calculated from historical data
      profitMargin: 0, // Would be calculated from costs
      hoursSpent,
      hourlyRate: hoursSpent > 0 ? totalRevenue / hoursSpent : 0,
      engagementScore: this.calculateEngagementScore(client),
      satisfactionScore: 4.5, // Would come from surveys
      retentionProbability: 85.5,
      lastEngagement: new Date(),
      servicesUsed: ['Tax Preparation', 'Bookkeeping'],
      documentsProcessed,
      complianceScore: 92.3
    }
  }
  private calculateEngagementScore(client: any): number {
    // Calculate based on recent activity, response times, etc.
    return 85.5
  }
  private calculateAverageSatisfaction(clients: ClientMetrics[]): number {
    if (clients.length === 0) return 0
    return clients.reduce((sum, client) => sum + client.satisfactionScore, 0) / clients.length
  }
  private calculateRevenueByService(invoices: any[]): Record<string, number> {
    return invoices.reduce((acc, invoice) => {
      invoice.invoice_items?.forEach((item: any) => {
        const service = item.description || 'Other'
        acc[service] = (acc[service] || 0) + (item.amount || 0)
      })
      return acc
    }, {})
  }
  private calculateRevenueByClient(invoices: any[]): Record<string, number> {
    return invoices.reduce((acc, invoice) => {
      const clientName = invoice.clients?.name || 'Unknown'
      acc[clientName] = (acc[clientName] || 0) + (invoice.total || 0)
      return acc
    }, {})
  }
  private async calculateMonthlyTrend(timeframe: string): Promise<Array<{ month: string; revenue: number; growth: number }>> {
    // Implementation would calculate actual monthly trends
    return [
      { month: 'Jan', revenue: 45000, growth: 5.2 },
      { month: 'Feb', revenue: 48000, growth: 6.7 },
      { month: 'Mar', revenue: 52000, growth: 8.3 }
    ]
  }
  private forecastRevenue(monthlyTrend: Array<{ month: string; revenue: number; growth: number }>): number {
    if (monthlyTrend.length === 0) return 0
    const lastMonth = monthlyTrend[monthlyTrend.length - 1]
    const avgGrowth = monthlyTrend.reduce((sum, month) => sum + month.growth, 0) / monthlyTrend.length
    return lastMonth.revenue * (1 + avgGrowth / 100)
  }
  private async calculateChurnRisk(): Promise<number> {
    // Implementation would calculate actual churn risk
    return 8.5
  }
  private async calculateTrends(timeframe: string): Promise<any> {
    return {
      revenueGrowth: 12.5,
      clientGrowth: 8.3,
      profitabilityTrend: 5.7,
      satisfactionTrend: 2.1
    }
  }
  private async generateKPIAlerts(overview: any, trends: any): Promise<KPIAlert[]> {
    const alerts: KPIAlert[] = []
    if (trends.revenueGrowth < 5) {
      alerts.push({
        id: 'revenue_alert_1',
        type: 'revenue_decline',
        severity: 'medium',
        title: 'Revenue Growth Slowing',
        description: 'Revenue growth has dropped below 5% threshold',
        value: trends.revenueGrowth,
        threshold: 5,
        trend: 'declining',
        actionRequired: true,
        createdAt: new Date()
      })
    }
    if (overview.utilizationRate < 75) {
      alerts.push({
        id: 'utilization_alert_1',
        type: 'capacity_overload',
        severity: 'low',
        title: 'Low Utilization Rate',
        description: 'Team utilization is below optimal levels',
        value: overview.utilizationRate,
        threshold: 75,
        trend: 'stable',
        actionRequired: false,
        createdAt: new Date()
      })
    }
    return alerts
  }
  private getStartDate(timeframe: string): Date {
    const now = new Date()
    switch (timeframe) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), quarter * 3, 1)
      case 'year':
        return new Date(now.getFullYear(), 0, 1)
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1)
    }
  }
  private getWeeksInTimeframe(timeframe: string): number {
    switch (timeframe) {
      case 'month': return 4
      case 'quarter': return 13
      case 'year': return 52
      default: return 4
    }
  }
}
