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
    const category = searchParams.get('category')

    // Build query
    let query = supabase
      .from('documents')
      .select(`
        id,
        name,
        type,
        size,
        category,
        status,
        processing_status,
        file_url,
        ai_analysis_result,
        created_at,
        updated_at
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    // Filter by status if provided
    if (status) {
      query = query.eq('processing_status', status)
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({ 
      documents: documents || [],
      total: documents?.length || 0
    })

  } catch (error) {
    console.error('Error in documents/list GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
