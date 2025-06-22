import realEstateAgents from '@/lib/industry-solutions/RealEstateAgents'
import healthcareAgents from '@/lib/industry-solutions/HealthcareAgents'
import insuranceAgents from '@/lib/industry-solutions/InsuranceAgents'
import financialServicesAgents from '@/lib/industry-solutions/FinancialServicesAgents'
import ecommerceAgents from '@/lib/industry-solutions/EcommerceAgents'

export interface IndustryAgent {
  id: string
  name: string
  industry: string
  specialization: string
  description: string
  voice: {
    provider: string
    voiceId: string
    stability: number
    similarityBoost: number
    style: number
    useSpeakerBoost?: boolean
  }
  systemPrompt: string
  callScripts: {
    opening: string
    [key: string]: any
  }
  workflows?: any[]
}

export interface IndustryWorkflow {
  name: string
  industry: string
  description: string
  trigger: {
    type: string
    conditions?: any
    schedule?: string
  }
  steps: Array<{
    delay: string
    action: string
    agent?: string
    template?: string
    condition?: string
    parameters?: any
  }>
}

export interface IndustryTemplate {
  subject?: string
  template: string
  message?: string
  attachments?: string[]
  personalized?: boolean
  hipaa_compliant?: boolean
  compliance_required?: boolean
}

export class IndustrySolutionsManager {
  private static industries = {
    real_estate: realEstateAgents,
    healthcare: healthcareAgents,
    insurance: insuranceAgents,
    financial_services: financialServicesAgents,
    ecommerce: ecommerceAgents
  }

  /**
   * Get all available industries
   */
  static getAvailableIndustries(): Array<{
    id: string
    name: string
    description: string
    agentCount: number
    workflowCount: number
  }> {
    return [
      {
        id: 'real_estate',
        name: 'Real Estate',
        description: 'Lead generation, listing acquisition, buyer representation, and investment property specialists',
        agentCount: Object.keys(this.industries.real_estate.agents).length,
        workflowCount: Object.keys(this.industries.real_estate.workflows).length
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'HIPAA-compliant appointment scheduling, patient follow-up, and wellness program coordination',
        agentCount: Object.keys(this.industries.healthcare.agents).length,
        workflowCount: Object.keys(this.industries.healthcare.workflows).length
      },
      {
        id: 'insurance',
        name: 'Insurance',
        description: 'Life, auto, and health insurance specialists with compliance-ready workflows',
        agentCount: Object.keys(this.industries.insurance.agents).length,
        workflowCount: Object.keys(this.industries.insurance.workflows).length
      },
      {
        id: 'financial_services',
        name: 'Financial Services',
        description: 'Financial planning, mortgage lending, and investment management with regulatory compliance',
        agentCount: Object.keys(this.industries.financial_services.agents).length,
        workflowCount: Object.keys(this.industries.financial_services.workflows).length
      },
      {
        id: 'ecommerce',
        name: 'E-commerce',
        description: 'Customer support, sales recovery, and product consultation for online retailers',
        agentCount: Object.keys(this.industries.ecommerce.agents).length,
        workflowCount: Object.keys(this.industries.ecommerce.workflows).length
      }
    ]
  }

  /**
   * Get agents for a specific industry
   */
  static getIndustryAgents(industry: string): IndustryAgent[] {
    const industryData = this.industries[industry as keyof typeof this.industries]
    if (!industryData) return []

    return Object.values(industryData.agents)
  }

  /**
   * Get workflows for a specific industry
   */
  static getIndustryWorkflows(industry: string): IndustryWorkflow[] {
    const industryData = this.industries[industry as keyof typeof this.industries]
    if (!industryData) return []

    return Object.values(industryData.workflows)
  }

  /**
   * Get templates for a specific industry
   */
  static getIndustryTemplates(industry: string): {
    emails: Record<string, IndustryTemplate>
    sms: Record<string, IndustryTemplate>
  } {
    const industryData = this.industries[industry as keyof typeof this.industries]
    if (!industryData) return { emails: {}, sms: {} }

    return industryData.templates
  }

  /**
   * Get a specific agent by ID
   */
  static getAgentById(agentId: string): IndustryAgent | null {
    for (const industry of Object.values(this.industries)) {
      const agent = Object.values(industry.agents).find(a => a.id === agentId)
      if (agent) return agent
    }
    return null
  }

  /**
   * Get agents by specialization across all industries
   */
  static getAgentsBySpecialization(specialization: string): IndustryAgent[] {
    const agents: IndustryAgent[] = []
    
    for (const industry of Object.values(this.industries)) {
      const industryAgents = Object.values(industry.agents).filter(
        a => a.specialization === specialization
      )
      agents.push(...industryAgents)
    }
    
    return agents
  }

