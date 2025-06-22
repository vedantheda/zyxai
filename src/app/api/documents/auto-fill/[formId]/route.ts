import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PATCH(
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
    const { fields, status } = body

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    // Verify user owns the form
    const { data: existingForm, error: formError } = await supabase
      .from('auto_filled_tax_forms')
      .select('id')
      .eq('id', formId)
      .eq('user_id', session.user.id)
      .single()

    if (formError || !existingForm) {
      return NextResponse.json({ error: 'Form not found or access denied' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (fields) {
      updateData.fields = fields
      
      // Recalculate confidence and review status
      const fieldValues = Object.values(fields) as any[]
      const overallConfidence = fieldValues.length > 0 
        ? fieldValues.reduce((sum: number, field: any) => sum + (field.confidence || 0), 0) / fieldValues.length
        : 0
      const needsReview = fieldValues.some((field: any) => field.needsReview)
      
      updateData.overall_confidence = overallConfidence
      updateData.needs_review = needsReview
    }

    if (status) {
      updateData.status = status
    }

    // Update the form
    const { data: updatedForm, error: updateError } = await supabase
      .from('auto_filled_tax_forms')
      .update(updateData)
      .eq('id', formId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating form:', updateError)
      return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      form: updatedForm
    })

  } catch (error) {
    console.error('Form update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    // Delete the form (RLS will ensure user can only delete their own forms)
    const { error: deleteError } = await supabase
      .from('auto_filled_tax_forms')
      .delete()
      .eq('id', formId)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('Error deleting form:', deleteError)
      return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Form deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
