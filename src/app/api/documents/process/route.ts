import { NextRequest, NextResponse } from 'next/server'
import { DocumentProcessor } from '@/lib/ai-processing/DocumentProcessor'
import { withApiSecurity, handleApiError, validateRequired } from '@/lib/apiSecurity'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
// Create Supabase client for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const { request: secureRequest, headers } = await withApiSecurity(request, {
      requireAuth: true,
      allowedMethods: ['POST'],
      rateLimit: 'api'
    })
    const body = await secureRequest.json()
    const { documentId, clientId, options = {} } = body
    // Validate required fields
    validateRequired(body, ['documentId'])
    // Get document details with user ownership check
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', secureRequest.user!.id)
      .single()
    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404, headers }
      )
    }
    // Check if document is already being processed
    if (document.processing_status === 'processing') {
      return NextResponse.json(
        { error: 'Document is already being processed' },
        { status: 409, headers }
      )
    }
    // Download document file from storage
    const urlParts = document.file_url.split('/storage/v1/object/public/documents/')
    const storagePath = urlParts[1]
    if (!storagePath) {
      return NextResponse.json(
        { error: 'Invalid document file URL' },
        { status: 400 }
      )
    }
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .download(storagePath)
    if (fileError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to download document file' },
        { status: 500 }
      )
    }
    // Convert file to buffer
    const fileBuffer = Buffer.from(await fileData.arrayBuffer())
    // Initialize document processor
    const processor = new DocumentProcessor()
    // Process document asynchronously
    const processingPromise = processor.processDocument(
      documentId,
      fileBuffer,
      document.type,
      {
        clientId: clientId || document.client_id,
        priority: options.priority || 'normal',
        skipOCR: options.skipOCR || false,
        skipAnalysis: options.skipAnalysis || false,
        skipAutoFill: options.skipAutoFill || false
      }
    )
    // Don't wait for processing to complete - return immediately
    // Processing will continue in the background
    processingPromise.catch(error => {
      })
    return NextResponse.json({
      success: true,
      message: 'Document processing started',
      documentId,
      status: 'processing'
    }, { headers })
  } catch (error) {
    return handleApiError(error)
  }
}
export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const { request: secureRequest, headers } = await withApiSecurity(request, {
      requireAuth: true,
      allowedMethods: ['GET'],
      rateLimit: 'api'
    })
    const { searchParams } = new URL(secureRequest.url)
    const documentId = searchParams.get('documentId')
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400, headers }
      )
    }
    // Verify user owns the document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('user_id', secureRequest.user!.id)
      .single()
    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404, headers }
      )
    }
    // Get processing status
    const processor = new DocumentProcessor()
    const status = await processor.getProcessingStatus(documentId)
    return NextResponse.json(status, { headers })
  } catch (error) {
    return handleApiError(error)
  }
}
