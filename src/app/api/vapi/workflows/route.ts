import { NextRequest, NextResponse } from 'next/server'
import { VapiService } from '@/lib/services/VapiService'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching VAPI workflows...')
    
    const { workflows, error } = await VapiService.getWorkflows()
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    return NextResponse.json({
      success: true,
      workflows: workflows,
      count: workflows.length
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error fetching workflows:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch workflows',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Creating VAPI workflow...')
    
    const workflowData = await request.json()
    
    // Validate required fields
    if (!workflowData.name) {
      return NextResponse.json({
        success: false,
        error: 'Workflow name is required'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
      return NextResponse.json({
        success: false,
        error: 'Workflow nodes are required'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const { workflow, error } = await VapiService.createWorkflow(workflowData)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log(`✅ Workflow created: ${workflow.id}`)
    
    return NextResponse.json({
      success: true,
      workflow: workflow,
      message: 'Workflow created successfully'
    }, { 
      status: 201,
      headers: corsHeaders 
    })

  } catch (error: any) {
    console.error('❌ Error creating workflow:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create workflow',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('📝 Updating VAPI workflow...')
    
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('id')
    
    if (!workflowId) {
      return NextResponse.json({
        success: false,
        error: 'Workflow ID is required'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const updateData = await request.json()
    
    const { success, error } = await VapiService.updateWorkflow(workflowId, updateData)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log(`✅ Workflow updated: ${workflowId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Workflow updated successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error updating workflow:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update workflow',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting VAPI workflow...')
    
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('id')
    
    if (!workflowId) {
      return NextResponse.json({
        success: false,
        error: 'Workflow ID is required'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const { success, error } = await VapiService.deleteWorkflow(workflowId)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log(`✅ Workflow deleted: ${workflowId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error deleting workflow:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete workflow',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
