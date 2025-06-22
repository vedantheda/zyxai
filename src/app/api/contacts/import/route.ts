import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Contact Import API - Bulk contact import from CSV
 * Handles CSV parsing and bulk contact creation
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      listId,
      contacts,
      createNewList = false,
      newListName = 'Imported Contacts'
    } = body

    if (!organizationId || !contacts || !Array.isArray(contacts)) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID and contacts array are required'
      }, { status: 400 })
    }

    let targetListId = listId

    // Create new list if requested
    if (createNewList || !listId) {
      const { data: newList, error: listError } = await supabaseAdmin
        .from('contact_lists')
        .insert({
          organization_id: organizationId,
          name: newListName,
          description: 'Contacts imported from CSV',
          total_contacts: 0,
          active_contacts: 0
        })
        .select()
        .single()

      if (listError) {
        console.error('Failed to create contact list:', listError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create contact list: ' + listError.message
        }, { status: 500 })
      }

      targetListId = newList.id
    }

    if (!targetListId) {
      return NextResponse.json({
        success: false,
        error: 'No target list specified'
      }, { status: 400 })
    }

    // Process contacts in batches
    const batchSize = 100
    let imported = 0
    let failed = 0
    const errors: string[] = []
    const duplicates: string[] = []

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize)
      
      // Prepare batch data
      const contactsToInsert = []
      
      for (const contact of batch) {
        // Validate required fields
        if (!contact.phone) {
          failed++
          errors.push(`Row ${i + batch.indexOf(contact) + 1}: Phone number is required`)
          continue
        }

        // Check for duplicates in this organization
        const { data: existingContact } = await supabaseAdmin
          .from('contacts')
          .select('id, phone')
          .eq('organization_id', organizationId)
          .eq('phone', contact.phone)
          .single()

        if (existingContact) {
          failed++
          duplicates.push(contact.phone)
          continue
        }

        // Prepare contact data
        contactsToInsert.push({
          organization_id: organizationId,
          list_id: targetListId,
          first_name: contact.firstName || contact.first_name || '',
          last_name: contact.lastName || contact.last_name || '',
          email: contact.email || '',
          phone: contact.phone,
          company: contact.company || '',
          title: contact.title || '',
          custom_fields: contact.customFields || {},
          tags: contact.tags || [],
          lead_score: 0,
          status: 'active'
        })
      }

      // Insert batch
      if (contactsToInsert.length > 0) {
        const { data: insertedContacts, error: insertError } = await supabaseAdmin
          .from('contacts')
          .insert(contactsToInsert)
          .select()

        if (insertError) {
          console.error('Batch insert error:', insertError)
          failed += contactsToInsert.length
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`)
        } else {
          imported += insertedContacts?.length || 0
        }
      }
    }

    // Update contact list counts
    await updateContactListCounts(targetListId)

    // Prepare response
    const result = {
      success: true,
      imported,
      failed,
      total: contacts.length,
      listId: targetListId,
      errors: errors.slice(0, 10), // Limit errors to first 10
      duplicates: duplicates.slice(0, 10), // Limit duplicates to first 10
      message: `Import completed: ${imported} imported, ${failed} failed`
    }

    if (errors.length > 10) {
      result.errors.push(`... and ${errors.length - 10} more errors`)
    }

    if (duplicates.length > 10) {
      result.duplicates.push(`... and ${duplicates.length - 10} more duplicates`)
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Contact import error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to import contacts'
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

/**
 * GET endpoint to provide CSV template
 */
export async function GET(request: NextRequest) {
  try {
    const csvTemplate = `first_name,last_name,email,phone,company,title
John,Doe,john@example.com,+1-555-123-4567,Acme Corp,Manager
Jane,Smith,jane@example.com,+1-555-987-6543,Tech Inc,Developer
Mike,Johnson,mike@example.com,+1-555-456-7890,StartupXYZ,CEO`

    return new NextResponse(csvTemplate, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="contact_import_template.csv"'
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate template'
    }, { status: 500 })
  }
}
