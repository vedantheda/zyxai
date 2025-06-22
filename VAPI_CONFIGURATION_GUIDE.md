# 🎯 Complete VAPI Configuration Guide for ZyxAI

## 📋 Overview

This guide covers all VAPI configurations available in ZyxAI, based on comprehensive VAPI documentation from Context7. ZyxAI now includes advanced voice AI capabilities with complete VAPI integration.

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Required VAPI API Keys
VAPI_API_KEY=your_private_key_here
VAPI_PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_public_key_here

# Application URL for webhooks
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 2. Access VAPI Configuration Dashboard
Navigate to: `http://localhost:3001/dashboard/vapi-config`

## 🎤 Business Presets

### Real Estate Agent (Alex)
```typescript
// Optimized for property inquiries and lead qualification
const realEstateConfig = {
  name: "Alex - Real Estate Agent",
  voice: { provider: "azure", voiceId: "en-US-AndrewNeural" },
  model: { provider: "openai", model: "gpt-4o" },
  tools: ["schedulePropertyViewing", "getPropertyDetails"],
  analysisPlan: { enabled: true, leadQualification: true }
}
```

### Customer Support (Jessica)
```typescript
// Designed for customer service and issue resolution
const customerSupportConfig = {
  name: "Jessica - Customer Support",
  voice: { provider: "azure", voiceId: "en-US-EmmaNeural" },
  model: { provider: "openai", model: "gpt-4o" },
  tools: ["transferCall", "createSupportTicket"],
  hooks: [{ on: "pipeline-error", do: [{ type: "transfer" }] }]
}
```

### Appointment Scheduler (Sam)
```typescript
// Optimized for booking and scheduling
const appointmentConfig = {
  name: "Sam - Appointment Scheduler",
  voice: { provider: "azure", voiceId: "en-US-JennyNeural" },
  model: { provider: "openai", model: "gpt-4o" },
  tools: ["checkAvailability", "bookAppointment"],
  keypadInputPlan: { enabled: true, delimiters: "#" }
}
```

## 🔄 Advanced Workflows

### 1. Appointment Scheduling Workflow
```typescript
const appointmentWorkflow = {
  nodes: [
    { id: "start", type: "conversation", extractVariables: ["intent"] },
    { id: "schedule_appointment", type: "conversation" },
    { id: "reschedule_appointment", type: "conversation" },
    { id: "cancel_appointment", type: "conversation" },
    { id: "end_call", type: "endCall" }
  ],
  edges: [
    { from: "start", to: "schedule_appointment", condition: "intent == 'schedule'" },
    { from: "start", to: "reschedule_appointment", condition: "intent == 'reschedule'" }
  ]
}
```

### 2. Customer Support Workflow
```typescript
const supportWorkflow = {
  nodes: [
    { id: "start", type: "conversation", extractVariables: ["issueCategory"] },
    { id: "technical_support", type: "conversation" },
    { id: "billing_support", type: "conversation" },
    { id: "escalate_to_specialist", type: "transfer" }
  ]
}
```

### 3. Sales Qualification Workflow
```typescript
const salesWorkflow = {
  nodes: [
    { id: "start", type: "conversation", extractVariables: ["availableToTalk"] },
    { id: "qualify_lead", type: "conversation" },
    { id: "schedule_demo", type: "conversation" },
    { id: "demo_scheduled", type: "conversation" }
  ]
}
```

## 🛠️ Advanced Configuration Options

### Voice Settings with Fallbacks
```typescript
const voiceConfig = {
  provider: "azure",
  voiceId: "en-US-AndrewNeural",
  speed: 1.0,
  fallbackPlan: {
    voices: [
      { provider: "openai", voiceId: "onyx" },
      { provider: "playht", voiceId: "matthew" }
    ]
  }
}
```

### Transcriber with Fallbacks
```typescript
const transcriberConfig = {
  provider: "deepgram",
  model: "nova-2",
  language: "en-US",
  enableUniversalStreamingApi: true,
  fallbackPlan: {
    transcribers: [
      { provider: "assembly-ai", model: "best" },
      { provider: "azure", enableUniversalStreamingApi: false }
    ]
  }
}
```

### Analysis and Recording
```typescript
const analysisConfig = {
  summaryPlan: {
    enabled: true,
    prompt: "Summarize this conversation, focusing on key points and outcomes."
  },
  successEvaluationPlan: {
    enabled: true,
    prompt: "Evaluate if this conversation achieved its intended goals.",
    rubric: "NumericScale"
  },
  structuredDataPlan: {
    enabled: true,
    prompt: "Extract: customer name, contact details, main request, resolution status."
  }
}
```

### Advanced Hooks
```typescript
const hooksConfig = [
  {
    on: "assistant.speech.interrupted",
    do: [{ type: "say", exact: ["Sorry, go ahead", "Please continue"] }]
  },
  {
    on: "pipeline-error",
    do: [{ type: "say", exact: ["I'm having a technical issue. Let me try again."] }]
  },
  {
    on: "call.ending",
    filters: [{ type: "oneOf", key: "call.endedReason", oneOf: ["pipeline-error"] }],
    do: [{ type: "transfer", destination: { type: "number", number: "+1-800-SUPPORT" } }]
  }
]
```

## 📞 Phone Number Configuration

### Basic Phone Number Setup
```typescript
const phoneConfig = {
  provider: "vapi",
  assistantId: "your-assistant-id",
  name: "Main Business Line",
  inboundSettings: {
    maxCallDurationMinutes: 30,
    recordingEnabled: true,
    voicemailDetectionEnabled: true
  }
}
```

