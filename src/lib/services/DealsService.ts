import { supabase } from '@/lib/supabase'
import { 
  Deal, 
  DealPipeline, 
  DealStage, 
  DealActivity,
  DealNote,
  DealTask,
  CreateDealRequest,
  UpdateDealRequest,
  DealFilters,
  DealStats,
  PipelineStats
} from '@/types/deals'

export class DealsService {
  // ============================================================================
  // PIPELINE MANAGEMENT
  // ============================================================================

  /**
   * Get all pipelines for an organization
   */
  static async getPipelines(organizationId: string): Promise<{
    pipelines: DealPipeline[]
    error: string | null
  }> {
    try {
      const { data: pipelines, error } = await supabase
        .from('deal_pipelines')
        .select(`
          *,
          stages:deal_stages(*)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) {
        return { pipelines: [], error: error.message }
      }

      return { pipelines: pipelines || [], error: null }
    } catch (error) {
      return { pipelines: [], error: 'Failed to fetch pipelines' }
    }
  }

  /**
   * Create default pipeline for new organization
   */
  static async createDefaultPipeline(organizationId: string, createdBy: string): Promise<{
    pipeline: DealPipeline | null
    error: string | null
  }> {
    try {
      // Create pipeline
      const { data: pipeline, error: pipelineError } = await supabase
        .from('deal_pipelines')
        .insert({
          organization_id: organizationId,
          name: 'Sales Pipeline',
          description: 'Default sales pipeline',
          is_default: true,
          created_by: createdBy
        })
        .select()
        .single()

      if (pipelineError) {
        return { pipeline: null, error: pipelineError.message }
      }

      // Create default stages
      const defaultStages = [
        { name: 'Lead', probability: 10, color: '#EF4444' },
        { name: 'Qualified', probability: 25, color: '#F97316' },
        { name: 'Proposal', probability: 50, color: '#EAB308' },
        { name: 'Negotiation', probability: 75, color: '#3B82F6' },
        { name: 'Closed Won', probability: 100, color: '#10B981', is_closed_won: true },
        { name: 'Closed Lost', probability: 0, color: '#6B7280', is_closed_lost: true }
      ]

      const stageInserts = defaultStages.map((stage, index) => ({
        pipeline_id: pipeline.id,
        name: stage.name,
        stage_order: index + 1,
        probability: stage.probability,
        color: stage.color,
        is_closed_won: stage.is_closed_won || false,
        is_closed_lost: stage.is_closed_lost || false
      }))

      const { error: stagesError } = await supabase
        .from('deal_stages')
        .insert(stageInserts)

      if (stagesError) {
        return { pipeline: null, error: stagesError.message }
      }

      return { pipeline, error: null }
    } catch (error) {
      return { pipeline: null, error: 'Failed to create default pipeline' }
    }
  }

  // ============================================================================
  // DEAL MANAGEMENT
  // ============================================================================

  /**
   * Get deals with filters and pagination
   */
  static async getDeals(
    organizationId: string,
    filters: DealFilters = {},
    page = 1,
    limit = 50
  ): Promise<{
    deals: Deal[]
    total: number
    error: string | null
  }> {
    try {
      let query = supabase
        .from('deals')
        .select(`
          *,
          pipeline:deal_pipelines(*),
          stage:deal_stages(*),
          contact:contacts(*),
          assigned_user:users(id, first_name, last_name, email)
        `, { count: 'exact' })
        .eq('organization_id', organizationId)

      // Apply filters
      if (filters.pipeline_id) {
        query = query.eq('pipeline_id', filters.pipeline_id)
      }
      if (filters.stage_id) {
        query = query.eq('stage_id', filters.stage_id)
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.value_min) {
        query = query.gte('value_cents', filters.value_min * 100)
      }
      if (filters.value_max) {
        query = query.lte('value_cents', filters.value_max * 100)
      }
      if (filters.expected_close_from) {
        query = query.gte('expected_close_date', filters.expected_close_from)
      }
      if (filters.expected_close_to) {
        query = query.lte('expected_close_date', filters.expected_close_to)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)
      query = query.order('created_at', { ascending: false })

      const { data: deals, error, count } = await query

      if (error) {
        return { deals: [], total: 0, error: error.message }
      }

      return { deals: deals || [], total: count || 0, error: null }
    } catch (error) {
      return { deals: [], total: 0, error: 'Failed to fetch deals' }
    }
  }

  /**
   * Get deals by pipeline for kanban view
   */
  static async getDealsByPipeline(
    organizationId: string,
    pipelineId: string
  ): Promise<{
    pipeline: DealPipeline | null
    dealsByStage: Record<string, Deal[]>
    error: string | null
  }> {
    try {
      // Get pipeline with stages
      const { data: pipeline, error: pipelineError } = await supabase
        .from('deal_pipelines')
        .select(`
          *,
          stages:deal_stages(*)
        `)
        .eq('id', pipelineId)
        .eq('organization_id', organizationId)
        .single()

      if (pipelineError) {
        return { pipeline: null, dealsByStage: {}, error: pipelineError.message }
      }

      // Get deals for this pipeline
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select(`
          *,
          stage:deal_stages(*),
          contact:contacts(*),
          assigned_user:users(id, first_name, last_name, email)
        `)
        .eq('organization_id', organizationId)
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: false })

      if (dealsError) {
        return { pipeline: null, dealsByStage: {}, error: dealsError.message }
      }

      // Group deals by stage
      const dealsByStage: Record<string, Deal[]> = {}
      pipeline.stages?.forEach(stage => {
        dealsByStage[stage.id] = []
      })

      deals?.forEach(deal => {
        if (dealsByStage[deal.stage_id]) {
          dealsByStage[deal.stage_id].push(deal)
        }
      })

      return { pipeline, dealsByStage, error: null }
    } catch (error) {
      return { pipeline: null, dealsByStage: {}, error: 'Failed to fetch pipeline deals' }
    }
  }

  /**
   * Create a new deal
   */
  static async createDeal(
    organizationId: string,
    dealData: CreateDealRequest,
    createdBy: string
  ): Promise<{
    deal: Deal | null
    error: string | null
  }> {
    try {
      // Get default pipeline and first stage if not specified
      let pipelineId = dealData.pipeline_id
      let stageId = dealData.stage_id

      if (!pipelineId) {
        const { data: defaultPipeline } = await supabase
          .from('deal_pipelines')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('is_default', true)
          .single()

        pipelineId = defaultPipeline?.id
      }

      if (!stageId && pipelineId) {
        const { data: firstStage } = await supabase
          .from('deal_stages')
          .select('id')
          .eq('pipeline_id', pipelineId)
          .order('stage_order', { ascending: true })
          .limit(1)
          .single()

        stageId = firstStage?.id
      }

      if (!pipelineId || !stageId) {
        return { deal: null, error: 'No pipeline or stage available' }
      }

      const { data: deal, error } = await supabase
        .from('deals')
        .insert({
          organization_id: organizationId,
          pipeline_id: pipelineId,
          stage_id: stageId,
          contact_id: dealData.contact_id,
          title: dealData.title,
          description: dealData.description,
          value_cents: dealData.value_cents || 0,
          currency: dealData.currency || 'USD',
          expected_close_date: dealData.expected_close_date,
          priority: dealData.priority || 'medium',
          lead_source: dealData.lead_source,
          custom_fields: dealData.custom_fields || {},
          tags: dealData.tags || []
        })
        .select(`
          *,
          pipeline:deal_pipelines(*),
          stage:deal_stages(*),
          contact:contacts(*)
        `)
        .single()

      if (error) {
        return { deal: null, error: error.message }
      }

      // Log activity
      await this.logActivity(deal.id, createdBy, 'created', 'Deal created', {
        deal_title: deal.title,
        deal_value: deal.value_cents
      })

      return { deal, error: null }
    } catch (error) {
      return { deal: null, error: 'Failed to create deal' }
    }
  }

  /**
   * Update a deal
   */
  static async updateDeal(
    dealId: string,
    dealData: UpdateDealRequest,
    updatedBy: string
  ): Promise<{
    deal: Deal | null
    error: string | null
  }> {
    try {
      // Get current deal for comparison
      const { data: currentDeal } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single()

      const { data: deal, error } = await supabase
        .from('deals')
        .update({
          ...dealData,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId)
        .select(`
          *,
          pipeline:deal_pipelines(*),
          stage:deal_stages(*),
          contact:contacts(*)
        `)
        .single()

      if (error) {
        return { deal: null, error: error.message }
      }

      // Log activities for significant changes
      if (currentDeal && dealData.stage_id && currentDeal.stage_id !== dealData.stage_id) {
        await this.logActivity(dealId, updatedBy, 'stage_changed', 'Stage changed', {
          old_stage_id: currentDeal.stage_id,
          new_stage_id: dealData.stage_id
        })
      }

      if (currentDeal && dealData.value_cents && currentDeal.value_cents !== dealData.value_cents) {
        await this.logActivity(dealId, updatedBy, 'value_changed', 'Deal value updated', {
          old_value: currentDeal.value_cents,
          new_value: dealData.value_cents
        })
      }

      return { deal, error: null }
    } catch (error) {
      return { deal: null, error: 'Failed to update deal' }
    }
  }

  // ============================================================================
  // ACTIVITY LOGGING
  // ============================================================================

  /**
   * Log deal activity
   */
  static async logActivity(
    dealId: string,
    userId: string,
    activityType: DealActivity['activity_type'],
    title: string,
    metadata: Record<string, any> = {},
    description?: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('deal_activities')
        .insert({
          deal_id: dealId,
          user_id: userId,
          activity_type: activityType,
          title,
          description,
          metadata
        })

      return { error: error?.message || null }
    } catch (error) {
      return { error: 'Failed to log activity' }
    }
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  /**
   * Get deal statistics for organization
   */
  static async getDealStats(organizationId: string): Promise<{
    stats: DealStats | null
    error: string | null
  }> {
    try {
      const { data: deals, error } = await supabase
        .from('deals')
        .select('status, value_cents, created_at, actual_close_date')
        .eq('organization_id', organizationId)

      if (error) {
        return { stats: null, error: error.message }
      }

      const totalDeals = deals?.length || 0
      const wonDeals = deals?.filter(d => d.status === 'won').length || 0
      const lostDeals = deals?.filter(d => d.status === 'lost').length || 0
      const openDeals = deals?.filter(d => d.status === 'open').length || 0

      const totalValue = deals?.reduce((sum, d) => sum + (d.value_cents || 0), 0) || 0
      const wonValue = deals?.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.value_cents || 0), 0) || 0
      const lostValue = deals?.filter(d => d.status === 'lost').reduce((sum, d) => sum + (d.value_cents || 0), 0) || 0
      const openValue = deals?.filter(d => d.status === 'open').reduce((sum, d) => sum + (d.value_cents || 0), 0) || 0

      const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0
      const winRate = (wonDeals + lostDeals) > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0

      // Calculate average sales cycle (simplified)
      const closedDeals = deals?.filter(d => d.actual_close_date && (d.status === 'won' || d.status === 'lost')) || []
      const averageSalesCycle = closedDeals.length > 0 
        ? closedDeals.reduce((sum, d) => {
            const created = new Date(d.created_at)
            const closed = new Date(d.actual_close_date!)
            return sum + Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          }, 0) / closedDeals.length
        : 0

      const stats: DealStats = {
        total_deals: totalDeals,
        total_value: totalValue,
        won_deals: wonDeals,
        won_value: wonValue,
        lost_deals: lostDeals,
        lost_value: lostValue,
        open_deals: openDeals,
        open_value: openValue,
        average_deal_size: averageDealSize,
        win_rate: winRate,
        average_sales_cycle: averageSalesCycle
      }

      return { stats, error: null }
    } catch (error) {
      return { stats: null, error: 'Failed to calculate deal stats' }
    }
  }
}
