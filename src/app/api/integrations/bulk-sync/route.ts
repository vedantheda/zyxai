import { NextRequest, NextResponse } from 'next/server'
import { BulkSyncService } from '@/lib/services/BulkSyncService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, type, entityIds, crmType = 'hubspot' } = body

    if (!organizationId || !type || !entityIds || !Array.isArray(entityIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, type, entityIds' },
        { status: 400 }
      )
    }

    let result
    if (type === 'contacts') {
      result = await BulkSyncService.bulkSyncContactsToCRM(
        organizationId,
        entityIds,
        crmType
      )
    } else if (type === 'calls') {
      result = await BulkSyncService.bulkSyncCallsToCRM(
        organizationId,
        entityIds,
        crmType
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid sync type. Must be "contacts" or "calls"' },
        { status: 400 }
      )
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ jobId: result.jobId })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start bulk sync' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const jobId = searchParams.get('jobId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    if (jobId) {
      // Get specific job progress
      const { progress, error } = await BulkSyncService.getJobProgress(jobId)
      
      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({ progress })
    } else {
      // Get all jobs for organization
      const { jobs, error } = await BulkSyncService.getOrganizationJobs(organizationId)
      
      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({ jobs })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bulk sync data' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const { success, error } = await BulkSyncService.cancelJob(jobId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to cancel bulk sync job' },
      { status: 500 }
    )
  }
}
