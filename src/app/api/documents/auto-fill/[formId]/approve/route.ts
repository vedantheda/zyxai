import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { formId } = params

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    // Update form status to approved
    const { data: updatedForm, error: updateError } = await supabase
      .from('auto_filled_tax_forms')
      .update({
        status: 'approved',
        needs_review: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error approving form:', updateError)
      return NextResponse.json({ error: 'Failed to approve form' }, { status: 500 })
    }

    if (!updatedForm) {
      return NextResponse.json({ error: 'Form not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      form: updatedForm,
      message: 'Form approved successfully'
    })

  } catch (error) {
    console.error('Form approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Reject form endpoint
export async function DELETE(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { formId } = params
    const body = await request.json()
    const { reason } = body

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    // Update form status to rejected
    const { data: updatedForm, error: updateError } = await supabase
      .from('auto_filled_tax_forms')
      .update({
        status: 'draft', // Reset to draft for re-processing
        needs_review: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error rejecting form:', updateError)
      return NextResponse.json({ error: 'Failed to reject form' }, { status: 500 })
    }

    if (!updatedForm) {
      return NextResponse.json({ error: 'Form not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      form: updatedForm,
      message: `Form rejected: ${reason || 'No reason provided'}`
    })

  } catch (error) {
    console.error('Form rejection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
