import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PDFFormFillerService } from '@/lib/tax-forms/PDFFormFiller'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { formId, formType = '1040' } = body

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    // Get the auto-filled form from database
    const { data: form, error: formError } = await supabase
      .from('auto_filled_tax_forms')
      .select('*')
      .eq('id', formId)
      .eq('user_id', session.user.id)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Initialize PDF form filler service
    const pdfService = new PDFFormFillerService()

    // Download the blank IRS form
    const blankFormBuffer = await pdfService.downloadIRSForm(formType as any, form.tax_year)

    // Convert form fields to extracted data format
    const extractedData = Object.entries(form.fields).map(([fieldName, fieldData]: [string, any]) => ({
      fieldName,
      value: fieldData.value,
      confidence: fieldData.confidence,
      needsReview: fieldData.needsReview
    }))

    // Fill the PDF form
    const filledPdfBuffer = await pdfService.fillPDFForm(
      blankFormBuffer,
      extractedData,
      formType as any
    )

    // Return the filled PDF
    return new NextResponse(filledPdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Form_${formType}_${form.tax_year}_filled.pdf"`,
        'Content-Length': filledPdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

// GET endpoint to preview form data
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 })
    }

    // Get the auto-filled form from database
    const { data: form, error: formError } = await supabase
      .from('auto_filled_tax_forms')
      .select('*')
      .eq('id', formId)
      .eq('user_id', session.user.id)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ form })

  } catch (error) {
    console.error('Form preview error:', error)
    return NextResponse.json(
      { error: 'Failed to get form data' },
      { status: 500 }
    )
  }
}
