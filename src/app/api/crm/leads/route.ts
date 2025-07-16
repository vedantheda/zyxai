import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || 'demo-org-123'
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log(`📋 Fetching leads for organization: ${organizationId}`)

    // Build query
    let query = supabaseAdmin
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        company,
        address,
        city,
        state,
        zip_code,
        lead_score,
        status,
        source,
        assigned_to,
        last_contact,
        next_follow_up,
        estimated_value,
        notes,
        tags,
        custom_fields,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    }

    const { data: contacts, error } = await query

    if (error) {
      throw error
    }

    // Transform to frontend format
    const leads = (contacts || []).map(contact => ({
      id: contact.id,
      firstName: contact.first_name || '',
      lastName: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      zipCode: contact.zip_code,
      leadScore: contact.lead_score || 0,
      status: contact.status || 'new',
      source: contact.source || 'manual',
      assignedTo: contact.assigned_to,
      lastContact: contact.last_contact,
      nextFollowUp: contact.next_follow_up,
      estimatedValue: contact.estimated_value,
      notes: contact.notes,
      tags: contact.tags || [],
      customFields: contact.custom_fields || {},
      createdAt: contact.created_at,
      updatedAt: contact.updated_at
    }))

    return NextResponse.json({
      success: true,
      leads,
      total: leads.length,
      offset,
      limit
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error fetching leads:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch leads',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json()
    const organizationId = 'demo-org-123' // In real app, get from auth

    console.log('📋 Creating new lead:', leadData.firstName, leadData.lastName)

    // Transform to database format
    const contactData = {
      organization_id: organizationId,
      first_name: leadData.firstName,
      last_name: leadData.lastName,
      email: leadData.email,
      phone: leadData.phone,
      company: leadData.company,
      address: leadData.address,
      city: leadData.city,
      state: leadData.state,
      zip_code: leadData.zipCode,
      lead_score: leadData.leadScore || 0,
      status: leadData.status || 'new',
      source: leadData.source || 'manual',
      assigned_to: leadData.assignedTo,
      last_contact: leadData.lastContact,
      next_follow_up: leadData.nextFollowUp,
      estimated_value: leadData.estimatedValue,
      notes: leadData.notes,
      tags: leadData.tags || [],
      custom_fields: leadData.customFields || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert(contactData)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Transform back to frontend format
    const lead = {
      id: contact.id,
      firstName: contact.first_name || '',
      lastName: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      zipCode: contact.zip_code,
      leadScore: contact.lead_score || 0,
      status: contact.status || 'new',
      source: contact.source || 'manual',
      assignedTo: contact.assigned_to,
      lastContact: contact.last_contact,
      nextFollowUp: contact.next_follow_up,
      estimatedValue: contact.estimated_value,
      notes: contact.notes,
      tags: contact.tags || [],
      customFields: contact.custom_fields || {},
      createdAt: contact.created_at,
      updatedAt: contact.updated_at
    }

    console.log(`✅ Lead created: ${lead.id}`)

    return NextResponse.json({
      success: true,
      lead,
      message: 'Lead created successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error creating lead:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create lead',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')
    const updates = await request.json()

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`📋 Updating lead: ${leadId}`)

    // Transform to database format
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.firstName !== undefined) updateData.first_name = updates.firstName
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.company !== undefined) updateData.company = updates.company
    if (updates.address !== undefined) updateData.address = updates.address
    if (updates.city !== undefined) updateData.city = updates.city
    if (updates.state !== undefined) updateData.state = updates.state
    if (updates.zipCode !== undefined) updateData.zip_code = updates.zipCode
    if (updates.leadScore !== undefined) updateData.lead_score = updates.leadScore
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.source !== undefined) updateData.source = updates.source
    if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo
    if (updates.lastContact !== undefined) updateData.last_contact = updates.lastContact
    if (updates.nextFollowUp !== undefined) updateData.next_follow_up = updates.nextFollowUp
    if (updates.estimatedValue !== undefined) updateData.estimated_value = updates.estimatedValue
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.customFields !== undefined) updateData.custom_fields = updates.customFields

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Transform back to frontend format
    const lead = {
      id: contact.id,
      firstName: contact.first_name || '',
      lastName: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      zipCode: contact.zip_code,
      leadScore: contact.lead_score || 0,
      status: contact.status || 'new',
      source: contact.source || 'manual',
      assignedTo: contact.assigned_to,
      lastContact: contact.last_contact,
      nextFollowUp: contact.next_follow_up,
      estimatedValue: contact.estimated_value,
      notes: contact.notes,
      tags: contact.tags || [],
      customFields: contact.custom_fields || {},
      createdAt: contact.created_at,
      updatedAt: contact.updated_at
    }

    console.log(`✅ Lead updated: ${leadId}`)

    return NextResponse.json({
      success: true,
      lead,
      message: 'Lead updated successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error updating lead:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update lead',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`🗑️ Deleting lead: ${leadId}`)

    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', leadId)

    if (error) {
      throw error
    }

    console.log(`✅ Lead deleted: ${leadId}`)

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error deleting lead:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete lead',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}
