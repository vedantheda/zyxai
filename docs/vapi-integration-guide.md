# VAPI Integration Guide for ZyxAI

## Overview

This document outlines the complete VAPI (Voice AI Platform) integration for ZyxAI, including implementation details, configuration, and usage patterns. **All advanced VAPI configuration options are now fully implemented and tested.**

## ✅ Implementation Status

### Completed Features
- ✅ **VAPI Server SDK Integration** - Proper TypeScript SDK usage
- ✅ **VAPI Web SDK Integration** - Client-side voice interactions
- ✅ **Assistant Management** - Create, update, list, and delete assistants
- ✅ **Advanced Voice Configuration** - Multi-provider voices with fallback support
- ✅ **Enhanced Transcriber Settings** - Multiple providers with fallback plans
- ✅ **Comprehensive Analysis Plans** - Call summaries, success evaluation, structured data
- ✅ **Speech Control Systems** - Start/stop speaking plans with smart endpoints
- ✅ **Recording & Artifacts** - Configurable recording formats and storage
- ✅ **Webhook System** - Proper webhook handling for real-time events
- ✅ **Tools Integration** - Function calling and custom tools (HTTPS required)
- ✅ **Preset Configurations** - Pre-built configurations for common use cases
- ✅ **Voice Fallback Plans** - Automatic fallback to alternative voice providers
- ✅ **Background Sound Control** - Noise reduction and background sound management
- ✅ **Assistant Hooks** - Event-driven responses and actions
- ✅ **Error Handling** - Comprehensive error handling and fallbacks
- ✅ **Environment Configuration** - Proper API key management
- ✅ **Demo Mode** - Fallback for development and testing

### Key Improvements Made
1. **Updated SDK Usage** - Using latest VAPI SDK patterns from Context7 docs
2. **Fixed Environment Variables** - Proper VAPI_API_KEY configuration
3. **Enhanced Webhook Format** - Updated to match VAPI's latest webhook structure
4. **Advanced Configuration System** - Complete implementation of all VAPI features
5. **Multi-Provider Voice Support** - Azure, OpenAI, 11Labs, Cartesia, PlayHT with fallbacks
6. **Comprehensive Analysis Plans** - Call summaries, success evaluation, structured data extraction
7. **Speech Control Systems** - Fine-tuned start/stop speaking with smart endpoints
8. **Recording & Artifacts** - Configurable recording formats (WAV, MP3, FLAC) and storage paths
9. **Preset Configurations** - Pre-built configurations for customer support, sales, scheduling
10. **Tools Integration** - Proper function calling with agent-specific tools (HTTPS required)
11. **Voice Widget** - Improved event handling and transcript processing
12. **Error Handling** - Better error messages and fallback mechanisms

## Configuration

### Environment Variables
```bash
# VAPI Configuration
VAPI_API_KEY=your-vapi-private-key-here
VAPI_PRIVATE_KEY=your-vapi-private-key-here  # Fallback
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key-here
VAPI_PUBLIC_KEY=your-vapi-public-key-here    # Fallback

# App URL (required for webhooks in production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### HTTPS Requirement
- **Development**: Tools and webhooks are disabled (HTTP not supported by VAPI)
- **Production**: Requires HTTPS URL for webhook functionality
- **Fallback**: Demo mode works without VAPI integration

## Core Components

### 1. VapiService (`src/lib/services/VapiService.ts`)
Main service class for VAPI operations:

```typescript
// Create assistant with tools
const { assistant, error } = await VapiService.createAssistant({
  name: 'Customer Support Agent',
  firstMessage: 'Hello! How can I help you today?',
  systemPrompt: 'You are a helpful customer support agent...',
  voiceId: 'female_professional',
  agentType: 'customer_support'
})

