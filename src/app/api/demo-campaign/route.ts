import { NextRequest, NextResponse } from 'next/server'
import { CampaignExecutionService } from '@/lib/services/CampaignExecutionService'

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 Demo Campaign Execution System...')

    // Create a mock campaign execution for demonstration
    const mockCampaignId = 'demo-campaign-123'
    
    // Simulate campaign data
    const mockCampaign = {
      id: mockCampaignId,
      name: 'Demo Sales Campaign',
      description: 'Demonstration of ZyxAI campaign execution system',
      agent_name: 'Sam - Sales Agent',
      contact_list_name: 'Demo Prospects',
      status: 'draft',
      total_contacts: 10,
      completed_calls: 0,
      successful_calls: 0
    }

    // Simulate contacts
    const mockContacts = [
      { id: '1', first_name: 'John', last_name: 'Doe', phone: '+1234567890' },
      { id: '2', first_name: 'Jane', last_name: 'Smith', phone: '+1234567891' },
      { id: '3', first_name: 'Bob', last_name: 'Johnson', phone: '+1234567892' },
      { id: '4', first_name: 'Alice', last_name: 'Williams', phone: '+1234567893' },
      { id: '5', first_name: 'Charlie', last_name: 'Brown', phone: '+1234567894' },
      { id: '6', first_name: 'Diana', last_name: 'Davis', phone: '+1234567895' },
      { id: '7', first_name: 'Frank', last_name: 'Miller', phone: '+1234567896' },
      { id: '8', first_name: 'Grace', last_name: 'Wilson', phone: '+1234567897' },
      { id: '9', first_name: 'Henry', last_name: 'Moore', phone: '+1234567898' },
      { id: '10', first_name: 'Ivy', last_name: 'Taylor', phone: '+1234567899' }
    ]

    // Simulate call results
    const mockCalls = mockContacts.map((contact, index) => ({
      id: `call-${index + 1}`,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      phone_number: contact.phone,
      status: Math.random() > 0.3 ? 'completed' : 'failed',
      duration_seconds: Math.floor(Math.random() * 300) + 60,
      sentiment_score: Math.random() * 0.4 + 0.3,
      summary: `Call with ${contact.first_name} ${contact.last_name} - ${Math.random() > 0.3 ? 'Interested in learning more' : 'Not available'}`,
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }))

    // Calculate stats
    const completedCalls = mockCalls.filter(call => call.status === 'completed')
    const successfulCalls = completedCalls.filter(call => call.sentiment_score > 0.5)

    const executionStatus = {
      campaignId: mockCampaignId,
      status: 'completed',
      totalCalls: mockContacts.length,
      completedCalls: completedCalls.length,
      successfulCalls: successfulCalls.length,
      failedCalls: mockCalls.length - completedCalls.length,
      currentBatch: 1,
      errors: []
    }

    const progress = {
      percentage: Math.round((completedCalls.length / mockContacts.length) * 100),
      completed: completedCalls.length,
      total: mockContacts.length,
      successful: successfulCalls.length,
      failed: mockCalls.length - completedCalls.length,
      success_rate: completedCalls.length > 0 
        ? Math.round((successfulCalls.length / completedCalls.length) * 100)
        : 0
    }

    return NextResponse.json({
      success: true,
      message: 'Demo campaign execution completed successfully',
      demo: true,
      campaign: mockCampaign,
      execution: executionStatus,
      progress,
      recent_calls: mockCalls.slice(0, 5),
      all_calls: mockCalls,
      contacts: mockContacts,
      statistics: {
        total_contacts: mockContacts.length,
        calls_made: mockCalls.length,
        completion_rate: `${Math.round((completedCalls.length / mockCalls.length) * 100)}%`,
        success_rate: `${progress.success_rate}%`,
        average_duration: `${Math.round(mockCalls.reduce((acc, call) => acc + call.duration_seconds, 0) / mockCalls.length / 60)}m`,
        average_sentiment: Math.round(mockCalls.reduce((acc, call) => acc + call.sentiment_score, 0) / mockCalls.length * 100) / 100
      },
      features_demonstrated: [
        '✅ Campaign Creation and Management',
        '✅ Contact List Processing',
        '✅ Automated Call Execution',
        '✅ Real-time Progress Tracking',
        '✅ Call Result Processing',
        '✅ Success Rate Calculation',
        '✅ Sentiment Analysis',
        '✅ Campaign Analytics',
        '✅ Call History and Transcripts',
        '✅ Performance Metrics'
      ],
      api_endpoints: {
        start_campaign: '/api/campaigns/{id}/start',
        campaign_status: '/api/campaigns/{id}/start (GET)',
        campaign_control: '/api/campaigns/{id}/control',
        campaign_execution_panel: 'Available in /dashboard/campaigns'
      },
      next_steps: [
        '1. Visit /dashboard/campaigns to see the campaign management interface',
        '2. Create a real campaign with your agents and contacts',
        '3. Use the Campaign Control panel to start and monitor campaigns',
        '4. Review call results and analytics in real-time',
        '5. Integrate with CRM systems for automated follow-up'
      ]
    })

  } catch (error: any) {
    console.error('❌ Demo campaign failed:', error)
    return NextResponse.json(
      { 
        error: 'Demo campaign failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    console.log(`🎭 Demo campaign action: ${action}`)

    // Simulate different campaign states
    const responses = {
      start: {
        success: true,
        message: 'Demo campaign started successfully',
        execution: {
          campaignId: 'demo-campaign-123',
          status: 'running',
          totalCalls: 10,
          completedCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          currentBatch: 1,
          errors: []
        }
      },
      pause: {
        success: true,
        message: 'Demo campaign paused successfully',
        execution: {
          campaignId: 'demo-campaign-123',
          status: 'paused',
          totalCalls: 10,
          completedCalls: 4,
          successfulCalls: 3,
          failedCalls: 1,
          currentBatch: 1,
          errors: []
        }
      },
      resume: {
        success: true,
        message: 'Demo campaign resumed successfully',
        execution: {
          campaignId: 'demo-campaign-123',
          status: 'running',
          totalCalls: 10,
          completedCalls: 4,
          successfulCalls: 3,
          failedCalls: 1,
          currentBatch: 1,
          errors: []
        }
      },
      stop: {
        success: true,
        message: 'Demo campaign stopped successfully',
        execution: {
          campaignId: 'demo-campaign-123',
          status: 'completed',
          totalCalls: 10,
          completedCalls: 7,
          successfulCalls: 5,
          failedCalls: 2,
          currentBatch: 1,
          errors: []
        }
      }
    }

    const response = responses[action as keyof typeof responses] || responses.start

    return NextResponse.json({
      ...response,
      demo: true,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Demo campaign action failed:', error)
    return NextResponse.json(
      { 
        error: 'Demo campaign action failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
