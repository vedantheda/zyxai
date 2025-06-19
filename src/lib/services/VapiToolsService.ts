/**
 * Vapi Tools Service
 * Manages custom tools and function calling for Vapi assistants
 *
 * Based on Vapi documentation: https://docs.vapi.ai/tools
 */

export interface VapiTool {
  type: 'function' | 'dtmf' | 'endCall' | 'transferCall'
  function?: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required?: string[]
    }
  }
  server?: {
    url: string
    secret?: string
  }
  // For transferCall tool
  destinations?: Array<{
    type: 'number'
    number: string
    description?: string
  }>
}

export class VapiToolsService {
  private static baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  /**
   * Get all available tools for ZyxAI assistants
   */
  static getAllTools(): VapiTool[] {
    return [
      this.getScheduleAppointmentTool(),
      this.getUpdateCrmContactTool(),
      this.getTransferToHumanTool(),
      this.getEndCallTool(),
      this.getGetContactInfoTool(),
      this.getSendEmailTool(),
      this.getCreateTaskTool()
    ]
  }

  /**
   * Get tools for specific agent types
   */
  static getToolsForAgentType(agentType: string): VapiTool[] {
    const allTools = this.getAllTools()

    switch (agentType) {
      case 'appointment_scheduler':
        return allTools.filter(tool =>
          tool.function && ['schedule_appointment', 'get_contact_info', 'transfer_to_human', 'end_call'].includes(tool.function.name)
        )

      case 'sales_outbound':
        return allTools.filter(tool =>
          tool.function && ['update_crm_contact', 'schedule_appointment', 'send_email', 'transfer_to_human', 'end_call'].includes(tool.function.name)
        )

      case 'customer_support':
        return allTools.filter(tool =>
          tool.function && ['get_contact_info', 'create_task', 'transfer_to_human', 'end_call'].includes(tool.function.name)
        )

      case 'lead_qualifier':
        return allTools.filter(tool =>
          tool.function && ['update_crm_contact', 'schedule_appointment', 'transfer_to_human', 'end_call'].includes(tool.function.name)
        )

      default:
        return [this.getTransferToHumanTool(), this.getEndCallTool()]
    }
  }

  // ===== INDIVIDUAL TOOL DEFINITIONS =====

  /**
   * Schedule Appointment Tool
   */
  static getScheduleAppointmentTool(): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'schedule_appointment',
        description: 'Schedule an appointment with the customer',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Appointment date in YYYY-MM-DD format'
            },
            time: {
              type: 'string',
              description: 'Appointment time in HH:MM format'
            },
            duration: {
              type: 'number',
              description: 'Duration in minutes'
            },
            type: {
              type: 'string',
              description: 'Type of appointment (consultation, demo, etc.)'
            },
            notes: {
              type: 'string',
              description: 'Additional notes for the appointment'
            }
          },
          required: ['date', 'time', 'type']
        }
      },
      server: {
        url: `${this.baseUrl}/api/webhooks/vapi`
      }
    }
  }

  /**
   * Update CRM Contact Tool
   */
  static getUpdateCrmContactTool(): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'update_crm_contact',
        description: 'Update contact information in the CRM system',
        parameters: {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              description: 'Contact phone number'
            },
            email: {
              type: 'string',
              description: 'Contact email address'
            },
            name: {
              type: 'string',
              description: 'Contact full name'
            },
            company: {
              type: 'string',
              description: 'Company name'
            },
            status: {
              type: 'string',
              description: 'Lead status (interested, not_interested, callback, etc.)'
            },
            notes: {
              type: 'string',
              description: 'Call notes and observations'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags to add to the contact'
            }
          },
          required: ['phone']
        }
      },
      server: {
        url: `${this.baseUrl}/api/webhooks/vapi`
      }
    }
  }

  /**
   * Transfer to Human Tool
   */
  static getTransferToHumanTool(): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'transfer_to_human',
        description: 'Transfer the call to a human agent',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Reason for transfer (complex_question, customer_request, etc.)'
            },
            department: {
              type: 'string',
              description: 'Department to transfer to (sales, support, etc.)'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Priority level for the transfer'
            },
            notes: {
              type: 'string',
              description: 'Context notes for the human agent'
            }
          },
          required: ['reason']
        }
      },
      server: {
        url: `${this.baseUrl}/api/webhooks/vapi`
      }
    }
  }

  /**
   * End Call Tool
   */
  static getEndCallTool(): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'end_call',
        description: 'End the current call',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Reason for ending the call'
            },
            outcome: {
              type: 'string',
              enum: ['successful', 'unsuccessful', 'callback_requested', 'not_interested'],
              description: 'Call outcome'
            },
            follow_up_required: {
              type: 'boolean',
              description: 'Whether follow-up is required'
            },
            notes: {
              type: 'string',
              description: 'Final call notes'
            }
          },
          required: ['outcome']
        }
      },
      server: {
        url: `${this.baseUrl}/api/webhooks/vapi`
      }
    }
  }

  /**
   * Get Contact Info Tool
   */
  static getGetContactInfoTool(): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'get_contact_info',
        description: 'Retrieve contact information from CRM',
        parameters: {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              description: 'Phone number to look up'
            },
            email: {
              type: 'string',
              description: 'Email address to look up'
            }
          }
        }
      },
      server: {
        url: `${this.baseUrl}/api/webhooks/vapi`
      }
    }
  }

  /**
   * Send Email Tool
   */
  static getSendEmailTool(): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'send_email',
        description: 'Send a follow-up email to the contact',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Recipient email address'
            },
            subject: {
              type: 'string',
              description: 'Email subject'
            },
            template: {
              type: 'string',
              description: 'Email template to use (follow_up, appointment_confirmation, etc.)'
            },
            variables: {
              type: 'object',
              description: 'Variables to populate in the email template'
            }
          },
          required: ['to', 'template']
        }
      },
      server: {
        url: `${this.baseUrl}/api/webhooks/vapi`
      }
    }
  }

  /**
   * Create Task Tool
   */
  static getCreateTaskTool(): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'create_task',
        description: 'Create a task or reminder for follow-up',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title'
            },
            description: {
              type: 'string',
              description: 'Task description'
            },
            due_date: {
              type: 'string',
              description: 'Due date in YYYY-MM-DD format'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority'
            },
            assignee: {
              type: 'string',
              description: 'Person to assign the task to'
            }
          },
          required: ['title', 'description']
        }
      },
      server: {
        url: `${this.baseUrl}/api/webhooks/vapi`
      }
    }
  }
}

export default VapiToolsService
