import { NextRequest, NextResponse } from 'next/server'

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

export async function POST(request: NextRequest) {
  try {
    const { action, contactIds, data } = await request.json()

    if (!HUBSPOT_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'HubSpot access token not configured' },
        { status: 500 }
      )
    }

    const baseUrl = 'https://api.hubapi.com'
    const headers = {
      'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    }

    switch (action) {
      case 'delete':
        // Batch archive contacts (soft delete)
        const archiveResponse = await fetch(`${baseUrl}/crm/v3/objects/contacts/batch/archive`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            inputs: contactIds.map((id: string) => ({ id }))
          })
        })

        if (!archiveResponse.ok) {
          throw new Error('Failed to archive contacts')
        }

        return NextResponse.json({ 
          success: true, 
          message: `${contactIds.length} contacts archived successfully` 
        })

      case 'restore':
        // For restore, we would need to recreate the contacts
        // This is a simplified implementation
        return NextResponse.json({ 
          success: true, 
          message: 'Contact restore functionality would be implemented here' 
        })

      case 'update':
        // Batch update contacts
        const updateInputs = contactIds.map((id: string) => ({
          id,
          properties: data.properties || {}
        }))

        const updateResponse = await fetch(`${baseUrl}/crm/v3/objects/contacts/batch/update`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ inputs: updateInputs })
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update contacts')
        }

        return NextResponse.json({ 
          success: true, 
          message: `${contactIds.length} contacts updated successfully` 
        })

      case 'add_tags':
        // Add tags to contacts (using custom properties or associations)
        const tagInputs = contactIds.map((id: string) => ({
          id,
          properties: {
            // Assuming we use a custom property for tags
            tags: data.tags?.join(';') || ''
          }
        }))

        const tagResponse = await fetch(`${baseUrl}/crm/v3/objects/contacts/batch/update`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ inputs: tagInputs })
        })

        if (!tagResponse.ok) {
          throw new Error('Failed to add tags to contacts')
        }

        return NextResponse.json({ 
          success: true, 
          message: `Tags added to ${contactIds.length} contacts successfully` 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bulk contact operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving deleted/archived contacts
export async function GET(request: NextRequest) {
  try {
    if (!HUBSPOT_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'HubSpot access token not configured' },
        { status: 500 }
      )
    }

    const baseUrl = 'https://api.hubapi.com'
    const headers = {
      'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    }

    // Get archived contacts
    const response = await fetch(`${baseUrl}/crm/v3/objects/contacts?archived=true&limit=100`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to fetch archived contacts')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      contacts: data.results || [],
      total: data.total || 0
    })

  } catch (error) {
    console.error('Error fetching archived contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archived contacts' },
      { status: 500 }
    )
  }
}
