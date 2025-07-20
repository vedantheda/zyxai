import { NextRequest, NextResponse } from 'next/server'
import { HubSpotService } from '@/lib/services/HubSpotService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    // Use your existing CRM_ACCESS_TOKEN from environment
    const accessToken = process.env.CRM_ACCESS_TOKEN

    // Set cache headers for better performance
    const headers = {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
      'Content-Type': 'application/json',
    }
    
    if (!accessToken) {
      // Return mock data if no access token
      const mockContacts = [
        {
          id: '1',
          properties: {
            firstname: 'John',
            lastname: 'Smith',
            email: 'john.smith@example.com',
            phone: '+1 (555) 123-4567',
            company: 'Smith Wholesale Co.',
            jobtitle: 'Purchasing Manager',
            lifecyclestage: 'opportunity',
            hs_lead_status: 'QUALIFIED',
            createdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            lastmodifieddate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            notes_last_contacted: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            hs_analytics_source: 'ORGANIC_SEARCH'
          }
        },
        {
          id: '2',
          properties: {
            firstname: 'Sarah',
            lastname: 'Johnson',
            email: 'sarah.j@company.com',
            phone: '+1 (555) 987-6543',
            company: 'Johnson Enterprises',
            jobtitle: 'Operations Director',
            lifecyclestage: 'qualified',
            hs_lead_status: 'NEW',
            createdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            lastmodifieddate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            notes_last_contacted: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            hs_analytics_source: 'PAID_SEARCH'
          }
        },
        {
          id: '3',
          properties: {
            firstname: 'Mike',
            lastname: 'Davis',
            email: 'mike.davis@email.com',
            phone: '+1 (555) 456-7890',
            company: 'Davis Distribution',
            jobtitle: 'CEO',
            lifecyclestage: 'lead',
            createdate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            lastmodifieddate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            notes_last_contacted: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            hs_analytics_source: 'REFERRALS'
          }
        },
        {
          id: '4',
          properties: {
            firstname: 'Lisa',
            lastname: 'Chen',
            email: 'lisa.chen@techcorp.com',
            phone: '+1 (555) 234-5678',
            company: 'TechCorp Solutions',
            jobtitle: 'VP of Operations',
            lifecyclestage: 'customer',
            hs_lead_status: 'QUALIFIED',
            createdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
            lastmodifieddate: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            notes_last_contacted: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            hs_analytics_source: 'DIRECT_TRAFFIC'
          }
        },
        {
          id: '5',
          properties: {
            firstname: 'Robert',
            lastname: 'Wilson',
            email: 'robert.wilson@globalinc.com',
            phone: '+1 (555) 345-6789',
            company: 'Global Inc.',
            jobtitle: 'Procurement Manager',
            lifecyclestage: 'opportunity',
            hs_lead_status: 'QUALIFIED',
            createdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            lastmodifieddate: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            notes_last_contacted: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            hs_analytics_source: 'SOCIAL_MEDIA'
          }
        }
      ]
      
      return NextResponse.json({
        contacts: mockContacts,
        hasMore: false,
        source: 'mock',
        message: 'Using demo data - HubSpot API credentials not configured'
      }, { headers })
    }

    // Try to fetch real HubSpot data
    try {
      const result = await HubSpotService.getContacts(accessToken, limit)
      return NextResponse.json({
        ...result,
        source: 'hubspot',
        message: 'Data from HubSpot API'
      }, { headers })
    } catch (hubspotError) {
      console.error('HubSpot API error:', hubspotError)
      
      // Fallback to mock data if HubSpot API fails
      const mockContacts = [
        {
          id: '1',
          properties: {
            firstname: 'John',
            lastname: 'Smith',
            email: 'john.smith@example.com',
            phone: '+1 (555) 123-4567',
            company: 'Smith Wholesale Co.',
            jobtitle: 'Purchasing Manager',
            lifecyclestage: 'opportunity',
            hs_lead_status: 'QUALIFIED',
            createdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            lastmodifieddate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            notes_last_contacted: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            hs_analytics_source: 'ORGANIC_SEARCH'
          }
        },
        {
          id: '2',
          properties: {
            firstname: 'Sarah',
            lastname: 'Johnson',
            email: 'sarah.j@company.com',
            phone: '+1 (555) 987-6543',
            company: 'Johnson Enterprises',
            jobtitle: 'Operations Director',
            lifecyclestage: 'qualified',
            hs_lead_status: 'NEW',
            createdate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            lastmodifieddate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            notes_last_contacted: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            hs_analytics_source: 'PAID_SEARCH'
          }
        },
        {
          id: '3',
          properties: {
            firstname: 'Mike',
            lastname: 'Davis',
            email: 'mike.davis@email.com',
            phone: '+1 (555) 456-7890',
            company: 'Davis Distribution',
            jobtitle: 'CEO',
            lifecyclestage: 'lead',
            createdate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            lastmodifieddate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            notes_last_contacted: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            hs_analytics_source: 'REFERRALS'
          }
        }
      ]
      
      return NextResponse.json({
        contacts: mockContacts,
        hasMore: false,
        source: 'mock',
        message: 'HubSpot API error - using demo data',
        error: hubspotError.message
      }, { headers })
    }
    
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: error.message },
      { status: 500 }
    )
  }
}
