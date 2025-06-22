import { NextRequest, NextResponse } from 'next/server'
import { FieldMappingService } from '@/lib/services/FieldMappingService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const crmType = searchParams.get('crmType')
    const entityType = searchParams.get('entityType')

    if (!organizationId || !crmType) {
      return NextResponse.json(
        { error: 'Organization ID and CRM type are required' },
        { status: 400 }
      )
    }

    const { mappings, error } = await FieldMappingService.getFieldMappings(
      organizationId,
      crmType,
      entityType || undefined
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Also return available fields for mapping
    const zyxaiFields = entityType 
      ? FieldMappingService.getZyxAIFields(entityType as any)
      : []
    
    const crmFields = entityType && crmType === 'hubspot'
      ? FieldMappingService.getHubSpotFields(entityType as any)
      : []

    return NextResponse.json({ 
      mappings, 
      zyxaiFields, 
      crmFields 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch field mappings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, mapping } = body

    if (!organizationId || !mapping) {
      return NextResponse.json(
        { error: 'Organization ID and mapping data are required' },
        { status: 400 }
      )
    }

    const { mapping: savedMapping, error } = await FieldMappingService.upsertFieldMapping(
      organizationId,
      mapping
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ mapping: savedMapping })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save field mapping' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mappingId = searchParams.get('mappingId')

    if (!mappingId) {
      return NextResponse.json(
        { error: 'Mapping ID is required' },
        { status: 400 }
      )
    }

    const { success, error } = await FieldMappingService.deleteFieldMapping(mappingId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete field mapping' },
      { status: 500 }
    )
  }
}
