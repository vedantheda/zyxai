import { NextRequest, NextResponse } from 'next/server'
import WorkflowEngine from '@/lib/services/WorkflowEngine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    console.log(`📋 Fetching workflows for organization: ${organizationId}`)

    const { workflows, error } = await WorkflowEngine.listWorkflows(organizationId)

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch workflows: ${error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workflows,
      count: workflows.length
    })

  } catch (error: any) {
    console.error('❌ Failed to fetch workflows:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch workflows',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const workflowData = await request.json()

    if (!workflowData.organization_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔧 Creating workflow: ${workflowData.name}`)

    const { workflow, error } = await WorkflowEngine.createWorkflow(
      workflowData.organization_id,
      workflowData
    )

    if (error) {
      return NextResponse.json(
        { error: `Failed to create workflow: ${error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow created successfully'
    })

  } catch (error: any) {
    console.error('❌ Failed to create workflow:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create workflow',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
