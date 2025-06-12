import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { FileSharingService } from '@/lib/storage/FileSharingService'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Create a temporary sharing service instance for validation
    const sharingService = new FileSharingService('system')
    
    const validation = await sharingService.validateShareLink(token, password)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === 'Password required' ? 401 : 403 }
      )
    }

    // Get share info
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

    return NextResponse.json({
      document: {
        id: validation.document.id,
        name: validation.document.name,
        type: validation.document.type,
        size: validation.document.size,
        canView: share.permissions.some((p: any) => p.action === 'view' && p.granted),
        canDownload: share.permissions.some((p: any) => p.action === 'download' && p.granted)
      },
      shareInfo: {
        expiresAt: share.expires_at,
        maxDownloads: share.max_downloads,
        downloadCount: share.download_count,
        isPasswordProtected: share.is_password_protected,
        requireAuth: share.require_auth
      }
    })

  } catch (error) {
    console.error('Share validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
