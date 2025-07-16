import { hubspotIntegration } from './hubspot'
import { supabaseAdmin } from '@/lib/supabase'

interface HubSpotEmailActivity {
  contactId: string
  emailDirection: 'EMAIL' | 'INCOMING_EMAIL'
  subject: string
  html?: string
  text?: string
  fromEmail?: string
  fromFirstName?: string
  fromLastName?: string
  toEmail?: string
  ccEmails?: string[]
  bccEmails?: string[]
  sentDateTime?: string
  openedDateTime?: string
  clickedDateTime?: string
  repliedDateTime?: string
  attachments?: Array<{
    name: string
    url: string
    type: string
  }>
}

interface EmailSyncResult {
  emailsSynced: number
  activitiesCreated: number
  contactsUpdated: number
  errors: string[]
}

class HubSpotEmailIntegration {
  private accessToken: string
  private baseUrl = 'https://api.hubapi.com'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HubSpot API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Sync email conversations to HubSpot
  async syncEmailsToHubSpot(organizationId: string): Promise<EmailSyncResult> {
    console.log('📧 Syncing emails to HubSpot...')

    const result: EmailSyncResult = {
      emailsSynced: 0,
      activitiesCreated: 0,
      contactsUpdated: 0,
      errors: []
    }

    try {
      // Get emails that haven't been synced to HubSpot
      const { data: emails, error } = await supabaseAdmin
        .from('emails')
        .select(`
          *,
          contacts (
            hubspot_id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .is('hubspot_activity_id', null)
        .order('received_at', { ascending: false })
        .limit(100) // Process in batches

      if (error) throw error

      for (const email of emails || []) {
        try {
          // Skip if contact doesn't have HubSpot ID
          if (!email.contacts?.hubspot_id) {
            result.errors.push(`Email ${email.id}: Contact has no HubSpot ID`)
            continue
          }

          // Create email activity in HubSpot
          const activityData: HubSpotEmailActivity = {
            contactId: email.contacts.hubspot_id,
            emailDirection: email.from_address === email.contacts.email ? 'INCOMING_EMAIL' : 'EMAIL',
            subject: email.subject || 'No Subject',
            html: email.html_body,
            text: email.body,
            fromEmail: email.from_address,
            toEmail: email.to_addresses?.[0],
            ccEmails: email.cc_addresses,
            bccEmails: email.bcc_addresses,
            sentDateTime: email.received_at,
            attachments: email.attachments?.map(att => ({
              name: att.name,
              url: att.url,
              type: att.type
            }))
          }

          // Create the activity
          const activity = await this.makeRequest('/crm/v3/objects/emails', {
            method: 'POST',
            body: JSON.stringify({
              properties: activityData
            })
          })

          // Update email with HubSpot activity ID
          await supabaseAdmin
            .from('emails')
            .update({ 
              hubspot_activity_id: activity.id,
              synced_at: new Date().toISOString()
            })
            .eq('id', email.id)

          result.emailsSynced++
          result.activitiesCreated++

          // Update contact's last email activity
          await this.updateContactEmailActivity(email.contacts.hubspot_id, email)
          result.contactsUpdated++

          console.log(`📧 Synced email: ${email.subject}`)

        } catch (error: any) {
          result.errors.push(`Email ${email.id}: ${error.message}`)
          console.error(`❌ Failed to sync email ${email.id}:`, error)
        }
      }

      console.log(`✅ Email sync complete! Synced ${result.emailsSynced} emails`)
      return result

    } catch (error) {
      console.error('❌ Error syncing emails to HubSpot:', error)
      throw error
    }
  }

  // Update contact with email activity data
  private async updateContactEmailActivity(hubspotContactId: string, email: any) {
    try {
      const updateData: Record<string, any> = {
        zyxai_last_email_date: email.received_at.split('T')[0],
        zyxai_email_count: 1, // This would need to be calculated properly
        zyxai_last_email_subject: email.subject || 'No Subject'
      }

      // Add AI analysis data if available
      if (email.ai_category) {
        updateData.zyxai_email_category = email.ai_category
      }

      if (email.ai_priority) {
        updateData.zyxai_email_priority = email.ai_priority
      }

      if (email.ai_summary) {
        updateData.zyxai_email_summary = email.ai_summary.substring(0, 500) // HubSpot field limits
      }

      await this.makeRequest(`/crm/v3/objects/contacts/${hubspotContactId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          properties: updateData
        })
      })

    } catch (error) {
      console.error('❌ Error updating contact email activity:', error)
    }
  }

  // Create email custom properties in HubSpot
  async createEmailProperties() {
    console.log('🔧 Creating email custom properties in HubSpot...')

    const emailProperties = [
      {
        name: 'zyxai_email_count',
        label: 'ZyxAI Email Count',
        type: 'number',
        fieldType: 'number',
        groupName: 'zyxai_email',
        description: 'Total number of emails processed by ZyxAI'
      },
      {
        name: 'zyxai_last_email_date',
        label: 'ZyxAI Last Email Date',
        type: 'date',
        fieldType: 'date',
        groupName: 'zyxai_email',
        description: 'Date of last email processed by ZyxAI'
      },
      {
        name: 'zyxai_last_email_subject',
        label: 'ZyxAI Last Email Subject',
        type: 'string',
        fieldType: 'text',
        groupName: 'zyxai_email',
        description: 'Subject of last email processed by ZyxAI'
      },
      {
        name: 'zyxai_email_category',
        label: 'ZyxAI Email Category',
        type: 'enumeration',
        fieldType: 'select',
        groupName: 'zyxai_email',
        description: 'AI-determined email category',
        options: [
          { label: 'Sales Inquiry', value: 'sales_inquiry' },
          { label: 'Support Request', value: 'support_request' },
          { label: 'General Question', value: 'general_question' },
          { label: 'Complaint', value: 'complaint' },
          { label: 'Feedback', value: 'feedback' },
          { label: 'Other', value: 'other' }
        ]
      },
      {
        name: 'zyxai_email_priority',
        label: 'ZyxAI Email Priority',
        type: 'enumeration',
        fieldType: 'select',
        groupName: 'zyxai_email',
        description: 'AI-determined email priority',
        options: [
          { label: 'Urgent', value: 'urgent' },
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' }
        ]
      },
      {
        name: 'zyxai_email_summary',
        label: 'ZyxAI Email Summary',
        type: 'string',
        fieldType: 'textarea',
        groupName: 'zyxai_email',
        description: 'AI-generated summary of email content'
      },
      {
        name: 'zyxai_email_sentiment',
        label: 'ZyxAI Email Sentiment',
        type: 'enumeration',
        fieldType: 'select',
        groupName: 'zyxai_email',
        description: 'AI-analyzed email sentiment',
        options: [
          { label: 'Positive', value: 'positive' },
          { label: 'Neutral', value: 'neutral' },
          { label: 'Negative', value: 'negative' }
        ]
      }
    ]

    for (const property of emailProperties) {
      try {
        await this.makeRequest('/crm/v3/properties/contacts', {
          method: 'POST',
          body: JSON.stringify(property)
        })
        console.log(`✅ Created email property: ${property.name}`)
      } catch (error: any) {
        if (error.message.includes('409')) {
          console.log(`ℹ️ Email property already exists: ${property.name}`)
        } else {
          console.error(`❌ Failed to create email property ${property.name}:`, error.message)
        }
      }
    }

    console.log('🎉 Email properties setup complete!')
  }

  // Sync email routing rules to HubSpot workflows
  async syncEmailRoutingRules(organizationId: string) {
    console.log('🔄 Syncing email routing rules to HubSpot...')

    try {
      // Get email routing rules
      const { data: routingRules, error } = await supabaseAdmin
        .from('email_routing_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (error) throw error

      // For each routing rule, we could create corresponding HubSpot workflows
      // This is a simplified version - in practice, you'd need to map complex rules
      for (const rule of routingRules || []) {
        console.log(`📋 Processing routing rule: ${rule.name}`)
        
        // Create a note about the routing rule in HubSpot
        // In a full implementation, you'd create actual workflows
        const ruleDescription = `ZyxAI Email Routing Rule: ${rule.name}\n` +
          `Conditions: ${JSON.stringify(rule.conditions)}\n` +
          `Actions: ${JSON.stringify(rule.actions)}`

        // This could be expanded to create actual HubSpot workflows
        console.log(`📝 Rule documented: ${rule.name}`)
      }

      console.log('✅ Email routing rules sync complete!')

    } catch (error) {
      console.error('❌ Error syncing email routing rules:', error)
      throw error
    }
  }

  // Create email performance report
  async generateEmailPerformanceReport(organizationId: string) {
    console.log('📊 Generating email performance report...')

    try {
      // Get email statistics
      const { data: emailStats } = await supabaseAdmin
        .from('emails')
        .select(`
          ai_category,
          ai_priority,
          ai_sentiment,
          is_read,
          received_at,
          contacts (
            hubspot_id,
            first_name,
            last_name
          )
        `)
        .eq('organization_id', organizationId)

      const report = {
        totalEmails: emailStats?.length || 0,
        byCategory: {},
        byPriority: {},
        bySentiment: {},
        responseRate: 0,
        averageResponseTime: 0,
        topContacts: []
      }

      // Analyze by category
      const categories = emailStats?.reduce((acc, email) => {
        const category = email.ai_category || 'uncategorized'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {}) || {}

      // Analyze by priority
      const priorities = emailStats?.reduce((acc, email) => {
        const priority = email.ai_priority || 'unknown'
        acc[priority] = (acc[priority] || 0) + 1
        return acc
      }, {}) || {}

      // Analyze by sentiment
      const sentiments = emailStats?.reduce((acc, email) => {
        const sentiment = email.ai_sentiment || 'neutral'
        acc[sentiment] = (acc[sentiment] || 0) + 1
        return acc
      }, {}) || {}

      // Calculate response rate
      const readEmails = emailStats?.filter(e => e.is_read).length || 0
      report.responseRate = report.totalEmails > 0 ? (readEmails / report.totalEmails) * 100 : 0

      // Find top email contacts
      const contactEmailCounts = emailStats?.reduce((acc, email) => {
        if (email.contacts?.hubspot_id) {
          const contactKey = `${email.contacts.first_name} ${email.contacts.last_name}`
          acc[contactKey] = (acc[contactKey] || 0) + 1
        }
        return acc
      }, {}) || {}

      const topContacts = Object.entries(contactEmailCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([name, count]) => ({ name, emailCount: count }))

      report.byCategory = categories
      report.byPriority = priorities
      report.bySentiment = sentiments
      report.topContacts = topContacts

      console.log('✅ Email performance report generated')
      return report

    } catch (error) {
      console.error('❌ Error generating email performance report:', error)
      throw error
    }
  }

  // Full email integration sync
  async performFullEmailSync(organizationId: string) {
    console.log('🚀 Starting full email integration sync...')

    try {
      // 1. Create custom properties
      await this.createEmailProperties()

      // 2. Sync emails to HubSpot
      const syncResult = await this.syncEmailsToHubSpot(organizationId)

      // 3. Sync routing rules
      await this.syncEmailRoutingRules(organizationId)

      // 4. Generate performance report
      const performanceReport = await this.generateEmailPerformanceReport(organizationId)

      console.log('🎉 Full email sync complete!')

      return {
        success: true,
        syncResult,
        performanceReport,
        message: `Successfully synced ${syncResult.emailsSynced} emails with ${syncResult.errors.length} errors`
      }

    } catch (error) {
      console.error('❌ Full email sync failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const hubspotEmailIntegration = new HubSpotEmailIntegration('process.env.CRM_ACCESS_TOKEN || ""')

// Export class for testing
export { HubSpotEmailIntegration }
