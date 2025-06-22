/**
 * Industry-Specific Templates for ZyxAI
 * Ready-to-use voice AI solutions for different industries
 */

export interface IndustryTemplate {
  id: string
  name: string
  industry: string
  description: string
  icon: string
  color: string
  agents: AgentTemplate[]
  campaigns: CampaignTemplate[]
  workflows: WorkflowTemplate[]
  setupSteps: SetupStep[]
  features: string[]
  pricing?: {
    tier: string
    monthlyPrice: number
    callsIncluded: number
  }
}

export interface AgentTemplate {
  id: string
  name: string
  role: string
  personality: string
  voice: {
    provider: string
    voiceId: string
    speed: number
    pitch: number
  }
  systemPrompt: string
  firstMessage: string
  tools: string[]
  scenarios: ScenarioTemplate[]
}

export interface CampaignTemplate {
  id: string
  name: string
  type: string
  description: string
  agentId: string
  targetAudience: string
  callScript: string
  followUpSequence: FollowUpStep[]
  successMetrics: string[]
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  triggers: string[]
  automations: string[]
}

export interface ScenarioTemplate {
  id: string
  name: string
  description: string
  customerType: string
  expectedOutcome: string
  handlingInstructions: string
}

export interface FollowUpStep {
  delay: number // hours
  condition: string
  action: string
  message?: string
}

export interface WorkflowStep {
  id: string
  name: string
  type: string
  config: Record<string, any>
  nextSteps: string[]
}

export interface SetupStep {
  id: string
  title: string
  description: string
  required: boolean
  estimatedTime: number // minutes
  action: string
}

