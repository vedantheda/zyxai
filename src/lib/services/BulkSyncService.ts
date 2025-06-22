import { supabase } from '@/lib/supabase'
import { CRMIntegrationService } from './CRMIntegrationService'
import { HubSpotService } from './HubSpotService'

export interface BulkSyncJob {
  id: string
  organization_id: string
  job_type: 'contacts_to_crm' | 'calls_to_crm' | 'contacts_from_crm'
  crm_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  total_records: number
  processed_records: number
  successful_records: number
  failed_records: number
  error_details: any[]
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface BulkSyncProgress {
  jobId: string
  status: string
  progress: number
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  errors: any[]
  estimatedTimeRemaining?: number
}

export class BulkSyncService {
  // ===== JOB MANAGEMENT =====

  /**
   * Create a new bulk sync job
   */
  static async createBulkSyncJob(
    organizationId: string,
    jobType: BulkSyncJob['job_type'],
    crmType: string,
    totalRecords: number
  ): Promise<{ job: BulkSyncJob | null; error: string | null }> {
    try {
      const { data: job, error } = await supabase
        .from('bulk_sync_jobs')
        .insert({
          organization_id: organizationId,
          job_type: jobType,
          crm_type: crmType,
          status: 'pending',
          total_records: totalRecords,
          processed_records: 0,
          successful_records: 0,
          failed_records: 0,
          error_details: []
        })
        .select()
        .single()

      if (error) {
        return { job: null, error: error.message }
      }

      return { job, error: null }
    } catch (error) {
      return { job: null, error: 'Failed to create bulk sync job' }
    }
  }

  /**
   * Update bulk sync job progress
   */
  static async updateJobProgress(
    jobId: string,
    updates: Partial<BulkSyncJob>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('bulk_sync_jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to update job progress' }
    }
  }

  /**
   * Get bulk sync job status
   */
  static async getJobStatus(jobId: string): Promise<{
    job: BulkSyncJob | null
    error: string | null
  }> {
    try {
      const { data: job, error } = await supabase
        .from('bulk_sync_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        return { job: null, error: error.message }
      }

      return { job, error: null }
    } catch (error) {
      return { job: null, error: 'Failed to get job status' }
    }
  }

  /**
   * Get all bulk sync jobs for organization
   */
  static async getOrganizationJobs(
    organizationId: string,
    limit = 20
  ): Promise<{ jobs: BulkSyncJob[]; error: string | null }> {
    try {
      const { data: jobs, error } = await supabase
        .from('bulk_sync_jobs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        return { jobs: [], error: error.message }
      }

      return { jobs: jobs || [], error: null }
    } catch (error) {
      return { jobs: [], error: 'Failed to get organization jobs' }
    }
  }

  // ===== BULK SYNC OPERATIONS =====

  /**
   * Bulk sync contacts to CRM
   */
  static async bulkSyncContactsToCRM(
    organizationId: string,
    contactIds: string[],
    crmType: string = 'hubspot'
  ): Promise<{ jobId: string | null; error: string | null }> {
    try {
      // Create job
      const { job, error: jobError } = await this.createBulkSyncJob(
        organizationId,
        'contacts_to_crm',
        crmType,
        contactIds.length
      )

      if (jobError || !job) {
        return { jobId: null, error: jobError || 'Failed to create job' }
      }

      // Start processing in background
      this.processContactsBulkSync(job.id, organizationId, contactIds, crmType)

      return { jobId: job.id, error: null }
    } catch (error) {
      return { jobId: null, error: 'Failed to start bulk sync' }
    }
  }

  /**
   * Bulk sync calls to CRM
   */
  static async bulkSyncCallsToCRM(
    organizationId: string,
    callIds: string[],
    crmType: string = 'hubspot'
  ): Promise<{ jobId: string | null; error: string | null }> {
    try {
      // Create job
      const { job, error: jobError } = await this.createBulkSyncJob(
        organizationId,
        'calls_to_crm',
        crmType,
        callIds.length
      )

      if (jobError || !job) {
        return { jobId: null, error: jobError || 'Failed to create job' }
      }

      // Start processing in background
      this.processCallsBulkSync(job.id, organizationId, callIds, crmType)

      return { jobId: job.id, error: null }
    } catch (error) {
      return { jobId: null, error: 'Failed to start bulk sync' }
    }
  }

