import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        authError: authError?.message,
        hasSession: !!session 
      }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Try to upload file to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = `test_${Date.now()}_${file.name}`
    const filePath = `${session.user.id}/${fileName}`

    console.log('Attempting to upload file:', {
      fileName,
      filePath,
      fileSize: file.size,
      userId: session.user.id
    })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: uploadError.message,
        uploadError 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      uploadData,
      publicUrl,
      filePath,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