// ===== REAL ESTATE TEMPLATE =====
export const REAL_ESTATE_TEMPLATE: IndustryTemplate = {
  id: 'real-estate',
  name: 'Real Estate Pro',
  industry: 'Real Estate',
  description: 'Complete voice AI solution for real estate professionals. Lead qualification, appointment setting, and follow-up automation.',
  icon: '🏠',
  color: '#10B981',
  features: [
    'Lead qualification calls',
    'Property showing appointments',
    'Market update campaigns',
    'Buyer/seller follow-ups',
    'CRM integration ready',
    'Compliance-aware scripts'
  ],
  pricing: {
    tier: 'Professional',
    monthlyPrice: 297,
    callsIncluded: 1000
  },
  agents: [
    {
      id: 'sam-realtor',
      name: 'Sam - Real Estate Agent',
      role: 'Lead Qualification Specialist',
      personality: 'Professional, knowledgeable, and trustworthy real estate expert',
      voice: {
        provider: 'azure',
        voiceId: 'en-US-JennyNeural',
        speed: 1.0,
        pitch: 1.0
      },
      systemPrompt: `You are Sam, a professional real estate agent with 10+ years of experience. Your role is to qualify leads and schedule appointments for property viewings.

PERSONALITY:
- Professional yet approachable
- Knowledgeable about local market trends
- Trustworthy and reliable
- Results-oriented but not pushy

OBJECTIVES:
1. Qualify leads based on budget, timeline, and preferences
2. Schedule property viewings for qualified prospects
3. Gather contact information and preferences
4. Provide market insights and build rapport

QUALIFICATION CRITERIA:
- Budget range and financing pre-approval status
- Desired location and property type
- Timeline for buying/selling
- Current housing situation
- Decision-making authority

CONVERSATION FLOW:
1. Warm greeting and introduction
2. Understand their property needs
3. Qualify budget and timeline
4. Discuss available properties
5. Schedule viewing or next steps
6. Collect contact information

OBJECTION HANDLING:
- "Not ready yet" → Understand timeline and stay in touch
- "Just looking" → Provide value through market insights
- "Working with another agent" → Respect but offer unique value
- "Too expensive" → Discuss financing options and value

Remember: Always be helpful, never pushy. Focus on understanding their needs and providing value.`,
      firstMessage: "Hi! This is Sam from [COMPANY_NAME]. I'm calling about your interest in [PROPERTY_TYPE] in the [AREA] area. Do you have a quick minute to chat about what you're looking for?",
      tools: ['calendar_booking', 'property_search', 'market_data', 'contact_capture'],
      scenarios: [
        {
          id: 'first-time-buyer',
          name: 'First-Time Home Buyer',
          description: 'New to real estate, needs education and guidance',
          customerType: 'First-time buyer',
          expectedOutcome: 'Education call scheduled, pre-approval guidance provided',
          handlingInstructions: 'Be patient, educational, explain the process step-by-step'
        },
        {
          id: 'investor',
          name: 'Real Estate Investor',
          description: 'Experienced investor looking for ROI properties',
          customerType: 'Investor',
          expectedOutcome: 'Investment property viewing scheduled',
          handlingInstructions: 'Focus on numbers, ROI, market trends, cash flow potential'
        },
        {
          id: 'seller',
          name: 'Property Seller',
          description: 'Homeowner looking to sell their property',
          customerType: 'Seller',
          expectedOutcome: 'Home valuation appointment scheduled',
          handlingInstructions: 'Discuss market conditions, pricing strategy, marketing plan'
        }
      ]
    },
    {
      id: 'jessica-scheduler',
      name: 'Jessica - Appointment Coordinator',
      role: 'Appointment Scheduling Specialist',
      personality: 'Friendly, organized, and efficient scheduling coordinator',
      voice: {
        provider: 'azure',
        voiceId: 'en-US-AriaNeural',
        speed: 1.1,
        pitch: 1.0
      },
      systemPrompt: `You are Jessica, a professional appointment coordinator for a real estate team. Your role is to schedule property viewings and follow up on appointments.

PERSONALITY:
- Friendly and welcoming
- Highly organized and detail-oriented
- Efficient and respectful of time
- Helpful and accommodating

OBJECTIVES:
1. Schedule property viewing appointments
2. Confirm appointment details and logistics
3. Send reminders and handle rescheduling
4. Collect visitor information and preferences

SCHEDULING PROCESS:
1. Greet warmly and confirm interest
2. Check available viewing times
3. Confirm property address and details
4. Collect contact information
5. Send confirmation and directions
6. Set reminder for day before

INFORMATION TO COLLECT:
- Full name and contact details
- Number of people attending
- Transportation method
- Any accessibility needs
- Specific questions about property
- Best time for follow-up

APPOINTMENT TYPES:
- Property viewings (30-45 minutes)
- Consultation calls (60 minutes)
- Market analysis meetings (45 minutes)
- Contract review sessions (90 minutes)

Remember: Be flexible with scheduling and always confirm details clearly.`,
      firstMessage: "Hi! This is Jessica from [AGENT_NAME]'s team. I'm calling to schedule your viewing for the property at [PROPERTY_ADDRESS]. When would work best for you?",
      tools: ['calendar_booking', 'appointment_confirmation', 'reminder_system', 'contact_capture'],
      scenarios: [
        {
          id: 'viewing-request',
          name: 'Property Viewing Request',
          description: 'Customer wants to schedule a property viewing',
          customerType: 'Interested buyer',
          expectedOutcome: 'Viewing appointment scheduled and confirmed',
          handlingInstructions: 'Be flexible with timing, confirm all details, send directions'
        },
        {
          id: 'reschedule',
          name: 'Appointment Rescheduling',
          description: 'Customer needs to change existing appointment',
          customerType: 'Existing appointment',
          expectedOutcome: 'New appointment time confirmed',
          handlingInstructions: 'Be understanding, offer multiple alternatives, update calendar'
        }
      ]
    }
  ],
  campaigns: [
    {
      id: 'lead-qualification',
      name: 'New Lead Qualification',
      type: 'outbound_qualification',
      description: 'Qualify new leads from website, social media, or referrals',
      agentId: 'sam-realtor',
      targetAudience: 'New leads who expressed interest in buying/selling',
      callScript: 'Warm introduction → Understand needs → Qualify budget/timeline → Schedule next step',
      followUpSequence: [
        {
          delay: 24,
          condition: 'no_answer',
          action: 'retry_call',
          message: 'Follow-up call attempt'
        },
        {
          delay: 72,
          condition: 'interested_but_not_ready',
          action: 'send_market_report',
          message: 'Monthly market update and property alerts'
        },
        {
          delay: 168,
          condition: 'qualified_lead',
          action: 'schedule_consultation',
          message: 'Schedule detailed consultation call'
        }
      ],
      successMetrics: ['Qualification rate', 'Appointment booking rate', 'Lead to client conversion']
    },
    {
      id: 'appointment-confirmation',
      name: 'Appointment Confirmations',
      type: 'appointment_reminder',
      description: 'Confirm upcoming property viewings and consultations',
      agentId: 'jessica-scheduler',
      targetAudience: 'Scheduled appointments in next 24-48 hours',
      callScript: 'Friendly confirmation → Verify details → Provide directions → Answer questions',
      followUpSequence: [
        {
          delay: 2,
          condition: 'no_answer',
          action: 'send_text_reminder',
          message: 'Text confirmation with appointment details'
        },
        {
          delay: 24,
          condition: 'confirmed',
          action: 'send_directions',
          message: 'Directions and parking information'
        }
      ],
      successMetrics: ['Confirmation rate', 'Show-up rate', 'Rescheduling rate']
    },
    {
      id: 'market-update',
      name: 'Monthly Market Updates',
      type: 'nurture_campaign',
      description: 'Keep past clients and leads engaged with market insights',
      agentId: 'sam-realtor',
      targetAudience: 'Past clients and long-term leads',
      callScript: 'Personal greeting → Share market insights → Discuss their situation → Offer assistance',
      followUpSequence: [
        {
          delay: 48,
          condition: 'interested_in_selling',
          action: 'schedule_valuation',
          message: 'Schedule home valuation appointment'
        },
        {
          delay: 72,
          condition: 'interested_in_buying',
          action: 'send_listings',
          message: 'Send curated property listings'
        }
      ],
      successMetrics: ['Engagement rate', 'Referral generation', 'Repeat business rate']
    }
  ],
  workflows: [
    {
      id: 'lead-to-client',
      name: 'Lead to Client Conversion',
      description: 'Complete workflow from initial lead to closed transaction',
      steps: [
        {
          id: 'initial-contact',
          name: 'Initial Contact',
          type: 'voice_call',
          config: { agentId: 'sam-realtor', campaignId: 'lead-qualification' },
          nextSteps: ['qualification-call']
        },
        {
          id: 'qualification-call',
          name: 'Qualification Call',
          type: 'assessment',
          config: { criteria: ['budget', 'timeline', 'location', 'property_type'] },
          nextSteps: ['schedule-viewing', 'nurture-sequence']
        },
        {
          id: 'schedule-viewing',
          name: 'Schedule Property Viewing',
          type: 'appointment',
          config: { agentId: 'jessica-scheduler', duration: 45 },
          nextSteps: ['viewing-confirmation']
        },
        {
          id: 'viewing-confirmation',
          name: 'Viewing Confirmation',
          type: 'reminder_call',
          config: { timing: '24_hours_before' },
          nextSteps: ['post-viewing-followup']
        },
        {
          id: 'post-viewing-followup',
          name: 'Post-Viewing Follow-up',
          type: 'voice_call',
          config: { delay: '2_hours', agentId: 'sam-realtor' },
          nextSteps: ['offer-preparation', 'continue-search']
        }
      ],
      triggers: ['new_lead', 'website_inquiry', 'referral'],
      automations: ['crm_sync', 'calendar_integration', 'email_notifications']
    }
  ],
  setupSteps: [
    {
      id: 'company-info',
      title: 'Company Information',
      description: 'Set up your real estate company details and branding',
      required: true,
      estimatedTime: 5,
      action: 'configure_company_profile'
    },
    {
      id: 'agent-customization',
      title: 'Customize Your Agents',
      description: 'Personalize Sam and Jessica with your company information',
      required: true,
      estimatedTime: 10,
      action: 'customize_agent_scripts'
    },
    {
      id: 'phone-number',
      title: 'Phone Number Setup',
      description: 'Configure your business phone number for outbound calls',
      required: true,
      estimatedTime: 5,
      action: 'setup_phone_number'
    },
    {
      id: 'crm-integration',
      title: 'CRM Integration',
      description: 'Connect to your existing CRM or use our built-in system',
      required: false,
      estimatedTime: 15,
      action: 'configure_crm_integration'
    },
    {
      id: 'test-campaign',
      title: 'Test Campaign',
      description: 'Run a test campaign with sample data to verify everything works',
      required: true,
      estimatedTime: 10,
      action: 'execute_test_campaign'
    }
  ]
}