### Advanced Phone Number with Hooks
```typescript
const advancedPhoneConfig = {
  provider: "twilio",
  credentialId: "your-twilio-credential-id",
  workflowId: "your-workflow-id",
  hooks: [{
    on: "call.ringing",
    do: [{
      type: "transfer",
      destination: {
        type: "number",
        number: "+1-555-BACKUP",
        callerId: "+1-555-MAIN"
      }
    }]
  }]
}
```

## 👥 Squad Configuration

### Multi-Assistant Squad
```typescript
const squadConfig = {
  members: [
    {
      assistant: realEstateConfig,
      assistantDestinations: [{
        type: "assistant",
        assistantName: "Property Specialist",
        message: "Let me transfer you to our property specialist.",
        description: "For detailed property questions"
      }]
    },
    {
      assistantId: "support-assistant-id",
      assistantDestinations: [{
        type: "assistant",
        assistantName: "Technical Support",
        message: "Transferring to technical support.",
        description: "For technical issues"
      }]
    }
  ]
}
```

## 🔧 Tools and Functions

### Custom Function Tool
```typescript
const customTool = {
  type: "function",
  function: {
    name: "scheduleAppointment",
    description: "Schedule an appointment for the customer",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Appointment date" },
        time: { type: "string", description: "Appointment time" },
        serviceType: { type: "string", description: "Type of service needed" },
        customerName: { type: "string", description: "Customer's name" },
        customerPhone: { type: "string", description: "Customer's phone number" }
      },
      required: ["date", "time", "serviceType", "customerName"]
    }
  },
  server: {
    url: "https://your-app.com/api/webhooks/vapi",
    secret: "your-webhook-secret"
  }
}
```

### Transfer Tool
```typescript
const transferTool = {
  type: "transferCall",
  destinations: [{
    type: "number",
    number: "+1-555-SPECIALIST",
    message: "Let me transfer you to a specialist who can better assist you.",
    description: "Transfer to human specialist",
    numberE164CheckEnabled: true
  }]
}
```

### SMS Tool
```typescript
const smsTool = {
  type: "sms",
  metadata: {
    from: "+1-555-BUSINESS"
  },
  function: {
    name: "sendFollowUpSMS",
    description: "Send follow-up SMS to customer",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string" },
        customerPhone: { type: "string" }
      }
    }
  }
}
```

## 🎯 API Usage Examples

### Create Assistant with Preset
```typescript
// Using business preset
const response = await fetch('/api/vapi/assistants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(VapiBusinessPresets.realEstate)
})
```

### Create Workflow
```typescript
const response = await fetch('/api/vapi/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Customer Support Workflow",
    ...VapiWorkflowPresets.customerSupport
  })
})
```

### Create Squad Call
```typescript
const response = await fetch('/api/vapi/calls', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    squadId: "your-squad-id",
    phoneNumberId: "your-phone-id",
    customer: {
      number: "+1-555-CUSTOMER",
      name: "John Doe"
    }
  })
})
```

## 🔍 Testing and Debugging

### Test VAPI Integration
Visit: `http://localhost:3001/test-vapi`

### Available Test Functions
- **Test Frontend Integration** - Verify API connectivity
- **Test Daily.co Connectivity** - Check WebRTC compatibility
- **Test Direct Script Load** - Validate browser compatibility
- **Start Test Call** - Full voice integration test

### Browser Console Debugging
```javascript
// Enable detailed VAPI logging
localStorage.setItem('vapi-debug', 'true')

// Check VAPI instance
console.log('VAPI Instance:', window.vapiInstance)

// Monitor call events
window.vapiInstance?.on('call-start', () => console.log('Call started'))
window.vapiInstance?.on('message', (msg) => console.log('Message:', msg))
```

## 📊 Analytics and Monitoring

### Call Analytics
- **Success Rate** - Percentage of successful calls
- **Average Duration** - Mean call length
- **Resolution Rate** - Issues resolved per call
- **Customer Satisfaction** - Based on success evaluation

### Performance Metrics
- **Response Time** - Assistant response latency
- **Transcription Accuracy** - Speech-to-text quality
- **Voice Quality** - Audio clarity metrics
- **Error Rate** - Failed call percentage

## 🚀 Production Deployment

### Environment Variables
```bash
# Production VAPI Configuration
VAPI_API_KEY=prod_private_key
NEXT_PUBLIC_VAPI_PUBLIC_KEY=prod_public_key
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Webhook Security
VAPI_WEBHOOK_SECRET=your_secure_webhook_secret
```

### Security Best Practices
1. **Never expose private keys** in client-side code
2. **Use webhook secrets** for server validation
3. **Implement rate limiting** on API endpoints
4. **Monitor call logs** for suspicious activity
5. **Use HTTPS** for all webhook endpoints

## 📚 Additional Resources

- **VAPI Documentation**: https://docs.vapi.ai
- **ZyxAI Dashboard**: `/dashboard/vapi-config`
- **Test Interface**: `/test-vapi`
- **API Reference**: `/api/vapi/*`

## 🆘 Troubleshooting

### Common Issues
1. **"Failed to fetch" errors** - Check CSP and CORS settings
2. **Krisp worklet errors** - Disable noise cancellation
3. **Microphone access denied** - Ensure HTTPS in production
4. **Call timeout** - Check network connectivity

### Support
For technical support, visit the VAPI configuration dashboard or check the test interface for detailed error information.