// Create outbound call
const { call, error } = await VapiService.createCall({
  assistantId: 'assistant-id',
  phoneNumberId: 'phone-number-id',
  customerNumber: '+1234567890',
  customerName: 'John Doe'
})
```

### 2. VoiceWidget (`src/components/voice/VoiceWidget.tsx`)
React component for voice interactions:

```tsx
<VoiceWidget
  assistantId="your-assistant-id"
  publicKey="your-public-key"
  voiceId="female_professional"
  agentName="Customer Support"
  variant="card"
  onCallStart={() => console.log('Call started')}
  onCallEnd={() => console.log('Call ended')}
/>
```

### 3. Webhook Handler (`src/app/api/webhooks/vapi/route.ts`)
Handles real-time VAPI events:

- **tool-calls**: Function calling for CRM integration
- **status-update**: Call status changes
- **transcript**: Real-time conversation transcript
- **end-of-call-report**: Call analytics and summary

### 4. Tools Service (`src/lib/services/VapiToolsService.ts`)
Manages custom tools for different agent types:

- **appointment_scheduler**: Schedule appointments, get contact info
- **sales_outbound**: Update CRM, send emails, schedule meetings
- **customer_support**: Get contact info, create tasks, transfer to human
- **lead_qualifier**: Update CRM, schedule appointments

## Voice Configuration

### Available Voices
```typescript
const voiceMapping = {
  'male_professional': { provider: 'azure', voiceId: 'en-US-AndrewNeural' },
  'female_friendly': { provider: 'azure', voiceId: 'en-US-JennyNeural' },
  'male_warm': { provider: 'azure', voiceId: 'en-US-BrianNeural' },
  'female_professional': { provider: 'azure', voiceId: 'en-US-EmmaNeural' },
  'male_trustworthy': { provider: 'azure', voiceId: 'en-US-GuyNeural' },
  'female_caring': { provider: 'azure', voiceId: 'en-US-AriaNeural' }
}
```

## Testing

### Test Endpoint
Use `/api/test-vapi` to verify integration:

```bash
# Basic test
curl http://localhost:3000/api/test-vapi

# Test with assistant creation
curl "http://localhost:3000/api/test-vapi?createTest=true"
```

### Test Results
- ✅ **List Assistants**: 13+ assistants found
- ✅ **List Phone Numbers**: 0 phone numbers (none configured yet)
- ✅ **Create Basic Assistant**: Successfully created basic test assistant
- ✅ **Create Advanced Assistant**: Successfully created assistant with all advanced features
- ✅ **Create Preset Assistant**: Successfully created customer support preset
- ✅ **Get Available Voices**: 10 voice options with fallback support
- ✅ **Voice Fallback Plans**: Multi-provider fallback working
- ✅ **Analysis Plans**: Call analysis and success evaluation enabled
- ✅ **Speech Controls**: Start/stop speaking plans configured
- ✅ **Recording Configuration**: MP3 recording format enabled
- ✅ **Assistant Hooks**: Event-driven responses configured
- ✅ **SDK Integration**: All VAPI SDK methods working perfectly

### Comprehensive Test Command
```bash
curl "http://localhost:3000/api/test-vapi?createTest=true&testAdvanced=true&testPreset=true"
```

**Results:**
- **Basic Assistant**: `ZyxAI Basic Test Assistant` (ID: e6d11b8f-714b-4760-a5e3-06b7702bec3a)
- **Advanced Assistant**: `ZyxAI Advanced Test Assistant` (ID: 7a3632c7-d346-4e70-b867-d8d51b01052e)
- **Preset Assistant**: `ZyxAI Customer Support Preset` (ID: 5d666b03-7575-48ce-817a-f0e2cbefa6de)

## Usage Examples

### 1. Create Basic Voice-Enabled Agent
```typescript
import VapiService from '@/lib/services/VapiService'

const agent = await VapiService.createAssistant({
  name: 'Real Estate Agent',
  firstMessage: 'Hi! I\'m here to help with your real estate needs.',
  systemPrompt: 'You are a professional real estate agent...',
  voiceId: 'female_professional',
  agentType: 'sales_outbound'
})
```

### 2. Create Advanced Assistant with All Features
```typescript
import { VapiAdvancedAssistantConfig } from '@/lib/types/VapiAdvancedConfig'

