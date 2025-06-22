import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { TaxFormAutoFillService } from '@/lib/tax-forms/TaxFormAutoFill'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { documentIds, clientId } = body

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 })
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Get processed documents from database
    const { data: documents, error: docError } = await supabase
      .from('document_processing_results')
      .select(`
        id,
        file_name,
        form_type,
        extracted_fields,
        overall_confidence,
        processing_status
      `)
      .in('id', documentIds)
      .eq('user_id', session.user.id)
      .eq('processing_status', 'completed')

    if (docError) {
      console.error('Error fetching documents:', docError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No completed documents found' }, { status: 404 })
    }

    // Transform documents for auto-fill service
    const extractedDocuments = documents.map(doc => ({
      documentId: doc.id,
      formType: doc.form_type,
      extractedFields: doc.extracted_fields || []
    }))

    // Initialize auto-fill service
    const autoFillService = new TaxFormAutoFillService()

    // Perform auto-fill
    const autoFilledForms = await autoFillService.autoFillTaxForms(
      session.user.id,
      clientId,
      extractedDocuments,
      new Date().getFullYear()
    )

    return NextResponse.json({
      success: true,
      formsCreated: autoFilledForms.length,
      forms: autoFilledForms
    })

  } catch (error) {
    console.error('Auto-fill error:', error)
    return NextResponse.json(
      { error: 'Internal server error during auto-fill' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    // Get auto-filled forms for the user
    const query = supabase
      .from('auto_filled_tax_forms')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (clientId) {
      query.eq('client_id', clientId)
    }

    const { data: forms, error } = await query

    if (error) {
      console.error('Error fetching auto-filled forms:', error)
      return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
    }

    return NextResponse.json({ forms: forms || [] })

  } catch (error) {
    console.error('Error in auto-fill GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
