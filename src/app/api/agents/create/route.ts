import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { VapiService } from '@/lib/services/VapiService'

/**
 * Create Agent API - Direct agent creation (not template-based)
 * This handles creating custom agents with VAPI integration
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      agentType,
      personality,
      voiceConfig,
      scriptConfig,
      userId,
      organizationId
    } = body

    // Validate required fields
    if (!name || !agentType || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, agentType, userId'
      }, { status: 400 })
    }

    console.log(`🤖 Creating custom agent: ${name} for user ${userId}`)

    // Generate system prompt
    const systemPrompt = generateSystemPrompt({
      name,
      description,
      agentType,
      personality
    })

    // Get first message from script config or use default
    const firstMessage = scriptConfig?.greeting || 
      `Hello! This is ${name}. How can I help you today?`

    // Create VAPI assistant first
    let vapiAssistantId = null
    try {
      console.log(`🤖 Creating VAPI assistant for ${name}`)
      
      const vapiConfig = {
        name: name,
        firstMessage: firstMessage,
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.7,
          messages: [{
            role: 'system',
            content: systemPrompt
          }]
        },
        voice: {
          provider: voiceConfig?.provider || 'azure',
          voiceId: voiceConfig?.voiceId || 'en-US-JennyNeural',
          speed: voiceConfig?.speed || 1.0,
          stability: voiceConfig?.stability || 0.5,
          similarityBoost: voiceConfig?.similarityBoost || 0.75
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        }
      }

      const vapiAssistant = await VapiService.createAssistant(vapiConfig)
      
      if (vapiAssistant && !vapiAssistant.error) {
        vapiAssistantId = vapiAssistant.id
        console.log(`✅ VAPI assistant created: ${vapiAssistantId}`)
      } else {
        console.warn(`⚠️ VAPI assistant creation failed: ${vapiAssistant?.error}`)
        // Continue without VAPI - agent will still be created
      }
    } catch (vapiError: any) {
      console.warn(`⚠️ VAPI integration error: ${vapiError.message}`)
      // Continue without VAPI
    }

    // Prepare agent data for database
    const agentData = {
      name,
      description: description || `${name} - ${agentType.replace('_', ' ')} agent`,
      agent_type: agentType,
      user_id: userId,
      organization_id: organizationId,
      
      // Store configurations as JSONB
      personality: personality || {
        tone: 'professional',
        style: 'helpful',
        energy: 'medium',
        approach: 'service_oriented'
      },
      
      voice_config: {
        ...voiceConfig,
        vapi_assistant_id: vapiAssistantId
      },
      
      script_config: scriptConfig || {
        greeting: firstMessage,
        closing: "Thank you for your time. Have a great day!",
        objection_handling: "I understand your concern. Let me help address that."
      },
      
      // Default skills based on agent type
      skills: getDefaultSkills(agentType),
      
      // Status
      is_active: true,
      
      // Performance tracking
      performance_metrics: {
        total_calls: 0,
        successful_calls: 0,
        average_duration: 0,
        satisfaction_score: 0
      },
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert agent into database
    console.log(`🤖 Saving agent to database: ${name}`)
    const { data: agent, error: dbError } = await supabaseAdmin
      .from('agents')
      .insert(agentData)
      .select()
      .single()

    if (dbError) {
      console.error(`❌ Database error: ${dbError.message}`)
      
      // If we created a VAPI assistant but DB failed, clean up
      if (vapiAssistantId) {
        try {
          await VapiService.deleteAssistant(vapiAssistantId)
          console.log(`🧹 Cleaned up VAPI assistant: ${vapiAssistantId}`)
        } catch (cleanupError) {
          console.warn(`⚠️ Failed to cleanup VAPI assistant: ${cleanupError}`)
        }
      }
      
      return NextResponse.json({
        success: false,
        error: `Database error: ${dbError.message}`
      }, { status: 500 })
    }

    console.log(`✅ Agent created successfully: ${agent.name} (ID: ${agent.id})`)

    // Return success response
    return NextResponse.json({
      success: true,
      agent: {
        ...agent,
        vapiAssistantId,
        vapiIntegrated: !!vapiAssistantId
      },
      message: `Agent "${name}" created successfully${vapiAssistantId ? ' with VAPI integration' : ''}`
    }, { status: 201 })

  } catch (error: any) {
    console.error('Agent creation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create agent'
    }, { status: 500 })
  }
}

/**
 * Generate system prompt for agent
 */
function generateSystemPrompt(config: {
  name: string
  description?: string
  agentType: string
  personality?: any
}): string {
  const { name, description, agentType, personality } = config
  
  const agentTypeDescriptions = {
    'outbound_sales': 'sales representative focused on lead generation and conversion',
    'customer_support': 'customer service representative helping with inquiries and issues',
    'appointment_scheduling': 'scheduling coordinator managing appointments and bookings',
    'lead_qualification': 'lead qualification specialist identifying potential customers',
    'follow_up': 'follow-up specialist maintaining customer relationships',
    'survey_collection': 'survey specialist collecting feedback and data'
  }

  const typeDescription = agentTypeDescriptions[agentType as keyof typeof agentTypeDescriptions] || 
    agentType.replace('_', ' ') + ' specialist'

  return `You are ${name}, a professional ${typeDescription}.

${description ? `Description: ${description}` : ''}

Personality Traits:
- Tone: ${personality?.tone || 'professional'}
- Style: ${personality?.style || 'helpful'}
- Energy: ${personality?.energy || 'medium'}
- Approach: ${personality?.approach || 'service_oriented'}

Core Instructions:
1. Always maintain your personality traits in conversations
2. Keep responses concise and under 30 words when possible
3. Ask clarifying questions when needed
4. Be helpful and professional at all times
5. If you don't know something, admit it and offer to help in other ways
6. Stay focused on your role as a ${typeDescription}

Communication Guidelines:
- Use natural, conversational language
- Be empathetic and understanding
- Listen actively to customer needs
- Provide clear and actionable information
- Maintain a positive and solution-oriented attitude

Remember: You are representing a professional business, so maintain high standards of communication while being personable and engaging.`
}

/**
 * Get default skills based on agent type
 */
function getDefaultSkills(agentType: string): string[] {
  const skillMap = {
    'outbound_sales': ['lead_generation', 'objection_handling', 'closing_techniques', 'product_knowledge'],
    'customer_support': ['problem_solving', 'empathy', 'technical_knowledge', 'escalation_management'],
    'appointment_scheduling': ['calendar_management', 'time_coordination', 'confirmation_calls', 'rescheduling'],
    'lead_qualification': ['needs_assessment', 'budget_qualification', 'timeline_identification', 'decision_maker_identification'],
    'follow_up': ['relationship_building', 'nurturing', 'feedback_collection', 'retention'],
    'survey_collection': ['data_collection', 'question_asking', 'response_recording', 'survey_completion']
  }

  return skillMap[agentType as keyof typeof skillMap] || ['general_assistance', 'communication', 'problem_solving']
}
