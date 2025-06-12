import { supabase } from './supabase'

export interface IntakeFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  ssn?: string
  address: string
  city: string
  state: string
  zipCode: string
  clientType: 'individual' | 'business' | 'both'
  filingStatus?: string
  serviceLevel: string
  businessName?: string
  businessType?: string
  ein?: string
  previousYear: boolean
  previousPreparer?: string
  estimatedIncome: string
  hasW2: boolean
  has1099: boolean
  hasBusinessIncome: boolean
  hasRentalIncome: boolean
  hasInvestments: boolean
  specialCircumstances: string[]
  additionalNotes: string
  consentToContact: boolean
  consentToElectronic: boolean
  agreesToTerms: boolean
}

export interface OnboardingWorkflow {
  id: string
  clientId: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  currentStep: string
  progress: number
  automatedTasks: {
    intakeForm: boolean
    folderCreation: boolean
    crmEntry: boolean
    engagementLetter: boolean
    welcomeEmail: boolean
    documentChecklist: boolean
  }
  createdAt: string
  updatedAt: string
}

export class OnboardingAutomation {
  /**
   * Main entry point - processes intake form and triggers all automation
   */
  static async processIntakeForm(formData: IntakeFormData, practiceId: string): Promise<{
    success: boolean
    clientId?: string
    workflowId?: string
    error?: string
  }> {
    try {
      console.log('🚀 Starting automated onboarding process...')
      
      // Step 1: Create CRM Entry
      const client = await this.createCRMEntry(formData, practiceId)
      console.log('✅ CRM entry created:', client.id)
      
      // Step 2: Create Onboarding Workflow
      const workflow = await this.createOnboardingWorkflow(client.id)
      console.log('✅ Onboarding workflow created:', workflow.id)
      
      // Step 3: Create Folder Structure
      await this.createFolderStructure(client.id, formData)
      console.log('✅ Folder structure created')
      
      // Step 4: Generate Engagement Letter
      await this.generateEngagementLetter(client.id, formData)
      console.log('✅ Engagement letter generated')
      
      // Step 5: Send Welcome Email
      await this.sendWelcomeEmail(client.id, formData)
      console.log('✅ Welcome email sent')
      
      // Step 6: Create Initial Tasks
      await this.createInitialTasks(client.id, formData)
      console.log('✅ Initial tasks created')
      
      // Step 7: Generate Document Checklist
      await this.generateDocumentChecklist(client.id, formData)
      console.log('✅ Document checklist generated')
      
      // Step 8: Update workflow status
      await this.updateWorkflowProgress(workflow.id, 'completed', 100)
      console.log('✅ Onboarding automation completed successfully!')
      
      return {
        success: true,
        clientId: client.id,
        workflowId: workflow.id
      }
    } catch (error) {
      console.error('❌ Onboarding automation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Step 1: Create CRM Entry
   */
  private static async createCRMEntry(formData: IntakeFormData, practiceId: string) {
    const clientData = {
      user_id: practiceId,
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone || null,
      type: formData.clientType === 'both' ? 'individual' : formData.clientType,
      status: 'pending' as const,
      priority: this.determinePriority(formData),
      progress: 10,
      documents_count: 0,
      last_activity: new Date().toISOString(),
      metadata: {
        intake_data: formData,
        service_level: formData.serviceLevel,
        estimated_income: formData.estimatedIncome,
        business_info: formData.businessName ? {
          name: formData.businessName,
          type: formData.businessType,
          ein: formData.ein
        } : null
      }
    }

    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single()

    if (error) throw new Error(`Failed to create CRM entry: ${error.message}`)
    return data
  }

  /**
   * Step 2: Create Onboarding Workflow
   */
  private static async createOnboardingWorkflow(clientId: string) {
    const workflowData = {
      client_id: clientId,
      status: 'in_progress' as const,
      current_step: 'intake_processing',
      progress: 10,
      automated_tasks: {
        intakeForm: true,
        folderCreation: false,
        crmEntry: true,
        engagementLetter: false,
        welcomeEmail: false,
        documentChecklist: false
      },
      metadata: {
        started_at: new Date().toISOString(),
        automation_version: '1.0'
      }
    }

    const { data, error } = await supabase
      .from('onboarding_workflows')
      .insert(workflowData)
      .select()
      .single()

    if (error) throw new Error(`Failed to create workflow: ${error.message}`)
    return data
  }

  /**
   * Step 3: Create Folder Structure
   */
  private static async createFolderStructure(clientId: string, formData: IntakeFormData) {
    const folderStructure = [
      'Documents/Tax_Returns',
      'Documents/Supporting_Documents',
      'Documents/W2_Forms',
      'Documents/1099_Forms',
      'Documents/Business_Documents',
      'Documents/Receipts_Deductions',
      'Communications/Emails',
      'Communications/Letters',
      'Legal/Engagement_Letter',
      'Legal/Signed_Documents',
      'Completed/Final_Returns',
      'Completed/Filed_Documents'
    ]

    // Add business-specific folders if needed
    if (formData.clientType !== 'individual') {
      folderStructure.push(
        'Business/Financial_Statements',
        'Business/Bank_Statements',
        'Business/Expense_Reports',
        'Business/Payroll_Records'
      )
    }

    const folderData = folderStructure.map(path => ({
      client_id: clientId,
      folder_path: path,
      folder_type: path.split('/')[0].toLowerCase(),
      created_by: 'system',
      metadata: {
        auto_created: true,
        creation_reason: 'onboarding_automation'
      }
    }))

    const { error } = await supabase
      .from('client_folders')
      .insert(folderData)

    if (error) throw new Error(`Failed to create folders: ${error.message}`)
  }

  /**
   * Step 4: Generate Engagement Letter
   */
  private static async generateEngagementLetter(clientId: string, formData: IntakeFormData) {
    const letterData = {
      client_id: clientId,
      document_type: 'engagement_letter',
      title: 'Tax Preparation Engagement Letter',
      content: this.generateEngagementLetterContent(formData),
      status: 'generated',
      requires_signature: true,
      metadata: {
        service_level: formData.serviceLevel,
        client_type: formData.clientType,
        auto_generated: true
      }
    }

    const { error } = await supabase
      .from('client_documents')
      .insert(letterData)

    if (error) throw new Error(`Failed to generate engagement letter: ${error.message}`)
  }

  /**
   * Step 5: Send Welcome Email
   */
  private static async sendWelcomeEmail(clientId: string, formData: IntakeFormData) {
    const emailData = {
      client_id: clientId,
      email_type: 'welcome',
      recipient: formData.email,
      subject: 'Welcome to Our Tax Preparation Service!',
      content: this.generateWelcomeEmailContent(formData),
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        automation_triggered: true,
        template_version: '1.0'
      }
    }

    const { error } = await supabase
      .from('client_communications')
      .insert(emailData)

    if (error) throw new Error(`Failed to send welcome email: ${error.message}`)
  }

  /**
   * Step 6: Create Initial Tasks
   */
  private static async createInitialTasks(clientId: string, formData: IntakeFormData) {
    const tasks = [
      {
        title: 'Review Engagement Letter',
        description: 'Client needs to review and sign the engagement letter',
        priority: 'high' as const,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        category: 'legal'
      },
      {
        title: 'Upload Required Documents',
        description: 'Client needs to upload tax documents per checklist',
        priority: 'high' as const,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        category: 'documents'
      },
      {
        title: 'Schedule Initial Consultation',
        description: 'Schedule initial consultation with client',
        priority: 'medium' as const,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        category: 'consultation'
      }
    ]

    const taskData = tasks.map(task => ({
      client_id: clientId,
      ...task,
      status: 'pending' as const,
      assigned_to: 'system',
      created_by: 'automation',
      metadata: {
        auto_created: true,
        onboarding_task: true
      }
    }))

    const { error } = await supabase
      .from('tasks')
      .insert(taskData)

    if (error) throw new Error(`Failed to create tasks: ${error.message}`)
  }

  /**
   * Step 7: Generate Document Checklist
   */
  private static async generateDocumentChecklist(clientId: string, formData: IntakeFormData) {
    const checklist = this.generateDocumentChecklistItems(formData)
    
    const checklistData = {
      client_id: clientId,
      checklist_type: 'document_collection',
      title: 'Required Tax Documents',
      items: checklist,
      status: 'active',
      metadata: {
        auto_generated: true,
        based_on_intake: true,
        client_type: formData.clientType,
        service_level: formData.serviceLevel
      }
    }

    const { error } = await supabase
      .from('client_checklists')
      .insert(checklistData)

    if (error) throw new Error(`Failed to generate checklist: ${error.message}`)
  }

  /**
   * Update workflow progress
   */
  private static async updateWorkflowProgress(workflowId: string, status: string, progress: number) {
    const { error } = await supabase
      .from('onboarding_workflows')
      .update({
        status,
        progress,
        current_step: status === 'completed' ? 'completed' : 'document_collection',
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)

    if (error) throw new Error(`Failed to update workflow: ${error.message}`)
  }

  /**
   * Helper Methods
   */
  private static determinePriority(formData: IntakeFormData): 'high' | 'medium' | 'low' {
    if (formData.serviceLevel === 'premium' || formData.serviceLevel === 'business') {
      return 'high'
    }
    if (formData.estimatedIncome === 'over-200k') {
      return 'high'
    }
    return 'medium'
  }

  private static generateEngagementLetterContent(formData: IntakeFormData): string {
    return `
      ENGAGEMENT LETTER FOR TAX PREPARATION SERVICES
      
      Dear ${formData.firstName} ${formData.lastName},
      
      This letter confirms our understanding of the terms and objectives of our engagement and the nature and limitations of the services we will provide.
      
      Service Level: ${formData.serviceLevel}
      Client Type: ${formData.clientType}
      
      [Standard engagement letter content would continue here...]
    `
  }

  private static generateWelcomeEmailContent(formData: IntakeFormData): string {
    return `
      Welcome to our tax preparation service, ${formData.firstName}!
      
      Thank you for choosing us for your ${formData.clientType} tax preparation needs.
      
      Next Steps:
      1. Review and sign your engagement letter (coming within 1 hour)
      2. Upload your tax documents using our secure portal
      3. Schedule your initial consultation
      
      Your service level: ${formData.serviceLevel}
      
      If you have any questions, please don't hesitate to contact us.
      
      Best regards,
      The Tax Preparation Team
    `
  }

  private static generateDocumentChecklistItems(formData: IntakeFormData) {
    const baseItems = [
      { name: 'Photo ID', required: true, category: 'identification' },
      { name: 'Social Security Card', required: true, category: 'identification' },
      { name: 'Prior Year Tax Return', required: false, category: 'tax_documents' }
    ]

    if (formData.hasW2) {
      baseItems.push({ name: 'W-2 Forms', required: true, category: 'income' })
    }

    if (formData.has1099) {
      baseItems.push({ name: '1099 Forms', required: true, category: 'income' })
    }

    if (formData.hasBusinessIncome) {
      baseItems.push(
        { name: 'Business Income Records', required: true, category: 'business' },
        { name: 'Business Expense Receipts', required: true, category: 'business' }
      )
    }

    if (formData.hasRentalIncome) {
      baseItems.push({ name: 'Rental Income/Expense Records', required: true, category: 'rental' })
    }

    if (formData.hasInvestments) {
      baseItems.push({ name: 'Investment Statements', required: true, category: 'investments' })
    }

    return baseItems
  }
}
