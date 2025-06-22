/**
 * VAPI Business Configuration Presets for ZyxAI
 * Based on comprehensive VAPI documentation from Context7
 */

import { VapiAdvancedAssistantConfig, VapiTool, VapiWorkflowConfig } from '../types/VapiAdvancedConfig'

// ===== REAL ESTATE PRESETS =====

export const RealEstateAgentConfig: VapiAdvancedAssistantConfig = {
  name: "Alex - Real Estate Agent",
  firstMessage: "Hi! This is Alex from ZyxAI Real Estate. I'm calling about your interest in properties in your area. Do you have a moment to chat?",
  endCallMessage: "Thank you for your time! I'll follow up with the property details we discussed. Have a great day!",
  firstMessageMode: "assistant-speaks-first",

  model: {
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 400,
    messages: [{
      role: "system",
      content: `You are Alex, a professional real estate agent specializing in residential properties. You are knowledgeable, trustworthy, and focused on understanding client needs.

PERSONALITY:
- Professional yet approachable
- Excellent listener who asks clarifying questions
- Knowledgeable about market trends and property values
- Patient and never pushy

CONVERSATION FLOW:
1. Warm greeting and introduction
2. Qualify the lead (buying/selling, timeline, budget)
3. Understand their specific needs and preferences
4. Provide relevant market insights
5. Schedule viewing or follow-up meeting
6. Collect contact information

RESPONSE STYLE:
- Keep responses under 30 words for voice calls
- Ask one question at a time
- Use natural, conversational language
- Avoid real estate jargon
- Show genuine interest in helping

TOOLS AVAILABLE:
- Property search and details
- Market analysis
- Appointment scheduling
- Lead qualification

Remember: Your goal is to build trust and schedule a meeting, not to sell over the phone.`
    }],
    tools: [
      {
        type: "function",
        function: {
          name: "schedulePropertyViewing",
          description: "Schedule a property viewing appointment",
          parameters: {
            type: "object",
            properties: {
              propertyAddress: { type: "string" },
              preferredDate: { type: "string" },
              preferredTime: { type: "string" },
              clientName: { type: "string" },
              clientPhone: { type: "string" }
            },
            required: ["propertyAddress", "preferredDate", "clientName"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "getPropertyDetails",
          description: "Get details about a specific property",
          parameters: {
            type: "object",
            properties: {
              address: { type: "string" },
              propertyType: { type: "string" }
            },
            required: ["address"]
          }
        }
      }
    ]
  },

  voice: {
    provider: "azure",
    voiceId: "en-US-AndrewNeural",
    speed: 1.0,
    fallbackPlan: {
      voices: [
        { provider: "openai", voiceId: "onyx" },
        { provider: "playht", voiceId: "matthew" }
      ]
    }
  },

  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-US",
    enableUniversalStreamingApi: true
  },

  backgroundSound: "off",
  backgroundDenoisingEnabled: true,

  analysisPlan: {
    summaryPlan: {
      enabled: true,
      prompt: "Summarize this real estate call, focusing on client needs, property interests, and next steps."
    },
    successEvaluationPlan: {
      enabled: true,
      prompt: "Evaluate if this real estate call was successful in qualifying the lead and scheduling next steps.",
      rubric: "NumericScale"
    },
    structuredDataPlan: {
      enabled: true,
      prompt: "Extract: client name, phone, email, property type interest, budget range, timeline, preferred locations."
    }
  },

  artifactPlan: {
    recordingEnabled: true,
    recordingFormat: "mp3"
  },

  stopSpeakingPlan: {
    numWords: 0,
    voiceSeconds: 0.3,
    backoffSeconds: 1
  },

  hooks: [{
    on: "assistant.speech.interrupted",
    do: [{ type: "say", exact: ["Sorry, go ahead", "Please continue", "I'm listening"] }]
  }]
}

// ===== CUSTOMER SUPPORT PRESETS =====

export const CustomerSupportConfig: VapiAdvancedAssistantConfig = {
  name: "Jessica - Customer Support",
  firstMessage: "Hi! This is Jessica from ZyxAI customer support. I'm here to help you with any questions or issues. How can I assist you today?",
  endCallMessage: "Thank you for contacting us! Is there anything else I can help you with today?",

  model: {
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.6,
    maxTokens: 300,
    messages: [{
      role: "system",
      content: `You are Jessica, a helpful customer support representative for ZyxAI. You are empathetic, solution-focused, and committed to resolving customer issues.

PERSONALITY:
- Empathetic and understanding
- Patient and professional
- Solution-oriented
- Clear communicator

CONVERSATION FLOW:
1. Warm greeting and identify the issue
2. Gather relevant details and account information
3. Troubleshoot or provide solutions
4. Confirm resolution or escalate if needed
5. Offer additional assistance

RESPONSE STYLE:
- Keep responses under 25 words
- Acknowledge customer frustration
- Provide clear, step-by-step guidance
- Confirm understanding before proceeding

TOOLS AVAILABLE:
- Account lookup
- Ticket creation
- Knowledge base search
- Escalation to human agents

Remember: Customer satisfaction is the priority. If you can't resolve an issue, escalate appropriately.`
    }],
    tools: [
      {
        type: "transferCall",
        destinations: [{
          type: "number",
          number: "+1-800-SUPPORT",
          message: "Let me transfer you to a specialist who can better assist you.",
          description: "Transfer to human support agent"
        }]
      },
      {
        type: "function",
        function: {
          name: "createSupportTicket",
          description: "Create a support ticket for the customer",
          parameters: {
            type: "object",
            properties: {
              issue: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
              customerEmail: { type: "string" }
            },
            required: ["issue", "customerEmail"]
          }
        }
      }
    ]
  },

  voice: {
    provider: "azure",
    voiceId: "en-US-EmmaNeural",
    speed: 0.95,
    fallbackPlan: {
      voices: [
        { provider: "openai", voiceId: "nova" },
        { provider: "playht", voiceId: "jennifer" }
      ]
    }
  },

  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-US",
    enableUniversalStreamingApi: true
  },

  backgroundSound: "off",
  backgroundDenoisingEnabled: true,

  analysisPlan: {
    summaryPlan: {
      enabled: true,
      prompt: "Summarize this customer support call, focusing on the issue, resolution provided, and customer satisfaction."
    },
    successEvaluationPlan: {
      enabled: true,
      prompt: "Evaluate if this support call successfully resolved the customer's issue.",
      rubric: "NumericScale"
    }
  },

  stopSpeakingPlan: {
    numWords: 0,
    voiceSeconds: 0.2,
    backoffSeconds: 0.8
  },

  hooks: [{
    on: "call.ending",
    filters: [{
      type: "oneOf",
      key: "call.endedReason",
      oneOf: ["pipeline-error"]
    }],
    do: [{
      type: "transfer",
      destination: {
        type: "number",
        number: "+1-800-SUPPORT",
        message: "I'm transferring you to our technical support team."
      }
    }]
  }]
}