  /**
   * Search agents by keyword
   */
  static searchAgents(keyword: string): IndustryAgent[] {
    const agents: IndustryAgent[] = []
    const searchTerm = keyword.toLowerCase()
    
    for (const industry of Object.values(this.industries)) {
      const industryAgents = Object.values(industry.agents).filter(agent =>
        agent.name.toLowerCase().includes(searchTerm) ||
        agent.description.toLowerCase().includes(searchTerm) ||
        agent.specialization.toLowerCase().includes(searchTerm) ||
        agent.industry.toLowerCase().includes(searchTerm)
      )
      agents.push(...industryAgents)
    }
    
    return agents
  }

  /**
   * Get recommended agents for a business type
   */
  static getRecommendedAgents(businessType: string, useCase: string): IndustryAgent[] {
    const recommendations: Record<string, string[]> = {
      'real_estate_agency': ['real-estate-lead-gen', 'real-estate-listing', 'real-estate-buyers'],
      'medical_practice': ['healthcare-scheduler', 'healthcare-followup', 'healthcare-wellness'],
      'insurance_agency': ['insurance-life', 'insurance-auto', 'insurance-health'],
      'financial_firm': ['financial-advisor', 'mortgage-loan-officer', 'investment-advisor'],
      'online_store': ['ecommerce-support', 'ecommerce-recovery', 'ecommerce-product']
    }

    const agentIds = recommendations[businessType] || []
    return agentIds.map(id => this.getAgentById(id)).filter(Boolean) as IndustryAgent[]
  }

  /**
   * Create industry-specific campaign
   */
  static createIndustryCampaign(
    industry: string,
    campaignType: string,
    configuration: any
  ): {
    agents: IndustryAgent[]
    workflows: IndustryWorkflow[]
    templates: any
    configuration: any
  } {
    const agents = this.getIndustryAgents(industry)
    const workflows = this.getIndustryWorkflows(industry)
    const templates = this.getIndustryTemplates(industry)

    // Filter based on campaign type
    const relevantAgents = agents.filter(agent => {
      switch (campaignType) {
        case 'lead_generation':
          return agent.specialization.includes('lead') || agent.specialization.includes('generation')
        case 'customer_support':
          return agent.specialization.includes('support') || agent.specialization.includes('service')
        case 'appointment_scheduling':
          return agent.specialization.includes('scheduling') || agent.specialization.includes('appointment')
        case 'follow_up':
          return agent.specialization.includes('follow') || agent.specialization.includes('nurturing')
        default:
          return true
      }
    })

    const relevantWorkflows = workflows.filter(workflow => {
      return workflow.name.toLowerCase().includes(campaignType.replace('_', ' '))
    })

    return {
      agents: relevantAgents,
      workflows: relevantWorkflows,
      templates,
      configuration: {
        ...configuration,
        industry,
        campaignType,
        compliance: this.getIndustryCompliance(industry)
      }
    }
  }

  /**
   * Get compliance requirements for industry
   */
  static getIndustryCompliance(industry: string): {
    regulations: string[]
    requirements: string[]
    restrictions: string[]
  } {
    const compliance: Record<string, any> = {
      healthcare: {
        regulations: ['HIPAA', 'HITECH Act', 'State Medical Board Regulations'],
        requirements: [
          'Patient identity verification required',
          'No medical advice over phone',
          'Secure communication channels only',
          'Documentation of all interactions'
        ],
        restrictions: [
          'Cannot discuss specific medical conditions',
          'Cannot provide medical diagnoses',
          'Cannot share patient information without authorization',
          'Must use HIPAA-compliant messaging'
        ]
      },
      financial_services: {
        regulations: ['SEC', 'FINRA', 'CFPB', 'State Licensing Requirements'],
        requirements: [
          'License disclosure required',
          'Risk disclosures mandatory',
          'Fee structure transparency',
          'Suitability determinations',
          'Documentation of advice given'
        ],
        restrictions: [
          'Cannot guarantee investment returns',
          'Cannot provide advice without proper licensing',
          'Must follow fiduciary standards',
          'Cannot make unsuitable recommendations'
        ]
      },
      insurance: {
        regulations: ['State Insurance Departments', 'NAIC Guidelines'],
        requirements: [
          'Licensed agent disclosure',
          'State-specific regulations compliance',
          'Clear policy terms explanation',
          'Proper application procedures'
        ],
        restrictions: [
          'Cannot sell without proper licensing',
          'Cannot misrepresent policy terms',
          'Must follow state-specific rules',
          'Cannot discriminate in underwriting'
        ]
      },
      real_estate: {
        regulations: ['State Real Estate Commissions', 'Fair Housing Act', 'RESPA'],
        requirements: [
          'Licensed agent disclosure',
          'Fair housing compliance',
          'Property disclosure requirements',
          'Contract and agreement documentation'
        ],
        restrictions: [
          'Cannot discriminate based on protected classes',
          'Cannot provide legal advice',
          'Must disclose agency relationships',
          'Cannot misrepresent property information'
        ]
      },
      ecommerce: {
        regulations: ['FTC Guidelines', 'CAN-SPAM Act', 'TCPA', 'State Consumer Protection Laws'],
        requirements: [
          'Clear return and refund policies',
          'Honest advertising and marketing',
          'Secure payment processing',
          'Privacy policy compliance'
        ],
        restrictions: [
          'Cannot make false claims about products',
          'Cannot spam customers',
          'Must honor advertised prices',
          'Cannot charge without authorization'
        ]
      }
    }

    return compliance[industry] || {
      regulations: [],
      requirements: [],
      restrictions: []
    }
  }

