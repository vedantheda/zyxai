import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { FileSharingService } from '@/lib/storage/FileSharingService'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }
    // Validate share link
    const sharingService = new FileSharingService('system')
    const validation = await sharingService.validateShareLink(token)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 403 }
      )
    }
    // Get share info to check view permission
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select('*')
      .eq('token', token)
      .single()
    if (shareError || !share) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      )
    }
    // Check view permission
    const canView = share.permissions.some((p: any) => p.action === 'view' && p.granted)
    if (!canView) {
      return NextResponse.json(
        { error: 'View permission denied' },
        { status: 403 }
      )
    }
    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', share.document_id)
      .single()
    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    // Extract storage path from URL
    const urlParts = document.file_url.split('/storage/v1/object/public/documents/')
    const storagePath = urlParts[1]
    if (!storagePath) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 404 }
      )
    }
    // Download file from storage
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
      .from('document_shares')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('token', token)
    // Return file for inline viewing
    const response = new NextResponse(fileData)
    response.headers.set('Content-Type', document.type || 'application/octet-stream')
    response.headers.set('Content-Disposition', `inline; filename="${document.name}"`)
    response.headers.set('Content-Length', document.size.toString())
    // Add security headers
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
