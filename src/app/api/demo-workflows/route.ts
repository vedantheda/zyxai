import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 Demo Workflow System...')

    // Simulate comprehensive workflow capabilities
    const mockWorkflows = [
      {
        id: 'workflow-lead-nurturing',
        name: 'Lead Nurturing Sequence',
        description: 'Automated follow-up sequence for new leads',
        organization_id: 'demo-org-123',
        is_active: true,
        trigger: {
          id: 'trigger-1',
          type: 'trigger',
          triggerType: 'contact_added',
          name: 'New Contact Added',
          description: 'Triggers when a new contact is added to the system',
          config: {
            source_filter: ['website', 'cold_calling'],
            lead_score_minimum: 50
          },
          position: { x: 100, y: 100 },
          connections: ['delay-1']
        },
        nodes: [
          {
            id: 'delay-1',
            type: 'delay',
            name: 'Wait 5 Minutes',
            description: 'Wait before first contact',
            config: {},
            position: { x: 300, y: 100 },
            connections: ['action-1'],
            delayType: 'fixed',
            duration: 5,
            unit: 'minutes'
          },
          {
            id: 'action-1',
            type: 'action',
            actionType: 'send_email',
            name: 'Send Welcome Email',
            description: 'Send personalized welcome email',
            config: {},
            position: { x: 500, y: 100 },
            connections: ['delay-2'],
            parameters: {
              template: 'welcome_email',
              to: '{{contact.email}}',
              subject: 'Welcome to ZyxAI, {{contact.first_name}}!',
              personalization: true
            }
          },
          {
            id: 'delay-2',
            type: 'delay',
            name: 'Wait 2 Days',
            description: 'Wait before follow-up call',
            config: {},
            position: { x: 700, y: 100 },
            connections: ['action-2'],
            delayType: 'fixed',
            duration: 2,
            unit: 'days'
          },
          {
            id: 'action-2',
            type: 'action',
            actionType: 'make_call',
            name: 'Follow-up Call',
            description: 'Make automated follow-up call',
            config: {},
            position: { x: 900, y: 100 },
            connections: ['condition-1'],
            parameters: {
              agent_id: 'agent-sam',
              script_template: 'lead_follow_up',
              max_attempts: 3,
              retry_delay: '1 hour'
            }
          },
          {
            id: 'condition-1',
            type: 'condition',
            conditionType: 'if_then',
            name: 'Call Successful?',
            description: 'Check if call was successful',
            config: {},
            position: { x: 1100, y: 100 },
            connections: [],
            logic: 'and',
            rules: [
              {
                field: 'call.status',
                operator: 'equals',
                value: 'completed'
              },
              {
                field: 'call.sentiment_score',
                operator: 'greater_than',
                value: 0.6
              }
            ],
            truePath: ['action-3'],
            falsePath: ['action-4']
          },
          {
            id: 'action-3',
            type: 'action',
            actionType: 'create_deal',
            name: 'Create Opportunity',
            description: 'Create sales opportunity in CRM',
            config: {},
            position: { x: 1300, y: 50 },
            connections: ['action-5'],
            parameters: {
              title: 'Sales Opportunity - {{contact.company}}',
              value: 5000,
              stage: 'qualified',
              probability: 70
            }
          },
          {
            id: 'action-4',
            type: 'action',
            actionType: 'create_task',
            name: 'Schedule Manual Follow-up',
            description: 'Create task for manual follow-up',
            config: {},
            position: { x: 1300, y: 150 },
            connections: [],
            parameters: {
              title: 'Manual follow-up required - {{contact.name}}',
              assignee: 'sales_team',
              due_date: '+3 days',
              priority: 'high'
            }
          },
          {
            id: 'action-5',
            type: 'action',
            actionType: 'sync_crm',
            name: 'Sync to CRM',
            description: 'Sync all data to CRM system',
            config: {},
            position: { x: 1500, y: 50 },
            connections: [],
            parameters: {
              crm_type: 'hubspot',
              sync_contact: true,
              sync_activities: true,
              sync_deals: true
            }
          }
        ],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        created_by: 'user-123',
        version: 2,
        execution_count: 247,
        success_rate: 89.5,
        last_executed: '2024-01-15T14:22:00Z'
      },
      {
        id: 'workflow-appointment-booking',
        name: 'Appointment Booking Automation',
        description: 'Automated appointment scheduling and confirmation',
        organization_id: 'demo-org-123',
        is_active: true,
        trigger: {
          id: 'trigger-2',
          type: 'trigger',
          triggerType: 'call_completed',
          name: 'Call Completed',
          description: 'Triggers when a call is completed',
          config: {
            call_outcome_filter: ['interested', 'callback_requested'],
            sentiment_minimum: 0.5
          },
          position: { x: 100, y: 100 },
          connections: ['condition-2']
        },
        nodes: [
          {
            id: 'condition-2',
            type: 'condition',
            conditionType: 'if_then',
            name: 'Interested in Appointment?',
            description: 'Check if contact wants to schedule appointment',
            config: {},
            position: { x: 300, y: 100 },
            connections: [],
            logic: 'or',
            rules: [
              {
                field: 'call.outcome',
                operator: 'equals',
                value: 'interested'
              },
              {
                field: 'call.next_action',
                operator: 'contains',
                value: 'appointment'
              }
            ],
            truePath: ['action-6'],
            falsePath: ['action-7']
          },
          {
            id: 'action-6',
            type: 'action',
            actionType: 'send_email',
            name: 'Send Booking Link',
            description: 'Send calendar booking link',
            config: {},
            position: { x: 500, y: 50 },
            connections: ['delay-3'],
            parameters: {
              template: 'appointment_booking',
              to: '{{contact.email}}',
              subject: 'Schedule Your Consultation - {{contact.company}}',
              booking_link: 'https://calendly.com/zyxai/consultation'
            }
          },
          {
            id: 'action-7',
            type: 'action',
            actionType: 'update_contact',
            name: 'Update Lead Status',
            description: 'Mark as not interested',
            config: {},
            position: { x: 500, y: 150 },
            connections: [],
            parameters: {
              contact_id: '{{contact.id}}',
              fields: {
                lead_status: 'not_interested',
                last_contact_date: '{{now}}',
                notes: 'Not interested in appointment - {{call.summary}}'
              }
            }
          },
          {
            id: 'delay-3',
            type: 'delay',
            name: 'Wait 1 Day',
            description: 'Wait for booking response',
            config: {},
            position: { x: 700, y: 50 },
            connections: ['condition-3'],
            delayType: 'fixed',
            duration: 1,
            unit: 'days'
          },
          {
            id: 'condition-3',
            type: 'condition',
            conditionType: 'if_then',
            name: 'Appointment Booked?',
            description: 'Check if appointment was scheduled',
            config: {},
            position: { x: 900, y: 50 },
            connections: [],
            logic: 'and',
            rules: [
              {
                field: 'contact.appointment_scheduled',
                operator: 'equals',
                value: true
              }
            ],
            truePath: ['action-8'],
            falsePath: ['action-9']
          },
          {
            id: 'action-8',
            type: 'action',
            actionType: 'send_sms',
            name: 'Send Confirmation SMS',
            description: 'Send appointment confirmation',
            config: {},
            position: { x: 1100, y: 25 },
            connections: [],
            parameters: {
              phone: '{{contact.phone}}',
              message: 'Hi {{contact.first_name}}, your consultation is confirmed for {{appointment.date}} at {{appointment.time}}. Looking forward to speaking with you!'
            }
          },
          {
            id: 'action-9',
            type: 'action',
            actionType: 'send_email',
            name: 'Send Reminder Email',
            description: 'Send booking reminder',
            config: {},
            position: { x: 1100, y: 75 },
            connections: [],
            parameters: {
              template: 'booking_reminder',
              to: '{{contact.email}}',
              subject: 'Don\'t miss out - Schedule your consultation',
              urgency: 'medium'
            }
          }
        ],
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-12T16:45:00Z',
        created_by: 'user-123',
        version: 1,
        execution_count: 156,
        success_rate: 76.3,
        last_executed: '2024-01-15T11:18:00Z'
      },
      {
        id: 'workflow-campaign-optimization',
        name: 'Campaign Performance Optimization',
        description: 'Automatically optimize campaigns based on performance',
        organization_id: 'demo-org-123',
        is_active: true,
        trigger: {
          id: 'trigger-3',
          type: 'trigger',
          triggerType: 'campaign_completed',
          name: 'Campaign Completed',
          description: 'Triggers when a campaign is completed',
          config: {
            minimum_calls: 50
          },
          position: { x: 100, y: 100 },
          connections: ['condition-4']
        },
        nodes: [
          {
            id: 'condition-4',
            type: 'condition',
            conditionType: 'if_then',
            name: 'High Performance?',
            description: 'Check if campaign performed well',
            config: {},
            position: { x: 300, y: 100 },
            connections: [],
            logic: 'and',
            rules: [
              {
                field: 'campaign.success_rate',
                operator: 'greater_than',
                value: 70
              },
              {
                field: 'campaign.conversion_rate',
                operator: 'greater_than',
                value: 20
              }
            ],
            truePath: ['action-10'],
            falsePath: ['condition-5']
          },
          {
            id: 'action-10',
            type: 'action',
            actionType: 'create_task',
            name: 'Scale Successful Campaign',
            description: 'Create task to scale high-performing campaign',
            config: {},
            position: { x: 500, y: 50 },
            connections: ['action-12'],
            parameters: {
              title: 'Scale campaign: {{campaign.name}} ({{campaign.success_rate}}% success)',
              assignee: 'campaign_manager',
              priority: 'high',
              description: 'This campaign exceeded performance targets. Consider increasing budget and expanding reach.'
            }
          },
          {
            id: 'condition-5',
            type: 'condition',
            conditionType: 'if_then',
            name: 'Low Performance?',
            description: 'Check if campaign performed poorly',
            config: {},
            position: { x: 500, y: 150 },
            connections: [],
            logic: 'or',
            rules: [
              {
                field: 'campaign.success_rate',
                operator: 'less_than',
                value: 40
              },
              {
                field: 'campaign.conversion_rate',
                operator: 'less_than',
                value: 10
              }
            ],
            truePath: ['action-11'],
            falsePath: ['action-13']
          },
          {
            id: 'action-11',
            type: 'action',
            actionType: 'create_task',
            name: 'Optimize Poor Campaign',
            description: 'Create task to analyze and improve campaign',
            config: {},
            position: { x: 700, y: 175 },
            connections: [],
            parameters: {
              title: 'Optimize campaign: {{campaign.name}} ({{campaign.success_rate}}% success)',
              assignee: 'campaign_analyst',
              priority: 'high',
              description: 'This campaign underperformed. Analyze call scripts, timing, and target audience for improvements.'
            }
          },
          {
            id: 'action-12',
            type: 'action',
            actionType: 'send_email',
            name: 'Notify Success',
            description: 'Notify team of successful campaign',
            config: {},
            position: { x: 700, y: 50 },
            connections: [],
            parameters: {
              to: 'team@zyxai.com',
              subject: 'Campaign Success: {{campaign.name}}',
              template: 'campaign_success_notification',
              metrics: {
                success_rate: '{{campaign.success_rate}}',
                total_calls: '{{campaign.total_calls}}',
                revenue: '{{campaign.revenue_generated}}'
              }
            }
          },
          {
            id: 'action-13',
            type: 'action',
            actionType: 'update_contact',
            name: 'Update Campaign Status',
            description: 'Mark campaign as reviewed',
            config: {},
            position: { x: 700, y: 125 },
            connections: [],
            parameters: {
              campaign_id: '{{campaign.id}}',
              fields: {
                status: 'reviewed',
                performance_category: 'average',
                review_date: '{{now}}'
              }
            }
          }
        ],
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-14T09:15:00Z',
        created_by: 'user-123',
        version: 1,
        execution_count: 23,
        success_rate: 95.7,
        last_executed: '2024-01-14T20:45:00Z'
      }
    ]

    const mockExecutions = [
      {
        id: 'exec-1',
        workflow_id: 'workflow-lead-nurturing',
        trigger_data: {
          contact: {
            id: 'contact-123',
            name: 'John Smith',
            email: 'john@example.com',
            company: 'Tech Corp',
            lead_score: 75
          }
        },
        status: 'completed',
        current_node: null,
        execution_path: ['trigger-1', 'delay-1', 'action-1', 'delay-2', 'action-2', 'condition-1', 'action-3', 'action-5'],
        started_at: '2024-01-15T14:22:00Z',
        completed_at: '2024-01-15T14:28:00Z',
        error_message: null,
        context: {
          contact: { id: 'contact-123', name: 'John Smith' },
          email_sent: true,
          call_initiated: true,
          call: { status: 'completed', sentiment_score: 0.8 },
          deal_created: true,
          deal_id: 'deal-456',
          crm_synced: true
        }
      },
      {
        id: 'exec-2',
        workflow_id: 'workflow-appointment-booking',
        trigger_data: {
          call: {
            id: 'call-789',
            outcome: 'interested',
            sentiment_score: 0.7,
            next_action: 'schedule appointment'
          },
          contact: {
            id: 'contact-456',
            name: 'Sarah Johnson',
            email: 'sarah@company.com',
            phone: '+1234567890'
          }
        },
        status: 'running',
        current_node: 'delay-3',
        execution_path: ['trigger-2', 'condition-2', 'action-6', 'delay-3'],
        started_at: '2024-01-15T11:18:00Z',
        completed_at: null,
        error_message: null,
        context: {
          call: { outcome: 'interested', sentiment_score: 0.7 },
          contact: { id: 'contact-456', name: 'Sarah Johnson' },
          email_sent: true,
          booking_link_sent: true
        }
      }
    ]

    return NextResponse.json({
      success: true,
      message: 'Workflow system demo completed successfully',
      demo: true,
      workflows: mockWorkflows,
      executions: mockExecutions,
      statistics: {
        total_workflows: mockWorkflows.length,
        active_workflows: mockWorkflows.filter(w => w.is_active).length,
        total_executions: mockWorkflows.reduce((sum, w) => sum + w.execution_count, 0),
        average_success_rate: mockWorkflows.reduce((sum, w) => sum + w.success_rate, 0) / mockWorkflows.length,
        most_used_workflow: mockWorkflows.reduce((max, w) => w.execution_count > max.execution_count ? w : max),
        recent_executions: mockExecutions.length
      },
      workflow_templates: [
        {
          id: 'template-lead-nurturing',
          name: 'Lead Nurturing Sequence',
          description: 'Automated follow-up sequence for new leads',
          category: 'Lead Management',
          complexity: 'Medium',
          estimated_setup_time: '15 minutes',
          use_cases: ['New lead follow-up', 'Lead qualification', 'Appointment scheduling']
        },
        {
          id: 'template-appointment-booking',
          name: 'Appointment Booking Automation',
          description: 'Streamlined appointment scheduling process',
          category: 'Sales',
          complexity: 'Simple',
          estimated_setup_time: '10 minutes',
          use_cases: ['Consultation booking', 'Demo scheduling', 'Meeting coordination']
        },
        {
          id: 'template-campaign-optimization',
          name: 'Campaign Performance Optimization',
          description: 'Automatic campaign analysis and optimization',
          category: 'Analytics',
          complexity: 'Advanced',
          estimated_setup_time: '25 minutes',
          use_cases: ['Performance monitoring', 'Campaign scaling', 'ROI optimization']
        },
        {
          id: 'template-customer-onboarding',
          name: 'Customer Onboarding Flow',
          description: 'Comprehensive new customer onboarding',
          category: 'Customer Success',
          complexity: 'Medium',
          estimated_setup_time: '20 minutes',
          use_cases: ['New customer welcome', 'Product training', 'Success tracking']
        }
      ],
      features_demonstrated: [
        '✅ Visual Workflow Builder',
        '✅ Drag & Drop Interface',
        '✅ Multiple Trigger Types',
        '✅ Conditional Logic & Branching',
        '✅ Action Automation',
        '✅ Delay & Timing Controls',
        '✅ CRM Integration Actions',
        '✅ Email & SMS Automation',
        '✅ Real-time Execution Monitoring',
        '✅ Performance Analytics',
        '✅ Template Library',
        '✅ Version Control',
        '✅ Error Handling & Retry Logic',
        '✅ Context & Variable Management'
      ],
      business_value: {
        automation_efficiency: '85% reduction in manual tasks',
        response_time_improvement: '90% faster lead response',
        conversion_rate_increase: '35% higher conversion rates',
        operational_cost_savings: '60% reduction in operational costs',
        scalability_improvement: '10x capacity without additional staff'
      }
    })

  } catch (error: any) {
    console.error('❌ Workflow demo failed:', error)
    return NextResponse.json(
      { 
        error: 'Workflow demo failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, workflowId, triggerData } = await request.json()
    
    console.log(`🎭 Demo workflow action: ${action}`)

    const responses = {
      execute_workflow: {
        success: true,
        message: 'Demo workflow execution started',
        execution: {
          id: `exec-demo-${Date.now()}`,
          workflow_id: workflowId,
          status: 'running',
          started_at: new Date().toISOString(),
          estimated_completion: new Date(Date.now() + 300000).toISOString(), // 5 minutes
          steps_completed: 0,
          total_steps: 6
        }
      },
      create_workflow: {
        success: true,
        message: 'Demo workflow created',
        workflow: {
          id: `workflow-demo-${Date.now()}`,
          name: 'Demo Workflow',
          status: 'draft',
          created_at: new Date().toISOString()
        }
      },
      test_workflow: {
        success: true,
        message: 'Demo workflow test completed',
        test_results: {
          nodes_tested: 8,
          passed: 7,
          failed: 1,
          warnings: 2,
          execution_time: '2.3 seconds',
          issues: [
            'Warning: Email template not found, using default',
            'Warning: CRM connection not configured for testing'
          ]
        }
      }
    }

    const response = responses[action as keyof typeof responses] || responses.execute_workflow

    return NextResponse.json({
      ...response,
      demo: true,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Demo workflow action failed:', error)
    return NextResponse.json(
      { 
        error: 'Demo workflow action failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
