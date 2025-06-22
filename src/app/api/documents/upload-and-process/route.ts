import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleDocumentAIService, TaxFormType } from '@/lib/document-processing/GoogleDocumentAI'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 401 })
    }

    if (!session) {
      console.error('No session found')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    console.log('User authenticated:', session.user.id)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const expectedFormType = formData.get('expectedFormType') as TaxFormType
    const clientId = formData.get('clientId') as string || 'default-client'

    console.log('Form data received:', {
      fileName: file?.name,
      fileSize: file?.size,
      expectedFormType,
      clientId
    })

    if (!file) {
      console.error('No file provided in form data')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and images are allowed.' }, { status: 400 })
    }

    // Step 1: Upload file to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${session.user.id}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Step 2: Create document record in database
    const { data: documentRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: session.user.id,
        client_id: clientId,
        name: file.name,
        type: file.type,
        size: file.size,
        category: 'tax_document',
        status: 'processing',
        processing_status: 'processing',
        file_url: publicUrl,
        processing_started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (docError) {
      console.error('Document record creation error:', docError)
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([filePath])
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    // Step 3: Process document with AI
    let processingResult
    try {
      const documentAI = new GoogleDocumentAIService()
      processingResult = await documentAI.processDocument(fileBuffer, file.name, expectedFormType)
    } catch (processingError) {
      console.error('Document processing error:', processingError)

      // Update document status to error
      await supabase
        .from('documents')
        .update({
          status: 'error',
          processing_status: 'failed',
          processing_error: processingError.message,
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', documentRecord.id)

      return NextResponse.json({
        error: 'Document processing failed',
        details: processingError.message,
        documentId: documentRecord.id
      }, { status: 500 })
    }

    // Step 4: Update document with processing results
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'processed',
        processing_status: 'completed',
        ai_analysis_result: processingResult,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', documentRecord.id)

    if (updateError) {
      console.error('Document update error:', updateError)
    }

    // Step 5: Save processing results to processing results table
    const { data: processingRecord, error: processingError } = await supabase
      .from('document_processing_results')
      .insert({
        document_id: documentRecord.id,
        user_id: session.user.id,
        processing_stage: 'complete',
        status: 'completed',
        result_data: processingResult,
        confidence: processingResult.overallConfidence,
        processing_time: processingResult.processingTime,
        file_name: file.name,
        form_type: processingResult.formType,
        extracted_fields: processingResult.extractedFields,
        overall_confidence: processingResult.overallConfidence,
        processing_status: processingResult.reviewRequired ? 'review_required' : 'completed',
        metadata: processingResult.metadata
      })
      .select()
      .single()

    if (processingError) {
      console.error('Processing record creation error:', processingError)
    }

    // Return success response
    return NextResponse.json({
      success: true,
      document: documentRecord,
      processingResult: {
        ...processingResult,
        metadata: {
          ...processingResult.metadata,
          processingDate: processingResult.metadata.processingDate.toISOString()
        }
      },
      processingRecord
    })

  } catch (error) {
    console.error('Upload and process error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
