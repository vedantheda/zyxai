import { NextRequest, NextResponse } from 'next/server'
import { GoogleDocumentAIService, TaxFormType } from '@/lib/document-processing/GoogleDocumentAI'

// Mock data generator for testing without billing
function generateMockData(formType: string, fileName: string) {
  const baseData = {
    formType: formType as TaxFormType,
    overallConfidence: 0.85 + Math.random() * 0.1, // 85-95%
    reviewRequired: Math.random() > 0.7, // 30% chance of review
    processingTime: 1200 + Math.random() * 800, // 1.2-2.0 seconds
    metadata: {
      fileName,
      fileSize: Math.floor(Math.random() * 2000000) + 500000, // 0.5-2.5MB
      processingDate: new Date().toISOString(),
      documentType: formType,
      pageCount: 1
    }
  }

  // Generate form-specific mock fields
  switch (formType) {
    case 'W-2':
      return {
        ...baseData,
        extractedFields: [
          {
            fieldName: 'employee_name',
            value: 'John A. Smith',
            confidence: 0.96,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 120, y: 180, width: 180, height: 18 }
          },
          {
            fieldName: 'employee_ssn',
            value: '123-45-6789',
            confidence: 0.94,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 350, y: 180, width: 120, height: 18 }
          },
          {
            fieldName: 'employer_name',
            value: 'Acme Corporation',
            confidence: 0.98,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 120, y: 220, width: 200, height: 18 }
          },
          {
            fieldName: 'employer_ein',
            value: '12-3456789',
            confidence: 0.92,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 350, y: 220, width: 120, height: 18 }
          },
          {
            fieldName: 'wages',
            value: '$65,432.50',
            confidence: 0.89,
            needsReview: true,
            validationErrors: ['Amount seems unusually high for this field'],
            boundingBox: { x: 120, y: 300, width: 100, height: 18 }
          },
          {
            fieldName: 'federal_tax_withheld',
            value: '$9,814.88',
            confidence: 0.87,
            needsReview: true,
            validationErrors: [],
            boundingBox: { x: 250, y: 300, width: 100, height: 18 }
          },
          {
            fieldName: 'social_security_wages',
            value: '$65,432.50',
            confidence: 0.91,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 120, y: 340, width: 100, height: 18 }
          },
          {
            fieldName: 'social_security_tax',
            value: '$4,056.82',
            confidence: 0.88,
            needsReview: true,
            validationErrors: [],
            boundingBox: { x: 250, y: 340, width: 100, height: 18 }
          }
        ]
      }

    case '1099-INT':
      return {
        ...baseData,
        extractedFields: [
          {
            fieldName: 'payer_name',
            value: 'First National Bank',
            confidence: 0.97,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 120, y: 180, width: 200, height: 18 }
          },
          {
            fieldName: 'recipient_name',
            value: 'Jane M. Doe',
            confidence: 0.95,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 120, y: 220, width: 150, height: 18 }
          },
          {
            fieldName: 'recipient_tin',
            value: '987-65-4321',
            confidence: 0.93,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 300, y: 220, width: 120, height: 18 }
          },
          {
            fieldName: 'interest_income',
            value: '$1,247.83',
            confidence: 0.86,
            needsReview: true,
            validationErrors: [],
            boundingBox: { x: 120, y: 300, width: 100, height: 18 }
          },
          {
            fieldName: 'federal_tax_withheld',
            value: '$124.78',
            confidence: 0.84,
            needsReview: true,
            validationErrors: ['Low confidence on handwritten amount'],
            boundingBox: { x: 250, y: 300, width: 100, height: 18 }
          }
        ]
      }

    case '1099-DIV':
      return {
        ...baseData,
        extractedFields: [
          {
            fieldName: 'payer_name',
            value: 'Investment Corp',
            confidence: 0.96,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 120, y: 180, width: 180, height: 18 }
          },
          {
            fieldName: 'recipient_name',
            value: 'Robert Johnson',
            confidence: 0.94,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 120, y: 220, width: 160, height: 18 }
          },
          {
            fieldName: 'dividend_income',
            value: '$2,856.42',
            confidence: 0.88,
            needsReview: true,
            validationErrors: [],
            boundingBox: { x: 120, y: 300, width: 100, height: 18 }
          },
          {
            fieldName: 'qualified_dividends',
            value: '$2,856.42',
            confidence: 0.85,
            needsReview: true,
            validationErrors: ['Verify qualified dividend classification'],
            boundingBox: { x: 250, y: 300, width: 100, height: 18 }
          }
        ]
      }

    default:
      return {
        ...baseData,
        extractedFields: [
          {
            fieldName: 'document_type',
            value: `${formType} Form`,
            confidence: 0.90,
            needsReview: false,
            validationErrors: [],
            boundingBox: { x: 120, y: 180, width: 150, height: 18 }
          },
          {
            fieldName: 'amount',
            value: '$1,234.56',
            confidence: 0.85,
            needsReview: true,
            validationErrors: [],
            boundingBox: { x: 120, y: 220, width: 100, height: 18 }
          }
        ]
      }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Google Document AI is configured
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID ||
        !process.env.GOOGLE_DOCUMENTAI_W2_PROCESSOR_ID ||
        process.env.GOOGLE_CLOUD_PROJECT_ID === 'your-project-id') {

      // Get form data for mock response
      const formData = await request.formData()
      const file = formData.get('file') as File
      const expectedFormType = formData.get('expectedFormType') as string

      // Generate realistic mock data based on form type
      const mockData = generateMockData(expectedFormType, file?.name || 'document.pdf')

      return NextResponse.json({
        success: true,
        result: mockData,
        message: '🎯 Professional Mock Processing - Simulating Google Document AI (No billing required)',
        mockMode: true,
        note: 'This demonstrates the complete workflow with realistic data. Ready for production when billing is enabled.'
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const expectedFormType = formData.get('expectedFormType') as TaxFormType
    const clientId = formData.get('clientId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF, PNG, JPG, or TIFF files.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process document with Google Document AI
    const documentAI = new GoogleDocumentAIService()
    const result = await documentAI.processDocument(buffer, file.name, expectedFormType)

    // Return processing result
    return NextResponse.json({
      success: true,
      result: {
        ...result,
        // Convert dates to strings for JSON serialization
        metadata: {
          ...result.metadata,
          processingDate: result.metadata.processingDate.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Document processing error:', error)

    // Determine if this is a configuration error
    const isConfigError = error.message?.includes('processor') ||
                         error.message?.includes('credentials') ||
                         error.message?.includes('GOOGLE_') ||
                         error.message?.includes('authentication')

    // Return user-friendly error message
    return NextResponse.json(
      {
        error: 'Document processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        isConfigurationError: isConfigError
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
