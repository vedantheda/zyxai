/**
 * VAPI Workflow Configuration Presets for ZyxAI
 * Advanced conversation flows for complex business processes
 */

import { VapiWorkflowConfig, VapiWorkflowNode } from '../types/VapiAdvancedConfig'

// ===== APPOINTMENT SCHEDULING WORKFLOW =====

export const AppointmentSchedulingWorkflow: VapiWorkflowConfig = {
  nodes: [
    {
      id: "start",
      type: "conversation",
      firstMessage: "Hello! Thank you for calling ZyxAI. This is Sarah, your booking assistant. I can help you schedule, reschedule, or cancel appointments. How can I help you today?",
      systemPrompt: `You are Sarah, the friendly booking assistant for ZyxAI.

Listen to the customer's response and determine their intent:
- "schedule" for new appointments
- "reschedule" for changing existing appointments  
- "cancel" for canceling appointments
- "status" for checking appointment details
- "other" for anything else

Keep responses under 35 words. Ask clarifying questions if intent is unclear.`,
      extractVariables: [{
        variableName: "intent",
        dataType: "String",
        extractionPrompt: "What is the customer's primary intent?",
        enums: ["schedule", "reschedule", "cancel", "status", "other"]
      }]
    },
    {
      id: "schedule_appointment",
      type: "conversation",
      firstMessage: "Great! I'd be happy to help you schedule an appointment. What type of service are you looking for?",
      systemPrompt: `You are helping the customer schedule a new appointment.

1. Ask about service type
2. Get their preferred date and time
3. Collect contact information
4. Confirm appointment details

Keep responses under 30 words. Be helpful and efficient.`,
      extractVariables: [
        {
          variableName: "serviceType",
          dataType: "String",
          extractionPrompt: "What type of service does the customer need?"
        },
        {
          variableName: "preferredDate",
          dataType: "String",
          extractionPrompt: "What date does the customer prefer?"
        },
        {
          variableName: "preferredTime",
          dataType: "String",
          extractionPrompt: "What time does the customer prefer?"
        },
        {
          variableName: "customerName",
          dataType: "String",
          extractionPrompt: "What is the customer's name?"
        },
        {
          variableName: "customerPhone",
          dataType: "String",
          extractionPrompt: "What is the customer's phone number?"
        }
      ]
    },
    {
      id: "reschedule_appointment",
      type: "conversation",
      firstMessage: "I can help you reschedule your appointment. Can you provide your current appointment details or phone number?",
      systemPrompt: `You are helping the customer reschedule an existing appointment.

1. Get their current appointment details
2. Find new preferred date/time
3. Confirm the changes

Keep responses under 30 words.`,
      extractVariables: [
        {
          variableName: "currentAppointmentId",
          dataType: "String",
          extractionPrompt: "What is the customer's current appointment ID or reference?"
        },
        {
          variableName: "newPreferredDate",
          dataType: "String",
          extractionPrompt: "What new date does the customer prefer?"
        },
        {
          variableName: "newPreferredTime",
          dataType: "String",
          extractionPrompt: "What new time does the customer prefer?"
        }
      ]
    },
    {
      id: "cancel_appointment",
      type: "conversation",
      firstMessage: "I can help you cancel your appointment. Can you provide your appointment details or phone number?",
      systemPrompt: `You are helping the customer cancel an appointment.

1. Get their appointment details
2. Confirm cancellation
3. Provide cancellation confirmation

Keep responses under 25 words. Be understanding and helpful.`,
      extractVariables: [{
        variableName: "appointmentToCancel",
        dataType: "String",
        extractionPrompt: "What appointment does the customer want to cancel?"
      }]
    },
    {
      id: "transfer_to_human",
      type: "transfer",
      phoneNumber: "+1-555-SUPPORT",
      transferPlan: {
        message: "Let me transfer you to one of our team members who can better assist you.",
        summary: "Customer needs human assistance with their request."
      }
    },
    {
      id: "appointment_confirmed",
      type: "conversation",
      firstMessage: "Perfect! Your appointment is confirmed. You'll receive a confirmation message shortly. Is there anything else I can help you with today?",
      systemPrompt: `You are wrapping up a successful appointment booking.

Be friendly and offer additional assistance.
If they say no, prepare to end the call politely.
Keep responses under 25 words.`
    },
    {
      id: "end_call",
      type: "endCall",
      endMessage: "Thank you for calling ZyxAI. Have a great day!"
    }
  ],
  edges: [
    { from: "start", to: "schedule_appointment", condition: "intent == 'schedule'" },
    { from: "start", to: "reschedule_appointment", condition: "intent == 'reschedule'" },
    { from: "start", to: "cancel_appointment", condition: "intent == 'cancel'" },
    { from: "start", to: "transfer_to_human", condition: "intent == 'other'" },
    { from: "schedule_appointment", to: "appointment_confirmed", condition: "customerName && customerPhone" },
    { from: "reschedule_appointment", to: "appointment_confirmed", condition: "newPreferredDate" },
    { from: "cancel_appointment", to: "end_call", condition: "appointmentToCancel" },
    { from: "appointment_confirmed", to: "end_call", condition: "true" },
    { from: "transfer_to_human", to: "end_call", condition: "true" }
  ]
}