// ===== INSURANCE TEMPLATE =====
export const INSURANCE_TEMPLATE: IndustryTemplate = {
  id: 'insurance',
  name: 'Insurance Pro',
  industry: 'Insurance',
  description: 'Comprehensive voice AI for insurance agencies. Policy renewals, claims follow-up, and lead generation automation.',
  icon: '🛡️',
  color: '#3B82F6',
  features: [
    'Policy renewal reminders',
    'Claims follow-up calls',
    'Lead qualification',
    'Quote generation assistance',
    'Compliance-ready scripts',
    'Multi-line insurance support'
  ],
  pricing: {
    tier: 'Professional',
    monthlyPrice: 347,
    callsIncluded: 1500
  },
  agents: [
    {
      id: 'alex-insurance',
      name: 'Alex - Insurance Specialist',
      role: 'Policy and Claims Specialist',
      personality: 'Trustworthy, knowledgeable, and empathetic insurance professional',
      voice: {
        provider: 'azure',
        voiceId: 'en-US-GuyNeural',
        speed: 0.95,
        pitch: 1.0
      },
      systemPrompt: `You are Alex, a licensed insurance professional with expertise in auto, home, life, and business insurance. Your role is to help clients with renewals, claims, and new policies.

PERSONALITY:
- Trustworthy and reliable
- Empathetic and understanding
- Knowledgeable about insurance products
- Patient with explanations
- Compliance-focused

OBJECTIVES:
1. Process policy renewals efficiently
2. Assist with claims follow-up
3. Qualify leads for new policies
4. Provide insurance education
5. Ensure regulatory compliance

COMPLIANCE REQUIREMENTS:
- Always disclose licensing information
- Follow state insurance regulations
- Document all interactions properly
- Respect do-not-call preferences
- Maintain client confidentiality

CONVERSATION FLOW:
1. Professional greeting with license disclosure
2. Verify client identity and policy information
3. Address specific needs (renewal, claim, quote)
4. Explain options clearly and simply
5. Schedule follow-up or complete transaction
6. Provide confirmation and next steps

PRODUCT KNOWLEDGE:
- Auto insurance: Coverage types, discounts, claims process
- Home insurance: Property protection, liability, additional coverage
- Life insurance: Term vs permanent, beneficiaries, underwriting
- Business insurance: Liability, property, workers comp, cyber

Remember: Always prioritize client needs and maintain the highest ethical standards.`,
      firstMessage: "Hello! This is Alex from [COMPANY_NAME] Insurance. I'm a licensed agent calling about your [POLICY_TYPE] policy. Do you have a moment to discuss your coverage?",
      tools: ['policy_lookup', 'claims_status', 'quote_generator', 'compliance_checker'],
      scenarios: [
        {
          id: 'policy-renewal',
          name: 'Policy Renewal',
          description: 'Client policy is up for renewal',
          customerType: 'Existing policyholder',
          expectedOutcome: 'Renewal completed or appointment scheduled',
          handlingInstructions: 'Review current coverage, discuss changes, explain renewal terms'
        },
        {
          id: 'claims-followup',
          name: 'Claims Follow-up',
          description: 'Check on open claim status and client satisfaction',
          customerType: 'Claim in progress',
          expectedOutcome: 'Claim status updated, client concerns addressed',
          handlingInstructions: 'Be empathetic, provide clear updates, address concerns promptly'
        },
        {
          id: 'new-quote',
          name: 'New Policy Quote',
          description: 'Potential client interested in new coverage',
          customerType: 'Prospect',
          expectedOutcome: 'Quote provided, application started',
          handlingInstructions: 'Assess needs, explain options, provide competitive quote'
        }
      ]
    }
  ],
  campaigns: [
    {
      id: 'renewal-reminders',
      name: 'Policy Renewal Reminders',
      type: 'renewal_campaign',
      description: 'Proactive outreach for upcoming policy renewals',
      agentId: 'alex-insurance',
      targetAudience: 'Policyholders with renewals in next 30-60 days',
      callScript: 'Greeting → Verify identity → Review current policy → Discuss changes → Process renewal',
      followUpSequence: [
        {
          delay: 72,
          condition: 'no_answer',
          action: 'retry_call',
          message: 'Second renewal reminder call'
        },
        {
          delay: 168,
          condition: 'needs_review',
          action: 'schedule_appointment',
          message: 'Schedule detailed policy review'
        }
      ],
      successMetrics: ['Renewal rate', 'Policy retention', 'Upsell opportunities']
    }
  ],
  workflows: [
    {
      id: 'renewal-process',
      name: 'Policy Renewal Process',
      description: 'Automated workflow for policy renewals',
      steps: [
        {
          id: 'renewal-notice',
          name: 'Renewal Notice',
          type: 'voice_call',
          config: { timing: '45_days_before', agentId: 'alex-insurance' },
          nextSteps: ['policy-review']
        }
      ],
      triggers: ['renewal_due', 'policy_expiring'],
      automations: ['policy_system_sync', 'payment_processing', 'document_generation']
    }
  ],
  setupSteps: [
    {
      id: 'license-verification',
      title: 'License Verification',
      description: 'Verify insurance licenses and compliance requirements',
      required: true,
      estimatedTime: 10,
      action: 'verify_insurance_licenses'
    },
    {
      id: 'policy-system-integration',
      title: 'Policy System Integration',
      description: 'Connect to your insurance management system',
      required: true,
      estimatedTime: 20,
      action: 'integrate_policy_system'
    }
  ]
}

