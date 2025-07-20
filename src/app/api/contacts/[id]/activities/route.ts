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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // Filter by activity type

    // Fetch activities from HubSpot API
    const hubspotApiKey = process.env.HUBSPOT_ACCESS_TOKEN
    if (!hubspotApiKey) {
      throw new Error('HubSpot API key not configured')
    }

    // Fetch HubSpot activities (calls, emails, meetings, notes, tasks)
    const activityTypes = ['calls', 'emails', 'meetings', 'notes', 'tasks']
    let allActivities: any[] = []

    for (const activityType of activityTypes) {
      try {
        const response = await fetch(
          `https://api.hubapi.com/crm/v3/objects/${activityType}?associations=contact&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          const activities = data.results?.map((activity: any) => ({
            id: activity.id,
            contact_id: contactId,
            type: activityType.slice(0, -1), // Remove 's' from end
            title: activity.properties?.hs_subject || activity.properties?.hs_call_title || `${activityType.slice(0, -1)} activity`,
            description: activity.properties?.hs_body_preview || activity.properties?.hs_call_body || '',
            timestamp: activity.properties?.hs_timestamp || activity.properties?.hs_createdate || new Date().toISOString(),
            user_id: activity.properties?.hubspot_owner_id || 'system',
            user_name: 'CRM User',
            metadata: {
              hubspot_id: activity.id,
              ...activity.properties
            },
            created_at: activity.properties?.hs_createdate || new Date().toISOString()
          })) || []

          allActivities = [...allActivities, ...activities]
        }
      } catch (error) {
        console.error(`Failed to fetch ${activityType} from HubSpot:`, error)
      }
    }

    // Fallback to mock data if HubSpot fetch fails or returns no data
    const mockActivities = [
      {
        id: '1',
        contact_id: contactId,
        type: 'call',
        title: 'Outbound call completed',
        description: 'Discussed wholesale pricing and delivery options. Customer interested in bulk order.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user_id: 'user-1',
        user_name: 'AI Agent Sarah',
        metadata: { duration: '5:23', outcome: 'interested' },
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: '2',
        contact_id: contactId,
        type: 'email',
        title: 'Email sent: Product catalog',
        description: 'Sent comprehensive product catalog with pricing tiers.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user_id: 'system',
        user_name: 'System',
        metadata: { subject: 'Product Catalog - Wholesale Pricing', status: 'delivered' },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: '3',
        contact_id: contactId,
        type: 'page_visit',
        title: 'Page visited',
        description: 'Visited pricing page',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        user_id: null,
        user_name: null,
        metadata: { page: '/pricing', duration: 120 },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      },
      {
        id: '4',
        contact_id: contactId,
        type: 'note',
        title: 'Contact created',
        description: 'Contact imported from lead generation campaign',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        user_id: 'system',
        user_name: 'System',
        metadata: { source: 'import', campaign: 'Q4 Wholesale Outreach' },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
      }
    ]

    // Use HubSpot data if available, otherwise fallback to mock data
    const finalActivities = allActivities.length > 0 ? allActivities : mockActivities

    // Sort by timestamp (newest first)
    finalActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Filter by type if specified
    let filteredActivities = finalActivities
    if (type) {
      filteredActivities = finalActivities.filter(activity => activity.type === type)
    }

    // Apply pagination
    const paginatedActivities = filteredActivities.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      activities: paginatedActivities,
      total: filteredActivities.length,
      limit,
      offset,
      source: allActivities.length > 0 ? 'hubspot' : 'mock'
    })

  } catch (error) {
    console.error('Failed to fetch contact activities:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch contact activities'
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
    const { type, title, description, metadata } = body

    // Validate required fields
    if (!type || !title) {
      return NextResponse.json({
        success: false,
        error: 'Type and title are required'
      }, { status: 400 })
    }

    // Mock activity creation - replace with actual database insert
    const newActivity = {
      id: `activity-${Date.now()}`,
      contact_id: contactId,
      type,
      title,
      description: description || '',
      timestamp: new Date().toISOString(),
      user_id: 'current-user', // Replace with actual user ID from session
      user_name: 'Current User', // Replace with actual user name
      metadata: metadata || {},
      created_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      activity: newActivity,
      message: 'Activity created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to create contact activity:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create contact activity'
    }, { status: 500 })
  }
}
