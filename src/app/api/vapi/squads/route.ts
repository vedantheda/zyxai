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
    console.log('👥 Fetching VAPI squads...')
    
    const { squads, error } = await VapiService.getSquads()
    
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
      squads: squads,
      count: squads.length
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error fetching squads:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch squads',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤝 Creating VAPI squad...')
    
    const squadData = await request.json()
    
    // Validate required fields
    if (!squadData.members || !Array.isArray(squadData.members)) {
      return NextResponse.json({
        success: false,
        error: 'Squad members are required'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    if (squadData.members.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one squad member is required'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const { squad, error } = await VapiService.createSquad(squadData)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log(`✅ Squad created: ${squad.id}`)
    
    return NextResponse.json({
      success: true,
      squad: squad,
      message: 'Squad created successfully'
    }, { 
      status: 201,
      headers: corsHeaders 
    })

  } catch (error: any) {
    console.error('❌ Error creating squad:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create squad',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('📝 Updating VAPI squad...')
    
    const { searchParams } = new URL(request.url)
    const squadId = searchParams.get('id')
    
    if (!squadId) {
      return NextResponse.json({
        success: false,
        error: 'Squad ID is required'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const updateData = await request.json()
    
    const { success, error } = await VapiService.updateSquad(squadId, updateData)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log(`✅ Squad updated: ${squadId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Squad updated successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error updating squad:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update squad',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting VAPI squad...')
    
    const { searchParams } = new URL(request.url)
    const squadId = searchParams.get('id')
    
    if (!squadId) {
      return NextResponse.json({
        success: false,
        error: 'Squad ID is required'
      }, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const { success, error } = await VapiService.deleteSquad(squadId)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error
      }, { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log(`✅ Squad deleted: ${squadId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Squad deleted successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error deleting squad:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete squad',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