// ===== CUSTOMER SUPPORT WORKFLOW =====

export const CustomerSupportWorkflow: VapiWorkflowConfig = {
  nodes: [
    {
      id: "start",
      type: "conversation",
      firstMessage: "Hi! Thank you for calling ZyxAI customer support. I'm here to help you with any questions or issues. Can you briefly describe what you need assistance with?",
      systemPrompt: `You are a customer support representative for ZyxAI.

Listen to the customer's issue and categorize it:
- "technical" for technical problems
- "billing" for billing/payment issues
- "account" for account-related questions
- "general" for general inquiries
- "urgent" for urgent issues

Be empathetic and professional. Keep responses under 30 words.`,
      extractVariables: [
        {
          variableName: "issueCategory",
          dataType: "String",
          extractionPrompt: "What category does the customer's issue fall into?",
          enums: ["technical", "billing", "account", "general", "urgent"]
        },
        {
          variableName: "issueDescription",
          dataType: "String",
          extractionPrompt: "Briefly describe the customer's issue."
        }
      ]
    },
    {
      id: "technical_support",
      type: "conversation",
      firstMessage: "I understand you're experiencing a technical issue. Let me help you troubleshoot this. Can you tell me more about what's happening?",
      systemPrompt: `You are providing technical support.

1. Gather detailed information about the issue
2. Provide step-by-step troubleshooting
3. Verify if the solution works
4. Escalate if needed

Keep responses clear and under 35 words.`,
      extractVariables: [
        {
          variableName: "deviceType",
          dataType: "String",
          extractionPrompt: "What device or system is the customer using?"
        },
        {
          variableName: "errorMessage",
          dataType: "String",
          extractionPrompt: "What error message is the customer seeing?"
        },
        {
          variableName: "issueResolved",
          dataType: "Boolean",
          extractionPrompt: "Has the customer's technical issue been resolved?"
        }
      ]
    },
    {
      id: "billing_support",
      type: "conversation",
      firstMessage: "I can help you with your billing question. For security, can you verify your account with your email address or phone number?",
      systemPrompt: `You are handling a billing inquiry.

1. Verify customer identity
2. Address their billing question
3. Provide clear explanations
4. Offer solutions if needed

Keep responses under 30 words. Be clear about billing policies.`,
      extractVariables: [
        {
          variableName: "accountVerified",
          dataType: "Boolean",
          extractionPrompt: "Has the customer's account been verified?"
        },
        {
          variableName: "billingIssueType",
          dataType: "String",
          extractionPrompt: "What type of billing issue does the customer have?"
        }
      ]
    },
    {
      id: "escalate_to_specialist",
      type: "transfer",
      phoneNumber: "+1-555-SPECIALIST",
      transferPlan: {
        message: "I'm transferring you to a specialist who can better assist with your specific issue.",
        summary: "Customer issue requires specialist attention."
      }
    },
    {
      id: "issue_resolved",
      type: "conversation",
      firstMessage: "Great! I'm glad we could resolve your issue. Is there anything else I can help you with today?",
      systemPrompt: `The customer's issue has been resolved.

Confirm satisfaction and offer additional help.
If no further assistance needed, prepare to end the call.
Keep responses under 20 words.`
    },
    {
      id: "end_call",
      type: "endCall",
      endMessage: "Thank you for contacting ZyxAI support. Have a wonderful day!"
    }
  ],
  edges: [
    { from: "start", to: "technical_support", condition: "issueCategory == 'technical'" },
    { from: "start", to: "billing_support", condition: "issueCategory == 'billing'" },
    { from: "start", to: "escalate_to_specialist", condition: "issueCategory == 'urgent'" },
    { from: "technical_support", to: "issue_resolved", condition: "issueResolved == true" },
    { from: "technical_support", to: "escalate_to_specialist", condition: "issueResolved == false" },
    { from: "billing_support", to: "issue_resolved", condition: "accountVerified == true" },
    { from: "billing_support", to: "escalate_to_specialist", condition: "accountVerified == false" },
    { from: "issue_resolved", to: "end_call", condition: "true" },
    { from: "escalate_to_specialist", to: "end_call", condition: "true" }
  ]
}

