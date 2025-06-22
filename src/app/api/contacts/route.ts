import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Contacts API - Real contact management
 * Handles CRUD operations for contacts and contact lists
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId')
    const organizationId = searchParams.get('organizationId')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    // Build query
    let query = supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)

    if (listId) {
      query = query.eq('list_id', listId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: contacts, error, count } = await query

    if (error) {
      console.error('Failed to fetch contacts:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      contacts: contacts || [],
      totalCount: count || 0
    })

  } catch (error: any) {
    console.error('Contacts API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch contacts'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      listId,
      firstName,
      lastName,
      email,
      phone,
      company,
      title,
      customFields = {},
      tags = []
    } = body

    // Validate required fields
    if (!organizationId || !phone) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID and phone number are required'
      }, { status: 400 })
    }

    // Check if contact already exists
    const { data: existingContact } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('phone', phone)
      .single()

    if (existingContact) {
      return NextResponse.json({
        success: false,
        error: 'Contact with this phone number already exists'
      }, { status: 409 })
    }

    // Create contact
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: organizationId,
        list_id: listId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company,
        title,
        custom_fields: customFields,
        tags,
        lead_score: 0,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create contact:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Update contact list counts if listId provided
    if (listId) {
      await updateContactListCounts(listId)
    }

    return NextResponse.json({
      success: true,
      contact,
      message: 'Contact created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Contact creation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create contact'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      contactId,
      organizationId,
      firstName,
      lastName,
      email,
      phone,
      company,
      title,
      customFields,
      tags,
      status
    } = body

    if (!contactId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Contact ID and Organization ID are required'
      }, { status: 400 })
    }

    // Update contact
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company,
        title,
        custom_fields: customFields,
        tags,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update contact:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      contact,
      message: 'Contact updated successfully'
    })

  } catch (error: any) {
    console.error('Contact update error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update contact'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const organizationId = searchParams.get('organizationId')

    if (!contactId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Contact ID and Organization ID are required'
      }, { status: 400 })
    }

    // Get contact to find list_id for count update
    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('list_id')
      .eq('id', contactId)
      .eq('organization_id', organizationId)
      .single()

    // Delete contact
    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Failed to delete contact:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Update contact list counts if contact was in a list
    if (contact?.list_id) {
      await updateContactListCounts(contact.list_id)
    }

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    })

  } catch (error: any) {
    console.error('Contact deletion error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete contact'
    }, { status: 500 })
  }
}

/**
 * Helper function to update contact list counts
 */
async function updateContactListCounts(listId: string) {
  try {
    // Count total and active contacts
    const { count: totalCount } = await supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId)

    const { count: activeCount } = await supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId)
      .eq('status', 'active')

    // Update contact list
    await supabaseAdmin
      .from('contact_lists')
      .update({
        total_contacts: totalCount || 0,
        active_contacts: activeCount || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', listId)

  } catch (error) {
    console.error('Failed to update contact list counts:', error)
  }
}
