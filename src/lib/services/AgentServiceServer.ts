// ZyxAI Agent Service - Server Side
// Handles server-side AI agent operations that require admin privileges

import { createClient } from '@supabase/supabase-js'
import { AIAgent, AgentTemplate } from '@/types/database'
import { VapiService } from './VapiService'

// Service role client for server-side operations that bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export class AgentServiceServer {

  // Create AI agent from template (server-side only)
  static async createAgentFromTemplate(
    organizationId: string,
    templateId: string,
    customizations?: {
      name?: string
      description?: string
      personality?: any
      voice_config?: any
      script_config?: any
    }
  ): Promise<{ agent: AIAgent | null; error: string | null }> {
    try {
      console.log(`🤖 AgentServiceServer: Creating agent from template ${templateId} for org ${organizationId}`)

      // Get template details
      const { data: template, error: templateError } = await supabaseAdmin
        .from('agent_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError || !template) {
        console.log(`❌ Template not found: ${templateError?.message}`)
        return { agent: null, error: 'Template not found' }
      }

      console.log(`✅ Template found: ${template.name}`)

      // Create agent with template defaults and customizations
      const agentData = {
        organization_id: organizationId,
        template_id: templateId,
        name: customizations?.name || template.name,
        description: customizations?.description || template.description,
        avatar_url: template.avatar_url,
        agent_type: template.agent_type,
        personality: customizations?.personality || template.personality,
        voice_config: customizations?.voice_config || template.default_voice_config,
        script_config: customizations?.script_config || template.default_script,
        skills: template.skills,
        is_active: true,
        performance_metrics: {}
      }

      // Try to create Vapi assistant (optional - continue if it fails)
      let vapiAssistantId = null
      try {
        const systemPrompt = this.generateSystemPrompt(template, agentData.personality)
        const firstMessage = agentData.script_config?.greeting || template.default_script?.greeting || "Hello! How can I help you today?"

        const { assistant: vapiAssistant, error: vapiError } = await VapiService.createAssistant({
          name: agentData.name,
          firstMessage,
          systemPrompt,
          voiceId: agentData.voice_config?.voice_id,
          model: 'gpt-4o',
          temperature: 0.7,
          agentType: template.agent_type
        })

        if (vapiAssistant && !vapiError) {
          vapiAssistantId = vapiAssistant.id
          console.log(`✅ Created Vapi assistant for ${agentData.name}:`, vapiAssistantId)
        } else {
          console.warn(`⚠️ Failed to create Vapi assistant for ${agentData.name}:`, vapiError)
        }
      } catch (vapiErr) {
        console.warn(`⚠️ Vapi integration error for ${agentData.name}:`, vapiErr)
        // Continue without Vapi - agent will still be created in database
      }

      // Add Vapi assistant ID to agent data if available
      if (vapiAssistantId) {
        agentData.voice_config = {
          ...agentData.voice_config,
          vapi_assistant_id: vapiAssistantId
        }
      }

      // Create agent in database using admin client to bypass RLS
      console.log('🤖 Inserting agent data:', agentData)
      const { data: agent, error } = await supabaseAdmin
        .from('ai_agents')
        .insert(agentData)
        .select()
        .single()

      if (error) {
        console.log(`❌ Database error: ${error.message}`)
        return { agent: null, error: error.message }
      }

      console.log(`✅ Agent created successfully: ${agent.name}`)
      return { agent, error: null }
    } catch (error) {
      console.log(`❌ AgentServiceServer error: ${error}`)
      return { agent: null, error: 'Failed to create agent' }
    }
  }

  // Update agent with Vapi synchronization
  static async updateAgentWithVapiSync(
    agentId: string,
    updates: Partial<AIAgent>
  ): Promise<{ agent: AIAgent | null; error: string | null }> {
    try {
      console.log(`🤖 AgentServiceServer: Updating agent ${agentId} with Vapi sync`)

      // First, get the current agent data
      const { data: currentAgent, error: fetchError } = await supabaseAdmin
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single()

      if (fetchError || !currentAgent) {
        console.log(`❌ Agent not found: ${fetchError?.message}`)
        return { agent: null, error: 'Agent not found' }
      }

      // Update agent in database
      const { data: updatedAgent, error: updateError } = await supabaseAdmin
        .from('ai_agents')
        .update(updates)
        .eq('id', agentId)
        .select()
        .single()

      if (updateError) {
        console.log(`❌ Database update error: ${updateError.message}`)
        return { agent: null, error: updateError.message }
      }

      // Sync with Vapi if assistant ID exists
      const vapiAssistantId = currentAgent.voice_config?.vapi_assistant_id
      if (vapiAssistantId) {
        try {
          console.log(`🤖 Syncing with Vapi assistant: ${vapiAssistantId}`)

          // Prepare Vapi update data
          const vapiUpdates: any = {}

          // Update name if changed
          if (updates.name && updates.name !== currentAgent.name) {
            vapiUpdates.name = updates.name
          }

          // Update voice if changed
          if (updates.voice_config?.voice_id && updates.voice_config.voice_id !== currentAgent.voice_config?.voice_id) {
            vapiUpdates.voice = this.getVapiVoiceConfig(updates.voice_config.voice_id)
          }

          // Update first message if script changed
          if (updates.script_config?.greeting) {
            vapiUpdates.firstMessage = updates.script_config.greeting
          }

          // Note: System prompt updates are disabled due to Vapi API constraints
          // The system prompt is set during assistant creation and cannot be updated via PATCH
          // This is a limitation of the current Vapi API

          // Update Vapi assistant if there are changes
          if (Object.keys(vapiUpdates).length > 0) {
            const { success, error: vapiError } = await VapiService.updateAssistant(vapiAssistantId, vapiUpdates)

            if (success) {
              console.log(`✅ Vapi assistant updated successfully`)
            } else {
              console.warn(`⚠️ Vapi update failed: ${vapiError}`)
              // Continue anyway - local update succeeded
            }
          }
        } catch (vapiErr) {
          console.warn(`⚠️ Vapi sync error: ${vapiErr}`)
          // Continue anyway - local update succeeded
        }
      } else {
        console.log(`ℹ️ No Vapi assistant ID found, skipping Vapi sync`)
      }

      console.log(`✅ Agent updated successfully: ${updatedAgent.name}`)
      return { agent: updatedAgent, error: null }
    } catch (error) {
      console.log(`❌ AgentServiceServer update error: ${error}`)
      return { agent: null, error: 'Failed to update agent' }
    }
  }

  // Get Vapi voice configuration from custom voice ID
  private static getVapiVoiceConfig(customVoiceId?: string): { provider: string; voiceId: string } {
    const voiceMapping: Record<string, { provider: string; voiceId: string }> = {
      'male_professional': { provider: 'azure', voiceId: 'en-US-AndrewNeural' },
      'female_friendly': { provider: 'azure', voiceId: 'en-US-JennyNeural' },
      'male_warm': { provider: 'azure', voiceId: 'en-US-BrianNeural' },
      'female_professional': { provider: 'azure', voiceId: 'en-US-EmmaNeural' },
      'male_trustworthy': { provider: 'azure', voiceId: 'en-US-GuyNeural' },
      'female_caring': { provider: 'azure', voiceId: 'en-US-AriaNeural' },
      'male_sophisticated': { provider: 'azure', voiceId: 'en-US-DavisNeural' },
      'male_practical': { provider: 'azure', voiceId: 'en-US-JasonNeural' }
    }

    if (!customVoiceId) {
      return voiceMapping['male_professional'] // Default
    }
    return voiceMapping[customVoiceId] || voiceMapping['male_professional']
  }

  // Generate system prompt from agent data
  private static generateSystemPromptFromAgent(agent: AIAgent, personality: any): string {
    const basePrompt = `You are ${agent.name}, a ${agent.agent_type.replace('_', ' ')} AI assistant.

Description: ${agent.description}

Personality Traits:
- Tone: ${personality?.tone || 'professional'}
- Style: ${personality?.style || 'helpful'}
- Energy: ${personality?.energy || 'medium'}
- Approach: ${personality?.approach || 'service_oriented'}

Skills: ${(agent.skills as string[])?.join(', ') || 'general assistance'}

Instructions:
1. Always maintain your personality traits in conversations
2. Keep responses concise and under 30 words when possible
3. Ask clarifying questions when needed
4. Be helpful and professional at all times
5. If you don't know something, admit it and offer to help in other ways

Remember: You are representing a professional business, so maintain high standards of communication.`

    return basePrompt
  }

  // Generate system prompt for Vapi assistant
  private static generateSystemPrompt(template: any, personality: any): string {
    const basePrompt = `You are ${template.name}, a ${template.agent_type.replace('_', ' ')} AI assistant.

Description: ${template.description}

Personality Traits:
- Tone: ${personality?.tone || 'professional'}
- Style: ${personality?.style || 'helpful'}
- Energy: ${personality?.energy || 'medium'}
- Approach: ${personality?.approach || 'service_oriented'}

Skills: ${template.skills?.join(', ') || 'general assistance'}

Instructions:
1. Always maintain your personality traits in conversations
2. Keep responses concise and under 30 words when possible
3. Ask clarifying questions when needed
4. Be helpful and professional at all times
5. If you don't know something, admit it and offer to help in other ways

Remember: You are representing a professional business, so maintain high standards of communication.`

    return basePrompt
  }
}
