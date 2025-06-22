import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Contact Lists API - Real contact list management
 * Handles CRUD operations for contact lists
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    const { data: contactLists, error } = await supabaseAdmin
      .from('contact_lists')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch contact lists:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      contactLists: contactLists || []
    })

  } catch (error: any) {
    console.error('Contact lists API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch contact lists'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      name,
      description,
      tags = [],
      createdBy
    } = body

    // Validate required fields
    if (!organizationId || !name) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID and name are required'
      }, { status: 400 })
    }

    // Check if list with same name already exists
    const { data: existingList } = await supabaseAdmin
      .from('contact_lists')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', name)
      .single()

    if (existingList) {
      return NextResponse.json({
        success: false,
        error: 'Contact list with this name already exists'
      }, { status: 409 })
    }

    // Create contact list
    const { data: contactList, error } = await supabaseAdmin
      .from('contact_lists')
      .insert({
        organization_id: organizationId,
        name: name.trim(),
        description: description?.trim(),
        tags,
        total_contacts: 0,
        active_contacts: 0,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create contact list:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      contactList,
      message: 'Contact list created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Contact list creation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create contact list'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      listId,
      organizationId,
      name,
      description,
      tags
    } = body

    if (!listId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'List ID and Organization ID are required'
      }, { status: 400 })
    }

    // Update contact list
    const { data: contactList, error } = await supabaseAdmin
      .from('contact_lists')
      .update({
        name: name?.trim(),
        description: description?.trim(),
        tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', listId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update contact list:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      contactList,
      message: 'Contact list updated successfully'
    })

  } catch (error: any) {
    console.error('Contact list update error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update contact list'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId')
    const organizationId = searchParams.get('organizationId')

    if (!listId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'List ID and Organization ID are required'
      }, { status: 400 })
    }

    // Check if list has contacts
    const { count: contactCount } = await supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId)

    if (contactCount && contactCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete list with ${contactCount} contacts. Please move or delete contacts first.`
      }, { status: 400 })
    }

    // Delete contact list
    const { error } = await supabaseAdmin
      .from('contact_lists')
      .delete()
      .eq('id', listId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Failed to delete contact list:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Contact list deleted successfully'
    })

  } catch (error: any) {
    console.error('Contact list deletion error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete contact list'
    }, { status: 500 })
  }
}