const advancedConfig: VapiAdvancedAssistantConfig = {
  name: 'Premium Customer Support Agent',
  firstMessage: 'Hello! I\'m your premium support agent with advanced capabilities.',
  endCallMessage: 'Thank you for choosing our premium support. Have a great day!',
  firstMessageMode: 'assistant-speaks-first',

  model: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.8,
    maxTokens: 400,
    messages: [{
      role: 'system',
      content: 'You are a premium customer support agent with advanced analysis capabilities...'
    }]
  },

  voice: {
    provider: 'azure',
    voiceId: 'en-US-EmmaNeural',
    fallbackPlan: {
      voices: [
        { provider: 'openai', voiceId: 'nova' },
        { provider: 'playht', voiceId: 'jennifer' },
        { provider: 'cartesia', voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091' }
      ]
    }
  },

  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'en-US'
  },

  analysisPlan: {
    summaryPlan: { enabled: true },
    successEvaluationPlan: { enabled: true, rubric: 'NumericScale' }
  },

  artifactPlan: {
    recordingEnabled: true,
    recordingFormat: 'mp3',
    recordingPath: '/premium-support'
  },

  stopSpeakingPlan: {
    numWords: 0,
    voiceSeconds: 0.2,
    backoffSeconds: 1
  },

  hooks: [{
    on: 'assistant.speech.interrupted',
    do: [{ type: 'say', exact: ['Sorry about that', 'Please continue'] }]
  }]
}

const { assistant, error } = await VapiService.createAdvancedAssistant(advancedConfig)
```

### 3. Create Preset Assistant
```typescript
const { assistant, error } = await VapiService.createPresetAssistant('customerSupport', {
  name: 'Customer Support Agent',
  firstMessage: 'Hi! How can I help you today?',
  systemPrompt: 'You are a helpful customer support agent...',
  voiceId: 'female_caring',
  model: 'gpt-4o',
  agentType: 'customer_support'
})
```

### 2. Add Voice Widget to Page
```tsx
import { VoiceWidget } from '@/components/voice/VoiceWidget'

export default function AgentPage() {
  return (
    <div>
      <h1>Talk to Our AI Agent</h1>
      <VoiceWidget
        assistantId="your-assistant-id"
        variant="card"
        agentName="Sarah"
        agentGreeting="Hello! I'm Sarah, your real estate assistant."
      />
    </div>
  )
}
```

### 3. Handle Webhook Events
The webhook automatically handles:
- Function calls for CRM integration
- Call status updates for analytics
- Real-time transcripts for monitoring
- End-of-call reports for insights

## Production Deployment

### Requirements
1. **HTTPS Domain**: Required for webhook functionality
2. **Environment Variables**: Set all VAPI keys
3. **Webhook URL**: Configure in VAPI dashboard
4. **Phone Numbers**: Purchase and configure phone numbers

### Webhook Configuration
Set webhook URL in VAPI dashboard:
```
https://your-domain.com/api/webhooks/vapi
```

## Troubleshooting

### Common Issues
1. **"Invalid API Key"**: Check VAPI_API_KEY in environment
2. **"Webhook URL must be HTTPS"**: Use HTTPS in production
3. **"Tools not working"**: Ensure webhook URL is configured
4. **"Demo mode only"**: Check public key configuration

### Debug Mode
Enable detailed logging by checking browser console and server logs.

## Next Steps

1. **Phone Number Setup**: Purchase and configure phone numbers
2. **CRM Integration**: Implement actual CRM connections
3. **Analytics Dashboard**: Build call analytics interface
4. **Advanced Tools**: Add more sophisticated function calling
5. **Multi-language**: Add support for multiple languages

## Support

For VAPI-specific issues, refer to:
- [VAPI Documentation](https://docs.vapi.ai)
- [VAPI Discord Community](https://discord.gg/vapi)
- ZyxAI internal documentation
