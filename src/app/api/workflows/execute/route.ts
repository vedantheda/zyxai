import { NextRequest, NextResponse } from 'next/server'
import WorkflowEngine from '@/lib/services/WorkflowEngine'

export async function POST(request: NextRequest) {
  try {
    const { workflowId, triggerData } = await request.json()

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    console.log(`🚀 Executing workflow: ${workflowId}`)

    const { execution, error } = await WorkflowEngine.executeWorkflow(
      workflowId,
      triggerData || {}
    )

    if (error) {
      return NextResponse.json(
        { error: `Failed to execute workflow: ${error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      execution,
      message: 'Workflow execution started'
    })

  } catch (error: any) {
    console.error('❌ Failed to execute workflow:', error)
    return NextResponse.json(
      { 
        error: 'Failed to execute workflow',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
