import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      fileName, 
      formType, 
      extractedFields, 
      overallConfidence, 
      processingTime,
      reviewRequired,
      metadata 
    } = body

    if (!fileName || !formType || !extractedFields) {
      return NextResponse.json({ 
        error: 'Missing required fields: fileName, formType, extractedFields' 
      }, { status: 400 })
    }

    // Save processing result to database
    const { data: result, error: insertError } = await supabase
      .from('document_processing_results')
      .insert({
        user_id: session.user.id,
        file_name: fileName,
        form_type: formType,
        extracted_fields: extractedFields,
        overall_confidence: overallConfidence || 0,
        processing_status: reviewRequired ? 'review_required' : 'completed',
        processing_time: processingTime || 0,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving processing result:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save processing result' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      result 
    })

  } catch (error) {
    console.error('Save processing result error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
