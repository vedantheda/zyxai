import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('document_processing_results')
      .select(`
        id,
        file_name,
        form_type,
        extracted_fields,
        overall_confidence,
        processing_status,
        created_at,
        updated_at
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    // Filter by status if provided
    if (status) {
      query = query.eq('processing_status', status)
    }

    const { data: results, error } = await query

    if (error) {
      console.error('Error fetching processed documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({ 
      results: results || [],
      total: results?.length || 0
    })

  } catch (error) {
    console.error('Error in documents/processed GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
