import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 Demo Analytics Dashboard...')

    // Simulate comprehensive analytics data
    const mockDashboard = {
      overview: {
        total_campaigns: 12,
        total_calls: 2847,
        total_contacts: 1456,
        success_rate: 67.3,
        average_call_duration: 247, // seconds
        conversion_rate: 23.8,
        revenue_attributed: 127500,
        cost_per_lead: 8.75,
        roi_percentage: 340
      },
      campaigns: {
        active_campaigns: 3,
        completed_campaigns: 9,
        total_calls_made: 2847,
        average_calls_per_campaign: 237,
        best_performing_campaign: {
          id: 'campaign-123',
          name: 'Real Estate Q4 Outreach',
          success_rate: 78.5,
          total_calls: 456
        },
        campaign_performance: [
          {
            campaign_id: 'campaign-123',
            campaign_name: 'Real Estate Q4 Outreach',
            total_calls: 456,
            successful_calls: 358,
            success_rate: 78.5,
            average_duration: 312,
            conversion_rate: 28.4,
            cost_per_call: 2.50,
            revenue_generated: 67800
          },
          {
            campaign_id: 'campaign-124',
            campaign_name: 'Insurance Lead Follow-up',
            total_calls: 389,
            successful_calls: 234,
            success_rate: 60.2,
            average_duration: 198,
            conversion_rate: 18.7,
            cost_per_call: 2.50,
            revenue_generated: 35100
          },
          {
            campaign_id: 'campaign-125',
            campaign_name: 'Healthcare Appointment Scheduling',
            total_calls: 523,
            successful_calls: 367,
            success_rate: 70.2,
            average_duration: 156,
            conversion_rate: 31.2,
            cost_per_call: 2.50,
            revenue_generated: 24600
          }
        ]
      },
      calls: {
        total_calls: 2847,
        successful_calls: 1916,
        failed_calls: 931,
        average_duration: 247,
        total_talk_time: 703209, // seconds
        call_outcomes: {
          'completed': 1916,
          'no_answer': 456,
          'busy': 234,
          'voicemail': 178,
          'failed': 63
        },
        sentiment_distribution: {
          positive: 1247,
          neutral: 892,
          negative: 708
        },
        peak_calling_hours: [
          { hour: 14, call_count: 387, success_rate: 72.4 },
          { hour: 15, call_count: 356, success_rate: 69.8 },
          { hour: 10, call_count: 334, success_rate: 71.2 },
          { hour: 11, call_count: 312, success_rate: 68.9 },
          { hour: 13, call_count: 298, success_rate: 66.7 }
        ],
        geographic_distribution: [
          { region: 'West Coast', call_count: 892, success_rate: 71.3 },
          { region: 'East Coast', call_count: 756, success_rate: 68.9 },
          { region: 'Midwest', call_count: 634, success_rate: 65.2 },
          { region: 'South', call_count: 565, success_rate: 63.8 }
        ]
      },
      contacts: {
        total_contacts: 1456,
        active_contacts: 1289,
        contacted_contacts: 1156,
        qualified_leads: 347,
        conversion_funnel: {
          imported: 1456,
          contacted: 1156,
          interested: 463,
          qualified: 347,
          converted: 104
        },
        lead_sources: [
          { source: 'Website', count: 456, conversion_rate: 28.7 },
          { source: 'Cold Calling', count: 389, conversion_rate: 22.4 },
          { source: 'Referral', count: 234, conversion_rate: 34.6 },
          { source: 'Social Media', count: 198, conversion_rate: 19.2 },
          { source: 'Email Campaign', count: 179, conversion_rate: 15.6 }
        ],
        contact_quality_score: 78.4
      },
      agents: {
        total_agents: 5,
        active_agents: 5,
        agent_performance: [
          {
            agent_id: 'agent-sam',
            agent_name: 'Sam - Real Estate Specialist',
            total_calls: 892,
            success_rate: 78.5,
            average_duration: 312,
            sentiment_score: 0.74,
            conversion_rate: 28.4
          },
          {
            agent_id: 'agent-jessica',
            agent_name: 'Jessica - Appointment Scheduler',
            total_calls: 567,
            success_rate: 71.2,
            average_duration: 198,
            sentiment_score: 0.68,
            conversion_rate: 31.2
          },
          {
            agent_id: 'agent-marcus',
            agent_name: 'Marcus - Insurance Advisor',
            total_calls: 456,
            success_rate: 65.8,
            average_duration: 234,
            sentiment_score: 0.62,
            conversion_rate: 22.7
          },
          {
            agent_id: 'agent-sarah',
            agent_name: 'Dr. Sarah - Healthcare Coordinator',
            total_calls: 389,
            success_rate: 73.4,
            average_duration: 156,
            sentiment_score: 0.71,
            conversion_rate: 35.2
          },
          {
            agent_id: 'agent-david',
            agent_name: 'David - Business Development',
            total_calls: 543,
            success_rate: 59.3,
            average_duration: 278,
            sentiment_score: 0.58,
            conversion_rate: 18.9
          }
        ],
        best_performing_agent: {
          id: 'agent-sam',
          name: 'Sam - Real Estate Specialist',
          success_rate: 78.5
        }
      },
      crm: {
        sync_status: 'healthy',
        last_sync: new Date().toISOString(),
        contacts_synced: 1289,
        calls_synced: 1916,
        sync_success_rate: 98.7,
        data_quality_score: 96.3
      },
      trends: {
        daily_calls: [
          { date: '2024-01-01', calls: 89, success_rate: 67.4 },
          { date: '2024-01-02', calls: 92, success_rate: 69.6 },
          { date: '2024-01-03', calls: 87, success_rate: 71.3 },
          { date: '2024-01-04', calls: 94, success_rate: 68.1 },
          { date: '2024-01-05', calls: 91, success_rate: 72.5 },
          { date: '2024-01-06', calls: 88, success_rate: 70.2 },
          { date: '2024-01-07', calls: 85, success_rate: 69.4 }
        ],
        weekly_performance: [
          { week: 'Week 1', calls: 623, success_rate: 69.7, revenue: 18750 },
          { week: 'Week 2', calls: 687, success_rate: 71.2, revenue: 20625 },
          { week: 'Week 3', calls: 734, success_rate: 68.9, revenue: 22050 },
          { week: 'Week 4', calls: 803, success_rate: 72.4, revenue: 24075 }
        ],
        monthly_growth: [
          { month: 'Oct 2024', calls: 2156, contacts: 1234, revenue: 64500, growth_rate: 12.4 },
          { month: 'Nov 2024', calls: 2398, contacts: 1367, revenue: 71850, growth_rate: 11.4 },
          { month: 'Dec 2024', calls: 2847, contacts: 1456, revenue: 85575, growth_rate: 19.1 }
        ]
      },
      insights: {
        key_insights: [
          'Call success rate increased 15% this month compared to last month',
          'Tuesday 2-4 PM shows highest conversion rates (72.4% success)',
          'Real estate campaigns have 40% higher success rate than average',
          'Average call duration of 4+ minutes correlates with 85% higher conversion',
          'West Coast contacts show 8% higher engagement than other regions'
        ],
        recommendations: [
          'Focus calling efforts on Tuesday-Thursday 2-4 PM for optimal results',
          'Increase real estate campaign budget by 25% based on performance',
          'Train agents to maintain 4-6 minute call duration for better outcomes',
          'Implement follow-up sequences for interested prospects within 24 hours',
          'Expand West Coast targeting and reduce Midwest allocation by 15%'
        ],
        performance_alerts: [
          {
            type: 'success',
            message: 'Campaign "Real Estate Q4 Outreach" exceeded target by 28%',
            action: 'Consider scaling this campaign and replicating strategy'
          },
          {
            type: 'warning',
            message: 'Agent "David" success rate dropped 12% this week',
            action: 'Schedule performance review and provide additional training'
          },
          {
            type: 'success',
            message: 'Overall ROI increased to 340% - highest in 6 months',
            action: 'Document successful strategies for future campaigns'
          }
        ],
        optimization_opportunities: [
          {
            area: 'Call Timing Optimization',
            current_value: 67.3,
            potential_improvement: 78.5,
            recommendation: 'Shift 40% of calls to peak hours (2-4 PM) for 11.2% improvement'
          },
          {
            area: 'Lead Quality Enhancement',
            current_value: 78.4,
            potential_improvement: 89.2,
            recommendation: 'Implement advanced lead scoring to focus on high-quality prospects'
          },
          {
            area: 'Agent Performance',
            current_value: 67.3,
            potential_improvement: 75.8,
            recommendation: 'Provide specialized training based on top performer strategies'
          }
        ]
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics dashboard demo completed successfully',
      demo: true,
      dashboard: mockDashboard,
      metadata: {
        organization_id: 'demo-org-123',
        time_range: '30d',
        generated_at: new Date().toISOString(),
        data_freshness: 'real-time'
      },
      features_demonstrated: [
        '✅ Comprehensive Overview Metrics',
        '✅ Campaign Performance Analytics',
        '✅ Call Outcome Analysis',
        '✅ Contact Funnel Tracking',
        '✅ Agent Performance Monitoring',
        '✅ CRM Integration Status',
        '✅ Trend Analysis & Forecasting',
        '✅ AI-Powered Business Insights',
        '✅ Performance Alerts & Notifications',
        '✅ Optimization Recommendations',
        '✅ ROI & Revenue Attribution',
        '✅ Geographic Performance Analysis',
        '✅ Peak Hour Optimization',
        '✅ Sentiment Analysis Tracking'
      ],
      business_intelligence: {
        key_metrics: {
          total_revenue_attributed: '$127,500',
          roi_percentage: '340%',
          cost_per_qualified_lead: '$8.75',
          average_deal_size: '$1,226',
          customer_acquisition_cost: '$36.50',
          lifetime_value_ratio: '12.4x'
        },
        performance_insights: {
          best_performing_time: 'Tuesday 2-4 PM (72.4% success rate)',
          top_converting_agent: 'Sam - Real Estate Specialist (78.5% success)',
          highest_roi_campaign: 'Real Estate Q4 Outreach (340% ROI)',
          optimal_call_duration: '4-6 minutes (85% higher conversion)',
          best_lead_source: 'Referrals (34.6% conversion rate)'
        },
        growth_opportunities: {
          immediate_wins: [
            'Shift calls to peak hours: +11.2% success rate',
            'Focus on real estate vertical: +40% performance',
            'Implement 24-hour follow-up: +25% conversion'
          ],
          strategic_initiatives: [
            'Advanced lead scoring system',
            'Agent performance optimization program',
            'Geographic expansion to high-performing regions',
            'AI-powered call timing optimization'
          ]
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Analytics demo failed:', error)
    return NextResponse.json(
      { 
        error: 'Analytics demo failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