  /**
   * Validate industry configuration
   */
  static validateIndustryConfiguration(
    industry: string,
    configuration: any
  ): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if industry exists
    if (!this.industries[industry as keyof typeof this.industries]) {
      errors.push(`Industry '${industry}' is not supported`)
    }

    // Industry-specific validation
    switch (industry) {
      case 'healthcare':
        if (!configuration.hipaa_compliance) {
          errors.push('HIPAA compliance configuration is required for healthcare')
        }
        if (!configuration.patient_verification) {
          warnings.push('Patient verification process should be configured')
        }
        break

      case 'financial_services':
        if (!configuration.licensing_info) {
          errors.push('Licensing information is required for financial services')
        }
        if (!configuration.risk_disclosures) {
          errors.push('Risk disclosures must be configured')
        }
        break

      case 'insurance':
        if (!configuration.state_licensing) {
          errors.push('State licensing information is required for insurance')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get industry-specific metrics and KPIs
   */
  static getIndustryMetrics(industry: string): {
    primaryKPIs: string[]
    secondaryKPIs: string[]
    benchmarks: Record<string, number>
  } {
    const metrics: Record<string, any> = {
      real_estate: {
        primaryKPIs: ['Lead Conversion Rate', 'Listing Appointments Scheduled', 'Buyer Consultations Booked'],
        secondaryKPIs: ['Call Connect Rate', 'Email Open Rate', 'Follow-up Response Rate'],
        benchmarks: {
          lead_conversion_rate: 15,
          appointment_booking_rate: 25,
          call_connect_rate: 35
        }
      },
      healthcare: {
        primaryKPIs: ['Appointment Confirmation Rate', 'No-Show Reduction', 'Patient Satisfaction'],
        secondaryKPIs: ['Call Answer Rate', 'Callback Response Time', 'Preventive Care Uptake'],
        benchmarks: {
          appointment_confirmation_rate: 85,
          no_show_rate: 15,
          patient_satisfaction: 90
        }
      },
      insurance: {
        primaryKPIs: ['Quote Conversion Rate', 'Policy Binding Rate', 'Customer Retention'],
        secondaryKPIs: ['Lead Response Time', 'Quote Delivery Rate', 'Cross-sell Success'],
        benchmarks: {
          quote_conversion_rate: 20,
          policy_binding_rate: 60,
          customer_retention_rate: 85
        }
      },
      financial_services: {
        primaryKPIs: ['Consultation Booking Rate', 'Asset Gathering', 'Client Retention'],
        secondaryKPIs: ['Lead Qualification Rate', 'Referral Generation', 'Compliance Score'],
        benchmarks: {
          consultation_booking_rate: 30,
          client_retention_rate: 90,
          referral_rate: 25
        }
      },
      ecommerce: {
        primaryKPIs: ['Cart Recovery Rate', 'Customer Satisfaction', 'Repeat Purchase Rate'],
        secondaryKPIs: ['Support Ticket Resolution Time', 'Upsell Success Rate', 'Return Rate'],
        benchmarks: {
          cart_recovery_rate: 15,
          customer_satisfaction: 85,
          repeat_purchase_rate: 40
        }
      }
    }

    return metrics[industry] || {
      primaryKPIs: [],
      secondaryKPIs: [],
      benchmarks: {}
    }
  }
}

export default IndustrySolutionsManager