  /**
   * Process contacts bulk sync (background operation)
   */
  private static async processContactsBulkSync(
    jobId: string,
    organizationId: string,
    contactIds: string[],
    crmType: string
  ) {
    try {
      // Update job status to running
      await this.updateJobProgress(jobId, {
        status: 'running',
        started_at: new Date().toISOString()
      })

      let processedCount = 0
      let successCount = 0
      let failedCount = 0
      const errors: any[] = []

      // Process contacts in batches of 10
      const batchSize = 10
      for (let i = 0; i < contactIds.length; i += batchSize) {
        const batch = contactIds.slice(i, i + batchSize)
        
        // Process batch
        const batchPromises = batch.map(async (contactId) => {
          try {
            const result = await CRMIntegrationService.syncContactToCRM(
              organizationId,
              contactId,
              crmType
            )
            
            if (result.success) {
              successCount++
            } else {
              failedCount++
              errors.push({
                contactId,
                error: result.error
              })
            }
          } catch (error) {
            failedCount++
            errors.push({
              contactId,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
          
          processedCount++
        })

        await Promise.all(batchPromises)

        // Update progress
        await this.updateJobProgress(jobId, {
          processed_records: processedCount,
          successful_records: successCount,
          failed_records: failedCount,
          error_details: errors
        })

        // Small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Mark job as completed
      await this.updateJobProgress(jobId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      })

    } catch (error) {
      // Mark job as failed
      await this.updateJobProgress(jobId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_details: [{
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      })
    }
  }

  /**
   * Process calls bulk sync (background operation)
   */
  private static async processCallsBulkSync(
    jobId: string,
    organizationId: string,
    callIds: string[],
    crmType: string
  ) {
    try {
      // Update job status to running
      await this.updateJobProgress(jobId, {
        status: 'running',
        started_at: new Date().toISOString()
      })

      let processedCount = 0
      let successCount = 0
      let failedCount = 0
      const errors: any[] = []

      // Process calls in batches of 5 (calls are more complex)
      const batchSize = 5
      for (let i = 0; i < callIds.length; i += batchSize) {
        const batch = callIds.slice(i, i + batchSize)
        
        // Process batch
        const batchPromises = batch.map(async (callId) => {
          try {
            const result = await CRMIntegrationService.syncCallToCRM(
              organizationId,
              callId,
              crmType
            )
            
            if (result.success) {
              successCount++
            } else {
              failedCount++
              errors.push({
                callId,
                error: result.error
              })
            }
          } catch (error) {
            failedCount++
            errors.push({
              callId,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
          
          processedCount++
        })

        await Promise.all(batchPromises)

        // Update progress
        await this.updateJobProgress(jobId, {
          processed_records: processedCount,
          successful_records: successCount,
          failed_records: failedCount,
          error_details: errors
        })

        // Longer delay for calls to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Mark job as completed
      await this.updateJobProgress(jobId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      })

    } catch (error) {
      // Mark job as failed
      await this.updateJobProgress(jobId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_details: [{
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      })
    }
  }

  /**
   * Cancel bulk sync job
   */
  static async cancelJob(jobId: string): Promise<{
    success: boolean
    error: string | null
  }> {
    try {
      const { error } = await supabase
        .from('bulk_sync_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'pending') // Only cancel pending jobs

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to cancel job' }
    }
  }

  /**
   * Get real-time progress for a job
   */
  static async getJobProgress(jobId: string): Promise<{
    progress: BulkSyncProgress | null
    error: string | null
  }> {
    try {
      const { job, error } = await this.getJobStatus(jobId)
      
      if (error || !job) {
        return { progress: null, error: error || 'Job not found' }
      }

      const progressPercentage = job.total_records > 0 
        ? Math.round((job.processed_records / job.total_records) * 100)
        : 0

      // Estimate time remaining
      let estimatedTimeRemaining: number | undefined
      if (job.status === 'running' && job.started_at && job.processed_records > 0) {
        const startTime = new Date(job.started_at).getTime()
        const currentTime = new Date().getTime()
        const elapsedTime = currentTime - startTime
        const avgTimePerRecord = elapsedTime / job.processed_records
        const remainingRecords = job.total_records - job.processed_records
        estimatedTimeRemaining = Math.round((avgTimePerRecord * remainingRecords) / 1000) // in seconds
      }

      const progress: BulkSyncProgress = {
        jobId: job.id,
        status: job.status,
        progress: progressPercentage,
        totalRecords: job.total_records,
        processedRecords: job.processed_records,
        successfulRecords: job.successful_records,
        failedRecords: job.failed_records,
        errors: job.error_details || [],
        estimatedTimeRemaining
      }

      return { progress, error: null }
    } catch (error) {
      return { progress: null, error: 'Failed to get job progress' }
    }
  }
}

export default BulkSyncService