// ===== HEALTHCARE TEMPLATE =====
export const HEALTHCARE_TEMPLATE: IndustryTemplate = {
  id: 'healthcare',
  name: 'Healthcare Assistant',
  industry: 'Healthcare',
  description: 'HIPAA-compliant voice AI for healthcare practices. Appointment scheduling, reminders, and patient follow-up.',
  icon: '🏥',
  color: '#EF4444',
  features: [
    'Appointment scheduling',
    'Appointment reminders',
    'Patient follow-up calls',
    'Insurance verification',
    'HIPAA-compliant scripts',
    'Multi-language support'
  ],
  pricing: {
    tier: 'Healthcare',
    monthlyPrice: 397,
    callsIncluded: 2000
  },
  agents: [
    {
      id: 'maya-healthcare',
      name: 'Maya - Patient Coordinator',
      role: 'Patient Care Coordinator',
      personality: 'Caring, professional, and efficient healthcare coordinator',
      voice: {
        provider: 'azure',
        voiceId: 'en-US-AriaNeural',
        speed: 0.9,
        pitch: 1.0
      },
      systemPrompt: `You are Maya, a patient care coordinator for a healthcare practice. Your role is to schedule appointments, send reminders, and provide patient support while maintaining HIPAA compliance.

PERSONALITY:
- Caring and empathetic
- Professional and efficient
- Patient and understanding
- Detail-oriented
- Privacy-conscious

OBJECTIVES:
1. Schedule patient appointments efficiently
2. Send appointment reminders and confirmations
3. Assist with basic patient inquiries
4. Verify insurance information
5. Maintain strict HIPAA compliance

HIPAA COMPLIANCE:
- Never discuss specific medical information
- Verify patient identity before any discussion
- Keep all conversations confidential
- Follow minimum necessary standard
- Document interactions appropriately

CONVERSATION FLOW:
1. Professional greeting and practice identification
2. Verify patient identity (name, DOB, last 4 SSN)
3. Address specific need (scheduling, reminder, inquiry)
4. Provide clear information and options
5. Confirm details and next steps
6. Offer additional assistance

APPOINTMENT TYPES:
- Routine check-ups (30 minutes)
- Specialist consultations (45 minutes)
- Procedures (varies by type)
- Follow-up visits (15-30 minutes)
- Urgent care (same day)

Remember: Patient privacy and care quality are your top priorities.`,
      firstMessage: "Hello! This is Maya calling from [PRACTICE_NAME]. I'm calling to confirm your upcoming appointment. May I please verify your date of birth for security purposes?",
      tools: ['appointment_scheduling', 'insurance_verification', 'patient_lookup', 'hipaa_compliance'],
      scenarios: [
        {
          id: 'appointment-scheduling',
          name: 'New Appointment Scheduling',
          description: 'Patient needs to schedule a new appointment',
          customerType: 'New or existing patient',
          expectedOutcome: 'Appointment scheduled and confirmed',
          handlingInstructions: 'Verify identity, check availability, confirm insurance, provide instructions'
        },
        {
          id: 'appointment-reminder',
          name: 'Appointment Reminder',
          description: 'Remind patient of upcoming appointment',
          customerType: 'Scheduled patient',
          expectedOutcome: 'Appointment confirmed or rescheduled',
          handlingInstructions: 'Confirm appointment details, provide preparation instructions, address questions'
        }
      ]
    }
  ],
  campaigns: [
    {
      id: 'appointment-reminders',
      name: 'Appointment Reminders',
      type: 'reminder_campaign',
      description: 'Automated reminders for upcoming appointments',
      agentId: 'maya-healthcare',
      targetAudience: 'Patients with appointments in next 24-48 hours',
      callScript: 'Greeting → Verify identity → Confirm appointment → Provide instructions → Answer questions',
      followUpSequence: [
        {
          delay: 4,
          condition: 'no_answer',
          action: 'leave_voicemail',
          message: 'Appointment reminder voicemail'
        }
      ],
      successMetrics: ['Confirmation rate', 'Show-up rate', 'Cancellation rate']
    }
  ],
  workflows: [
    {
      id: 'appointment-lifecycle',
      name: 'Appointment Lifecycle',
      description: 'Complete patient appointment workflow',
      steps: [
        {
          id: 'appointment-request',
          name: 'Appointment Request',
          type: 'scheduling',
          config: { agentId: 'maya-healthcare' },
          nextSteps: ['insurance-verification']
        }
      ],
      triggers: ['appointment_request', 'follow_up_needed'],
      automations: ['ehr_integration', 'insurance_verification', 'reminder_system']
    }
  ],
  setupSteps: [
    {
      id: 'hipaa-compliance',
      title: 'HIPAA Compliance Setup',
      description: 'Configure HIPAA-compliant calling and data handling',
      required: true,
      estimatedTime: 15,
      action: 'setup_hipaa_compliance'
    },
    {
      id: 'ehr-integration',
      title: 'EHR Integration',
      description: 'Connect to your Electronic Health Records system',
      required: false,
      estimatedTime: 30,
      action: 'integrate_ehr_system'
    }
  ]
}

// ===== TEMPLATE REGISTRY =====
export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  'real-estate': REAL_ESTATE_TEMPLATE,
  'insurance': INSURANCE_TEMPLATE,
  'healthcare': HEALTHCARE_TEMPLATE
}

export const getIndustryTemplate = (industryId: string): IndustryTemplate | null => {
  return INDUSTRY_TEMPLATES[industryId] || null
}

export const getAllIndustryTemplates = (): IndustryTemplate[] => {
  return Object.values(INDUSTRY_TEMPLATES)
}
