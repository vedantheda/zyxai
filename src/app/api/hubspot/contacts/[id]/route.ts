import { NextRequest, NextResponse } from 'next/server'
import { HubSpotService } from '@/lib/services/HubSpotService'

// GET - Get a specific contact by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const accessToken = process.env.CRM_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { error: 'HubSpot access token not configured' },
        { status: 500 }
      )
    }

    const contact = await HubSpotService.getContact(accessToken, contactId)
    
    return NextResponse.json({
      contact,
      source: 'hubspot',
      message: 'Contact retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

// PATCH - Update a specific contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const accessToken = process.env.CRM_ACCESS_TOKEN
    const updateData = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'HubSpot access token not configured' },
        { status: 500 }
      )
    }

    // Map the update data to HubSpot format
    const hubspotData = {
      firstname: updateData.name?.split(' ')[0] || '',
      lastname: updateData.name?.split(' ').slice(1).join(' ') || '',
      email: updateData.email,
      phone: updateData.phone,
      company: updateData.company,
      jobtitle: updateData.jobTitle,
      lifecyclestage: updateData.lifecycleStage,
      address: updateData.address,
      city: updateData.city,
      state: updateData.state,
      zip: updateData.zipCode,
      hubspotscore: updateData.leadScore,
      lead_source: updateData.source,
      hs_lead_status: updateData.leadStatus
    }

    // Remove undefined values
    Object.keys(hubspotData).forEach(key => {
      if (hubspotData[key as keyof typeof hubspotData] === undefined) {
        delete hubspotData[key as keyof typeof hubspotData]
      }
    })

    const updatedContact = await HubSpotService.upsertContact(
      accessToken,
      hubspotData,
      contactId
    )
    
    return NextResponse.json({
      contact: updatedContact,
      source: 'hubspot',
      message: 'Contact updated successfully'
    })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

// DELETE - Archive/delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    const accessToken = process.env.CRM_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { error: 'HubSpot access token not configured' },
        { status: 500 }
      )
    }

    // Archive the contact in HubSpot
    const baseUrl = 'https://api.hubapi.com'
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(`${baseUrl}/crm/v3/objects/contacts/${contactId}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to delete contact in HubSpot')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
