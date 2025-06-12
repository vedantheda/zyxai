import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Validate access token
    const { data: portalAccess, error: accessError } = await supabase
      .from('client_portal_access')
      .select(`
        *,
        clients (
          id,
          name,
          email
        )
      `)
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

    // Update last accessed time
    await supabase
      .from('client_portal_access')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', portalAccess.id)

    // Get client documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', portalAccess.client_id)
      .in('id', portalAccess.allowed_documents || [])
      .order('created_at', { ascending: false })

    if (docsError) {
      console.error('Error fetching documents:', docsError)
    }

    // Get document requirements/checklist
    const { data: requirements, error: reqError } = await supabase
      .from('document_checklists')
      .select('*')
      .eq('client_id', portalAccess.client_id)
      .order('priority', { ascending: false })

    if (reqError) {
      console.error('Error fetching requirements:', reqError)
    }

    // Transform documents for portal
    const portalDocuments = (documents || []).map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      category: doc.category,
      uploadedAt: doc.created_at,
      status: doc.status,
      downloadUrl: doc.file_url,
      canDownload: portalAccess.permissions.includes('download'),
      canView: portalAccess.permissions.includes('view')
    }))

    // Transform requirements for portal
    const portalRequirements = (requirements || []).map(req => ({
      id: req.id,
      type: req.document_type,
      description: req.description || `Please upload your ${req.document_type}`,
      isRequired: req.is_required,
      isCompleted: req.is_completed,
      dueDate: req.due_date,
      priority: req.priority
    }))

    return NextResponse.json({
      portal: {
        clientId: portalAccess.client_id,
        clientName: portalAccess.clients?.name,
        expiresAt: portalAccess.expires_at,
        permissions: portalAccess.permissions
      },
      documents: portalDocuments,
      requirements: portalRequirements
    })

  } catch (error) {
    console.error('Portal API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File
    const requirementId = formData.get('requirementId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
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

    // Check if upload permission exists
    if (!portalAccess.permissions.includes('upload')) {
      return NextResponse.json(
        { error: 'Upload permission denied' },
        { status: 403 }
      )
    }

    // Check if token is expired
    if (new Date(portalAccess.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Access token has expired' },
        { status: 401 }
      )
    }

    // Generate file path
    const fileExt = file.name.split('.').pop()
    const fileName = `client-portal/${portalAccess.client_id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // Create document record
    const documentData = {
      user_id: portalAccess.created_by,
      client_id: portalAccess.client_id,
      name: file.name,
      type: file.type,
      size: file.size,
      category: 'client_upload',
      status: 'pending',
      ai_analysis_status: 'pending',
      processing_status: 'pending',
      file_url: urlData.publicUrl,
      metadata: {
        uploadedViaPortal: true,
        portalToken: token,
        requirementId: requirementId || null
      }
    }

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('documents').remove([fileName])
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Update requirement if specified
    if (requirementId) {
      await supabase
        .from('document_checklists')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          document_id: document.id
        })
        .eq('id', requirementId)
        .eq('client_id', portalAccess.client_id)
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        size: document.size,
        uploadedAt: document.created_at
      }
    })

  } catch (error) {
    console.error('Portal upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
