import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        agents:agent_id (
          id,
          name,
          agent_type,
          vapi_assistant_id
        )
      `)
      .eq('id', campaignId)
      .eq('organization_id', organizationId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      campaign
    })

  } catch (error: any) {
    console.error('Failed to get campaign:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get campaign'
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const body = await request.json()
    const { status, organizationId, ...updateData } = body

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    // Update campaign
    const { data: campaign, error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update campaign: ' + updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign
    })

  } catch (error: any) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update campaign'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    // Delete campaign
    const { error: deleteError } = await supabaseAdmin
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete campaign: ' + deleteError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })

  } catch (error: any) {
    console.error('Failed to delete campaign:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete campaign'
    }, { status: 500 })
  }
}
