import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { DocumentProcessor } from '@/lib/ai-processing/DocumentProcessor'
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const { documentIds, clientId, options = {} } = await request.json()
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Document IDs array is required' },
        { status: 400 }
      )
    }
    if (documentIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 documents can be processed in a batch' },
        { status: 400 }
      )
    }
    // Get all documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds)
      .eq('user_id', user.id)
    if (docsError || !documents) {
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }
    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        { error: 'Some documents not found or not accessible' },
        { status: 404 }
      )
    }
    // Check if any documents are already being processed
    const processingDocs = documents.filter(doc => doc.processing_status === 'processing')
    if (processingDocs.length > 0) {
      return NextResponse.json(
        {
          error: 'Some documents are already being processed',
          processingDocuments: processingDocs.map(doc => doc.id)
        },
        { status: 409 }
      )
    }
    // Prepare documents for batch processing
    const documentsToProcess = []
    for (const document of documents) {
      // Download document file
      const urlParts = document.file_url.split('/storage/v1/object/public/documents/')
      const storagePath = urlParts[1]
      if (!storagePath) {
        continue
      }
      const { data: fileData, error: fileError } = await supabase.storage
        .from('documents')
        .download(storagePath)
      if (fileError || !fileData) {
        continue
      }
      const fileBuffer = Buffer.from(await fileData.arrayBuffer())
      documentsToProcess.push({
        documentId: document.id,
        fileBuffer,
        mimeType: document.type,
        clientId: clientId || document.client_id
      })
    }
    if (documentsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'No documents could be prepared for processing' },
        { status: 400 }
      )
    }
    // Initialize document processor
    const processor = new DocumentProcessor()
    // Start batch processing asynchronously
    const batchProcessingPromise = processor.processBatch(documentsToProcess, {
      priority: options.priority || 'normal',
      skipOCR: options.skipOCR || false,
      skipAnalysis: options.skipAnalysis || false,
      skipAutoFill: options.skipAutoFill || false
    })
    // Don't wait for processing to complete - return immediately
    batchProcessingPromise
      .then(results => {
        console.log(`Batch processing completed for ${results.length} documents`)
        // Could send notification here
      })
      .catch(error => {
        })
    return NextResponse.json({
      success: true,
      message: 'Batch processing started',
      documentIds: documentsToProcess.map(doc => doc.documentId),
      totalDocuments: documentsToProcess.length,
      status: 'processing'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
