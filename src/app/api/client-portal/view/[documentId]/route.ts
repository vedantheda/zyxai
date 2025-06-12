import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      )
    }

    // Validate access token
    const { data: portalAccess, error: accessError } = await supabase
      .from('client_portal_access')
      .select('*')
      .eq('access_token', token)
      .single()

    if (accessError || !portalAccess) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      )
    }

    // Check if token is expired
    if (new Date(portalAccess.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Access token has expired' },
        { status: 401 }
      )
    }

    // Check view permission
    if (!portalAccess.permissions.includes('view')) {
      return NextResponse.json(
        { error: 'View permission denied' },
        { status: 403 }
      )
    }

    // Get document and verify access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('client_id', portalAccess.client_id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Check if document is in allowed list
    if (portalAccess.allowed_documents &&
        portalAccess.allowed_documents.length > 0 &&
        !portalAccess.allowed_documents.includes(documentId)) {
      return NextResponse.json(
        { error: 'Document access not permitted' },
        { status: 403 }
      )
    }

    // Extract the storage path from the URL
    const urlParts = document.file_url.split('/storage/v1/object/public/documents/')
    const storagePath = urlParts[1]

    if (!storagePath) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 404 }
      )
    }

    // Get file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .download(storagePath)

    if (fileError || !fileData) {
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 }
      )
    }

    // Update last accessed time
    await supabase
      .from('client_portal_access')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', portalAccess.id)

    // Return file for inline viewing
    const response = new NextResponse(fileData)
    response.headers.set('Content-Type', document.type || 'application/octet-stream')
    response.headers.set('Content-Disposition', `inline; filename="${document.name}"`)
    response.headers.set('Content-Length', document.size.toString())

    // Add security headers for viewing
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response

  } catch (error) {
    console.error('Portal view error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
