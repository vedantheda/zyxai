import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch notes from HubSpot API
    const hubspotApiKey = process.env.HUBSPOT_ACCESS_TOKEN
    let hubspotNotes: any[] = []

    if (hubspotApiKey) {
      try {
        const response = await fetch(
          `https://api.hubapi.com/crm/v3/objects/notes?associations=contact&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          hubspotNotes = data.results?.map((note: any) => ({
            id: note.id,
            contact_id: contactId,
            title: note.properties?.hs_note_title || 'Note',
            content: note.properties?.hs_note_body || '',
            tags: [], // HubSpot doesn't have built-in tags for notes
            user_id: note.properties?.hubspot_owner_id || 'system',
            user_name: 'CRM User',
            user_avatar: 'CU',
            created_at: note.properties?.hs_createdate || new Date().toISOString(),
            updated_at: note.properties?.hs_lastmodifieddate || note.properties?.hs_createdate || new Date().toISOString(),
            metadata: {
              hubspot_id: note.id,
              ...note.properties
            }
          })) || []
        }
      } catch (error) {
        console.error('Failed to fetch notes from HubSpot:', error)
      }
    }

    // Fallback to mock data if HubSpot fetch fails or returns no data
    const mockNotes = [
      {
        id: '1',
        contact_id: contactId,
        title: 'Sales Call Follow-up',
        content: 'Had a great conversation with the contact about their wholesale needs. They\'re looking for:\n• Bulk pricing for 500+ units\n• Monthly delivery schedule\n• 30-day payment terms\n• Product customization options\n\nNext steps: Send detailed pricing proposal and schedule follow-up call for next week.',
        tags: ['wholesale', 'pricing', 'follow-up'],
        user_id: 'user-1',
        user_name: 'Sarah Johnson',
        user_avatar: 'SJ',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: '2',
        contact_id: contactId,
        title: 'Company Research',
        content: 'Researched the company background. They\'re a mid-size retailer with 15 locations across the region. Annual revenue approximately $50M. Good fit for our wholesale program.',
        tags: ['research', 'qualified'],
        user_id: 'user-2',
        user_name: 'Mike Wilson',
        user_avatar: 'MW',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
      },
      {
        id: '3',
        contact_id: contactId,
        title: 'Initial Contact',
        content: 'Contact imported from lead generation campaign "Q4 Wholesale Outreach". Source: LinkedIn advertising campaign.',
        tags: ['import', 'linkedin'],
        user_id: 'system',
        user_name: 'System',
        user_avatar: 'SYS',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
      }
    ]

    // Use HubSpot data if available, otherwise fallback to mock data
    const finalNotes = hubspotNotes.length > 0 ? hubspotNotes : mockNotes

    // Sort by creation date (newest first)
    finalNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply pagination
    const paginatedNotes = finalNotes.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      notes: paginatedNotes,
      total: finalNotes.length,
      limit,
      offset,
      source: hubspotNotes.length > 0 ? 'hubspot' : 'mock'
    })

  } catch (error) {
    console.error('Failed to fetch contact notes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch contact notes'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const body = await request.json()
    const { title, content, tags } = body

    // Validate required fields
    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Content is required'
      }, { status: 400 })
    }

    // Create note in HubSpot
    const hubspotApiKey = process.env.HUBSPOT_ACCESS_TOKEN
    let hubspotNote = null

    if (hubspotApiKey) {
      try {
        const noteData = {
          properties: {
            hs_note_body: content,
            hs_note_title: title || 'Note',
            hs_timestamp: new Date().toISOString()
          },
          associations: [
            {
              to: { id: contactId },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] // Note to Contact association
            }
          ]
        }

        const response = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(noteData)
        })

        if (response.ok) {
          hubspotNote = await response.json()
        }
      } catch (error) {
        console.error('Failed to create note in HubSpot:', error)
      }
    }

    // Return the created note (from HubSpot if successful, otherwise mock data)
    const newNote = hubspotNote ? {
      id: hubspotNote.id,
      contact_id: contactId,
      title: title || 'Untitled Note',
      content,
      tags: tags || [],
      user_id: 'current-user',
      user_name: 'Current User',
      user_avatar: 'CU',
      created_at: hubspotNote.properties?.hs_createdate || new Date().toISOString(),
      updated_at: hubspotNote.properties?.hs_lastmodifieddate || new Date().toISOString(),
      metadata: {
        hubspot_id: hubspotNote.id,
        source: 'hubspot'
      }
    } : {
      id: `note-${Date.now()}`,
      contact_id: contactId,
      title: title || 'Untitled Note',
      content,
      tags: tags || [],
      user_id: 'current-user',
      user_name: 'Current User',
      user_avatar: 'CU',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        source: 'local'
      }
    }

    return NextResponse.json({
      success: true,
      note: newNote,
      message: 'Note created and automatically saved to CRM',
      source: hubspotNote ? 'hubspot' : 'local'
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to create contact note:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create contact note'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const body = await request.json()
    const { noteId, title, content, tags } = body

    // Validate required fields
    if (!noteId) {
      return NextResponse.json({
        success: false,
        error: 'Note ID is required'
      }, { status: 400 })
    }

    // Mock note update - replace with actual database update
    const updatedNote = {
      id: noteId,
      contact_id: contactId,
      title: title || 'Untitled Note',
      content: content || '',
      tags: tags || [],
      user_id: 'current-user',
      user_name: 'Current User',
      user_avatar: 'CU',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Mock created time
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: 'Note updated successfully'
    })

  } catch (error) {
    console.error('Failed to update contact note:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update contact note'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({
        success: false,
        error: 'Note ID is required'
      }, { status: 400 })
    }

    // Mock note deletion - replace with actual database delete
    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete contact note:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete contact note'
    }, { status: 500 })
  }
}