// ===== SALES QUALIFICATION WORKFLOW =====

export const SalesQualificationWorkflow: VapiWorkflowConfig = {
  nodes: [
    {
      id: "start",
      type: "conversation",
      firstMessage: "Hi! This is Alex from ZyxAI. I'm calling because you showed interest in our AI voice automation solutions. Do you have a few minutes to chat?",
      systemPrompt: `You are Alex, a sales representative for ZyxAI.

Your goal is to qualify the lead and determine if they're a good fit.
Be professional, consultative, and focused on understanding their needs.
Keep responses under 30 words.`,
      extractVariables: [{
        variableName: "availableToTalk",
        dataType: "Boolean",
        extractionPrompt: "Is the prospect available to talk now?"
      }]
    },
    {
      id: "qualify_lead",
      type: "conversation",
      firstMessage: "Great! I'd love to learn more about your business. What industry are you in, and how are you currently handling customer communications?",
      systemPrompt: `You are qualifying the lead.

Ask about:
1. Industry and business type
2. Current communication challenges
3. Team size and volume
4. Budget and timeline
5. Decision-making process

Keep responses under 35 words. Be consultative, not pushy.`,
      extractVariables: [
        {
          variableName: "industry",
          dataType: "String",
          extractionPrompt: "What industry is the prospect's business in?"
        },
        {
          variableName: "teamSize",
          dataType: "String",
          extractionPrompt: "How large is their team or company?"
        },
        {
          variableName: "currentChallenges",
          dataType: "String",
          extractionPrompt: "What communication challenges do they currently face?"
        },
        {
          variableName: "budget",
          dataType: "String",
          extractionPrompt: "What is their budget range or investment level?"
        },
        {
          variableName: "timeline",
          dataType: "String",
          extractionPrompt: "What is their timeline for implementing a solution?"
        },
        {
          variableName: "decisionMaker",
          dataType: "Boolean",
          extractionPrompt: "Is this person the decision maker?"
        }
      ]
    },
    {
      id: "schedule_demo",
      type: "conversation",
      firstMessage: "Based on what you've shared, I think ZyxAI could be a great fit. Would you like to schedule a personalized demo to see how it works for your specific needs?",
      systemPrompt: `You are scheduling a demo for a qualified lead.

1. Propose a demo
2. Find convenient time
3. Confirm contact details
4. Set expectations

Keep responses under 25 words.`,
      extractVariables: [
        {
          variableName: "wantsDemo",
          dataType: "Boolean",
          extractionPrompt: "Does the prospect want to schedule a demo?"
        },
        {
          variableName: "demoDate",
          dataType: "String",
          extractionPrompt: "What date works for the demo?"
        },
        {
          variableName: "demoTime",
          dataType: "String",
          extractionPrompt: "What time works for the demo?"
        }
      ]
    },
    {
      id: "not_qualified",
      type: "conversation",
      firstMessage: "I understand. It sounds like the timing might not be right. Can I send you some information for future reference?",
      systemPrompt: `The lead is not currently qualified.

Be understanding and leave the door open.
Offer to send information or follow up later.
Keep responses under 20 words.`
    },
    {
      id: "demo_scheduled",
      type: "conversation",
      firstMessage: "Perfect! I've scheduled your demo. You'll receive a calendar invite shortly. I'm excited to show you what ZyxAI can do for your business!",
      systemPrompt: `Demo has been successfully scheduled.

Confirm the details and set expectations.
Express enthusiasm about the upcoming demo.
Keep responses under 25 words.`
    },
    {
      id: "end_call",
      type: "endCall",
      endMessage: "Thank you for your time! Looking forward to speaking with you soon."
    }
  ],
  edges: [
    { from: "start", to: "qualify_lead", condition: "availableToTalk == true" },
    { from: "start", to: "not_qualified", condition: "availableToTalk == false" },
    { from: "qualify_lead", to: "schedule_demo", condition: "decisionMaker == true && budget && timeline" },
    { from: "qualify_lead", to: "not_qualified", condition: "decisionMaker == false || !budget" },
    { from: "schedule_demo", to: "demo_scheduled", condition: "wantsDemo == true && demoDate" },
    { from: "schedule_demo", to: "not_qualified", condition: "wantsDemo == false" },
    { from: "not_qualified", to: "end_call", condition: "true" },
    { from: "demo_scheduled", to: "end_call", condition: "true" }
  ]
}

// Export all workflow presets
export const VapiWorkflowPresets = {
  appointmentScheduling: AppointmentSchedulingWorkflow,
  customerSupport: CustomerSupportWorkflow,
  salesQualification: SalesQualificationWorkflow
} as const

export type VapiWorkflowPresetType = keyof typeof VapiWorkflowPresets
