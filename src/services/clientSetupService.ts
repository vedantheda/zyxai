import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notificationService'

interface ClientData {
  id: string
  name: string
  email: string
  type: 'individual' | 'business'
  filingStatus: string
  serviceLevel: string
  hasSpouse: boolean
  dependents: number
  homeOwnership: boolean
  businessName?: string
  businessType?: string
}

interface FolderStructure {
  name: string
  type: 'folder' | 'file'
  children?: FolderStructure[]
}

export class ClientSetupService {
  /**
   * Creates comprehensive folder structure for new client
   */
  static async createClientFolderStructure(clientData: ClientData): Promise<void> {
    const folderStructure = this.generateFolderStructure(clientData)
    
    try {
      // Create main client folder
      const { data: mainFolder, error: mainFolderError } = await supabase
        .from('client_folders')
        .insert({
          client_id: clientData.id,
          name: `${clientData.name} - ${new Date().getFullYear()}`,
          path: `/clients/${clientData.id}`,
          type: 'folder',
          parent_id: null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (mainFolderError) throw mainFolderError

      // Create subfolders recursively
      await this.createSubfolders(folderStructure.children || [], clientData.id, mainFolder.id, `/clients/${clientData.id}`)

      // Send notification
      await NotificationService.createNotification({
        user_id: clientData.id,
        type: 'success',
        title: 'Client Folder Structure Created',
        message: `Comprehensive folder structure has been created for ${clientData.name}`,
        action_url: `/dashboard/clients/${clientData.id}`
      })

    } catch (error) {
      console.error('Error creating folder structure:', error)
      throw error
    }
  }

  /**
   * Generates folder structure based on client type and characteristics
   */
  private static generateFolderStructure(clientData: ClientData): FolderStructure {
    const baseStructure: FolderStructure = {
      name: `${clientData.name} - ${new Date().getFullYear()}`,
      type: 'folder',
      children: [
        {
          name: '01 - Client Information',
          type: 'folder',
          children: [
            { name: 'Intake Form.pdf', type: 'file' },
            { name: 'Engagement Letter.pdf', type: 'file' },
            { name: 'Client Organizer.pdf', type: 'file' },
            { name: 'Prior Year Returns', type: 'folder' },
            { name: 'ID Documents', type: 'folder' }
          ]
        },
        {
          name: '02 - Source Documents',
          type: 'folder',
          children: [
            { name: 'W-2 Forms', type: 'folder' },
            { name: '1099 Forms', type: 'folder' },
            { name: 'Bank Statements', type: 'folder' },
            { name: 'Investment Statements', type: 'folder' }
          ]
        },
        {
          name: '03 - Deductions & Credits',
          type: 'folder',
          children: [
            { name: 'Charitable Donations', type: 'folder' },
            { name: 'Medical Expenses', type: 'folder' },
            { name: 'Business Expenses', type: 'folder' }
          ]
        },
        {
          name: '04 - Tax Return Preparation',
          type: 'folder',
          children: [
            { name: 'Draft Returns', type: 'folder' },
            { name: 'Review Notes', type: 'folder' },
            { name: 'Client Questions', type: 'folder' }
          ]
        },
        {
          name: '05 - Final Returns & Filing',
          type: 'folder',
          children: [
            { name: 'Signed Returns', type: 'folder' },
            { name: 'E-file Confirmations', type: 'folder' },
            { name: 'Payment Vouchers', type: 'folder' }
          ]
        },
        {
          name: '06 - Correspondence',
          type: 'folder',
          children: [
            { name: 'Client Communications', type: 'folder' },
            { name: 'IRS Correspondence', type: 'folder' },
            { name: 'State Correspondence', type: 'folder' }
          ]
        }
      ]
    }

    // Add spouse-specific folders if married
    if (clientData.hasSpouse) {
      baseStructure.children![1].children!.push(
        { name: 'Spouse W-2 Forms', type: 'folder' },
        { name: 'Spouse 1099 Forms', type: 'folder' }
      )
    }

    // Add homeownership folders if applicable
    if (clientData.homeOwnership) {
      baseStructure.children![2].children!.push(
        { name: 'Mortgage Interest Statements', type: 'folder' },
        { name: 'Property Tax Records', type: 'folder' },
        { name: 'Home Improvement Records', type: 'folder' }
      )
    }

    // Add business-specific folders if business client
    if (clientData.type === 'business') {
      baseStructure.children!.push({
        name: '07 - Business Documents',
        type: 'folder',
        children: [
          { name: 'Financial Statements', type: 'folder' },
          { name: 'General Ledger', type: 'folder' },
          { name: 'Depreciation Schedules', type: 'folder' },
          { name: 'Payroll Records', type: 'folder' },
          { name: 'Business Licenses', type: 'folder' }
        ]
      })
    }

    // Add dependent-related folders if applicable
    if (clientData.dependents > 0) {
      baseStructure.children![2].children!.push(
        { name: 'Childcare Expenses', type: 'folder' },
        { name: 'Education Expenses', type: 'folder' },
        { name: 'Dependent Care Records', type: 'folder' }
      )
    }

    return baseStructure
  }

  /**
   * Creates subfolders recursively
   */
  private static async createSubfolders(
    folders: FolderStructure[], 
    clientId: string, 
    parentId: string, 
    parentPath: string
  ): Promise<void> {
    for (const folder of folders) {
      const folderPath = `${parentPath}/${folder.name}`
      
      const { data: createdFolder, error } = await supabase
        .from('client_folders')
        .insert({
          client_id: clientId,
          name: folder.name,
          path: folderPath,
          type: folder.type,
          parent_id: parentId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Create subfolders if they exist
      if (folder.children && folder.children.length > 0) {
        await this.createSubfolders(folder.children, clientId, createdFolder.id, folderPath)
      }
    }
  }

  /**
   * Generates and creates engagement letter
   */
  static async generateEngagementLetter(clientData: ClientData): Promise<string> {
    const engagementLetter = this.createEngagementLetterContent(clientData)
    
    try {
      // Store engagement letter in database
      const { data: letter, error } = await supabase
        .from('documents')
        .insert({
          client_id: clientData.id,
          name: `Engagement Letter - ${clientData.name}.pdf`,
          category: 'engagement_letter',
          content: engagementLetter,
          file_size: engagementLetter.length,
          mime_type: 'application/pdf',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Send notification
      await NotificationService.createNotification({
        user_id: clientData.id,
        type: 'info',
        title: 'Engagement Letter Generated',
        message: `Engagement letter has been generated and is ready for review`,
        action_url: `/dashboard/clients/${clientData.id}/documents`
      })

      return letter.id
    } catch (error) {
      console.error('Error generating engagement letter:', error)
      throw error
    }
  }

  /**
   * Creates engagement letter content based on client data
   */
  private static createEngagementLetterContent(clientData: ClientData): string {
    const currentDate = new Date().toLocaleDateString()
    const taxYear = new Date().getFullYear() - 1

    return `
ENGAGEMENT LETTER FOR TAX PREPARATION SERVICES

Date: ${currentDate}

Dear ${clientData.name},

Thank you for selecting our firm to prepare your ${taxYear} tax return. This letter confirms our understanding of the terms and objectives of our engagement and the nature and limitations of the services we will provide.

CLIENT INFORMATION:
Name: ${clientData.name}
Email: ${clientData.email}
Client Type: ${clientData.type === 'individual' ? 'Individual' : 'Business'}
Filing Status: ${clientData.filingStatus.replace('_', ' ')}
Service Level: ${clientData.serviceLevel}
${clientData.businessName ? `Business Name: ${clientData.businessName}` : ''}

SCOPE OF SERVICES:
We will prepare your ${taxYear} federal and applicable state income tax returns based on information you provide to us. We will not audit or otherwise verify the data you submit, although we may ask for clarification of some information.

It is your responsibility to provide all the information required for the preparation of complete and accurate returns. You should retain all the documents, cancelled checks and other data that form the basis of income and deductions. These may be necessary to prove the accuracy and completeness of the returns to a taxing authority.

Your returns may be selected for review by the taxing authorities. Any proposed adjustments by the examining agent are subject to certain rights of appeal. In the event of such government tax examination, we will be available upon request to represent you and will render additional invoices for the time and expenses incurred.

FEES:
Our fee for these services will be based on the complexity of the return and the time required for completion. The estimated fee for your ${clientData.serviceLevel} service level is as indicated in your service selection.

CONFIDENTIALITY:
We will not disclose any confidential information obtained during this engagement without your prior written consent, except as may be required by law.

Please sign and return one copy of this letter to indicate your agreement with the terms of this engagement.

We appreciate the opportunity to serve you.

Sincerely,

[Tax Preparer Name]
[Firm Name]
[License Number]

ACKNOWLEDGED AND AGREED:

Client Signature: _________________________ Date: _________

${clientData.name}
    `.trim()
  }

  /**
   * Creates comprehensive task list for new client
   */
  static async createClientTasks(clientData: ClientData): Promise<void> {
    const tasks = this.generateTaskList(clientData)
    
    try {
      for (const task of tasks) {
        await supabase
          .from('tasks')
          .insert({
            client_id: clientData.id,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            status: 'pending',
            due_date: task.dueDate,
            estimated_hours: task.estimatedHours,
            created_at: new Date().toISOString()
          })
      }

      // Send notification
      await NotificationService.createNotification({
        user_id: clientData.id,
        type: 'info',
        title: 'Client Tasks Created',
        message: `${tasks.length} tasks have been created for ${clientData.name}`,
        action_url: `/dashboard/clients/${clientData.id}`
      })

    } catch (error) {
      console.error('Error creating client tasks:', error)
      throw error
    }
  }

  /**
   * Generates task list based on client characteristics
   */
  private static generateTaskList(clientData: ClientData) {
    const baseTasks = [
      {
        title: 'Send Welcome Email and Organizer',
        description: 'Send welcome email with tax organizer and document checklist',
        category: 'client_communication',
        priority: 'high',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        estimatedHours: 0.5
      },
      {
        title: 'Review Engagement Letter',
        description: 'Review and obtain signed engagement letter from client',
        category: 'administrative',
        priority: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        estimatedHours: 0.25
      },
      {
        title: 'Collect Source Documents',
        description: 'Collect all necessary tax documents from client',
        category: 'document_collection',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
        estimatedHours: 1
      },
      {
        title: 'Review Prior Year Return',
        description: 'Review prior year tax return for carryovers and planning opportunities',
        category: 'tax_preparation',
        priority: 'medium',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
        estimatedHours: 1
      },
      {
        title: 'Prepare Draft Return',
        description: 'Prepare initial draft of tax return',
        category: 'tax_preparation',
        priority: 'high',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
        estimatedHours: 3
      }
    ]

    // Add business-specific tasks
    if (clientData.type === 'business') {
      baseTasks.push(
        {
          title: 'Review Business Financial Statements',
          description: 'Review and analyze business financial statements',
          category: 'tax_preparation',
          priority: 'high',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedHours: 2
        },
        {
          title: 'Verify Business Deductions',
          description: 'Review and verify all business deduction documentation',
          category: 'tax_preparation',
          priority: 'medium',
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedHours: 1.5
        }
      )
    }

    // Add homeownership tasks
    if (clientData.homeOwnership) {
      baseTasks.push({
        title: 'Review Homeownership Documents',
        description: 'Review mortgage interest statements and property tax records',
        category: 'document_review',
        priority: 'medium',
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 0.5
      })
    }

    // Add spouse-related tasks
    if (clientData.hasSpouse) {
      baseTasks.push({
        title: 'Collect Spouse Documents',
        description: 'Collect all tax documents for spouse',
        category: 'document_collection',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 0.5
      })
    }

    return baseTasks
  }

  /**
   * Complete client setup process
   */
  static async completeClientSetup(clientData: ClientData): Promise<void> {
    try {
      // Create folder structure
      await this.createClientFolderStructure(clientData)
      
      // Generate engagement letter
      await this.generateEngagementLetter(clientData)
      
      // Create tasks
      await this.createClientTasks(clientData)

      // Update client status
      await supabase
        .from('clients')
        .update({ 
          status: 'documents_pending',
          setup_completed: true,
          setup_completed_at: new Date().toISOString()
        })
        .eq('id', clientData.id)

      // Send completion notification
      await NotificationService.createNotification({
        user_id: clientData.id,
        type: 'success',
        title: 'Client Setup Complete',
        message: `Complete setup has been finished for ${clientData.name}. Folder structure, engagement letter, and tasks have been created.`,
        action_url: `/dashboard/clients/${clientData.id}`
      })

    } catch (error) {
      console.error('Error completing client setup:', error)
      throw error
    }
  }
}

export default ClientSetupService