// ===== APPOINTMENT SCHEDULING PRESETS =====

export const AppointmentSchedulerConfig: VapiAdvancedAssistantConfig = {
  name: "Sam - Appointment Scheduler",
  firstMessage: "Hello! This is Sam from ZyxAI. I'm calling to help you schedule an appointment. Do you have a few minutes?",
  endCallMessage: "Perfect! Your appointment is confirmed. You'll receive a confirmation message shortly. Thank you!",

  model: {
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.5,
    maxTokens: 250,
    messages: [{
      role: "system",
      content: `You are Sam, an efficient appointment scheduling assistant. You are organized, friendly, and focused on finding the best appointment times.

PERSONALITY:
- Organized and efficient
- Friendly and accommodating
- Clear about availability and options
- Helpful with rescheduling

CONVERSATION FLOW:
1. Greet and explain purpose
2. Understand appointment type needed
3. Check availability and preferences
4. Confirm appointment details
5. Provide confirmation and next steps

RESPONSE STYLE:
- Keep responses under 20 words
- Offer specific time options
- Confirm details clearly
- Be flexible with scheduling

TOOLS AVAILABLE:
- Calendar availability check
- Appointment booking
- Confirmation sending
- Rescheduling

Remember: Make scheduling as easy as possible for the customer.`
    }],
    tools: [
      {
        type: "function",
        function: {
          name: "checkAvailability",
          description: "Check available appointment slots",
          parameters: {
            type: "object",
            properties: {
              serviceType: { type: "string" },
              preferredDate: { type: "string" },
              preferredTime: { type: "string" }
            },
            required: ["serviceType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "bookAppointment",
          description: "Book an appointment slot",
          parameters: {
            type: "object",
            properties: {
              date: { type: "string" },
              time: { type: "string" },
              serviceType: { type: "string" },
              customerName: { type: "string" },
              customerPhone: { type: "string" },
              customerEmail: { type: "string" }
            },
            required: ["date", "time", "serviceType", "customerName", "customerPhone"]
          }
        }
      }
    ]
  },

  voice: {
    provider: "azure",
    voiceId: "en-US-JennyNeural",
    speed: 1.05,
    fallbackPlan: {
      voices: [
        { provider: "openai", voiceId: "shimmer" },
        { provider: "playht", voiceId: "melissa" }
      ]
    }
  },

  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-US",
    enableUniversalStreamingApi: true
  },

  backgroundSound: "off",
  backgroundDenoisingEnabled: true,

  analysisPlan: {
    summaryPlan: {
      enabled: true,
      prompt: "Summarize this appointment scheduling call, including appointment details and customer preferences."
    },
    structuredDataPlan: {
      enabled: true,
      prompt: "Extract: appointment date, time, service type, customer name, phone, email, special requests."
    }
  },

  stopSpeakingPlan: {
    numWords: 0,
    voiceSeconds: 0.25,
    backoffSeconds: 0.5
  },

  keypadInputPlan: {
    enabled: true,
    delimiters: "#",
    timeoutSeconds: 3
  }
}

// Export all presets
export const VapiBusinessPresets = {
  realEstate: RealEstateAgentConfig,
  customerSupport: CustomerSupportConfig,
  appointmentScheduler: AppointmentSchedulerConfig
} as const

export type VapiBusinessPresetType = keyof typeof VapiBusinessPresets
