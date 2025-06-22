// ZyxAI Agent Service
// Handles AI agent creation, configuration, and management

import { supabase } from '@/lib/supabase'
import { AIAgent, AgentTemplate, BusinessNiche } from '@/types/database'

export class AgentService {

  // Get current user's agents (for client-side use)
  static async getAgents(): Promise<{ agents: AIAgent[]; error: string | null }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { agents: [], error: 'User not authenticated' }
      }

      // Get user's organization
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile?.organization_id) {
        return { agents: [], error: 'User organization not found' }
      }

      // Get organization's agents
      return await this.getOrganizationAgents(profile.organization_id)
    } catch (error) {
      return { agents: [], error: 'Failed to fetch agents' }
    }
  }

  // Get organization's agents
  static async getOrganizationAgents(organizationId: string): Promise<{ agents: AIAgent[]; error: string | null }> {
    try {
      const { data: agents, error } = await supabase
        .from('ai_agents')
        .select(`
          *,
          template:agent_templates(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        return { agents: [], error: error.message }
      }

      return { agents: agents || [], error: null }
    } catch (error) {
      return { agents: [], error: 'Failed to fetch agents' }
    }
  }

  // Update agent configuration
  static async updateAgent(
    agentId: string,
    updates: Partial<Omit<AIAgent, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ agent: AIAgent | null; error: string | null }> {
    try {
      const { data: agent, error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', agentId)
        .select()
        .single()

      if (error) {
        return { agent: null, error: error.message }
      }

      return { agent, error: null }
    } catch (error) {
      return { agent: null, error: 'Failed to update agent' }
    }
  }

  // Delete agent
  static async deleteAgent(agentId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to delete agent' }
    }
  }

  // Get agent by ID with template details
  static async getAgent(agentId: string): Promise<{ agent: AIAgent | null; error: string | null }> {
    try {
      const { data: agent, error } = await supabase
        .from('ai_agents')
        .select(`
          *,
          template:agent_templates(*),
          organization:organizations(*)
        `)
        .eq('id', agentId)
        .single()

      if (error) {
        return { agent: null, error: error.message }
      }

      return { agent, error: null }
    } catch (error) {
      return { agent: null, error: 'Failed to fetch agent' }
    }
  }

  // Toggle agent active status
  static async toggleAgentStatus(agentId: string): Promise<{ agent: AIAgent | null; error: string | null }> {
    try {
      // Get current status
      const { data: currentAgent, error: fetchError } = await supabase
        .from('ai_agents')
        .select('is_active')
        .eq('id', agentId)
        .single()

      if (fetchError) {
        return { agent: null, error: fetchError.message }
      }

      // Toggle status
      const { data: agent, error } = await supabase
        .from('ai_agents')
        .update({ is_active: !currentAgent.is_active })
        .eq('id', agentId)
        .select()
        .single()

      if (error) {
        return { agent: null, error: error.message }
      }

      return { agent, error: null }
    } catch (error) {
      return { agent: null, error: 'Failed to toggle agent status' }
    }
  }

  // Get available voice options
  static getVoiceOptions() {
    return [
      { id: 'male_professional', name: 'Professional Male', description: 'Confident and authoritative' },
      { id: 'female_friendly', name: 'Friendly Female', description: 'Warm and approachable' },
      { id: 'male_warm', name: 'Warm Male', description: 'Caring and trustworthy' },
      { id: 'female_professional', name: 'Professional Female', description: 'Clear and competent' },
      { id: 'male_trustworthy', name: 'Trustworthy Male', description: 'Reliable and knowledgeable' },
      { id: 'female_caring', name: 'Caring Female', description: 'Compassionate and patient' },
      { id: 'male_sophisticated', name: 'Sophisticated Male', description: 'Refined and intelligent' },
      { id: 'male_practical', name: 'Practical Male', description: 'Straightforward and helpful' }
    ]
  }

  // Get personality traits options
  static getPersonalityTraits() {
    return {
      tone: [
        { value: 'professional', label: 'Professional' },
        { value: 'friendly', label: 'Friendly' },
        { value: 'confident', label: 'Confident' },
        { value: 'caring', label: 'Caring' },
        { value: 'trustworthy', label: 'Trustworthy' },
        { value: 'practical', label: 'Practical' }
      ],
      style: [
        { value: 'consultative', label: 'Consultative' },
        { value: 'direct', label: 'Direct' },
        { value: 'helpful', label: 'Helpful' },
        { value: 'persistent', label: 'Persistent' },
        { value: 'detailed', label: 'Detailed' },
        { value: 'straightforward', label: 'Straightforward' }
      ],
      energy: [
        { value: 'high', label: 'High Energy' },
        { value: 'medium', label: 'Medium Energy' },
        { value: 'calm', label: 'Calm' },
        { value: 'low', label: 'Low Energy' }
      ],
      approach: [
        { value: 'educational', label: 'Educational' },
        { value: 'service_oriented', label: 'Service Oriented' },
        { value: 'relationship_focused', label: 'Relationship Focused' },
        { value: 'solution_focused', label: 'Solution Focused' },
        { value: 'analytical', label: 'Analytical' },
        { value: 'patient_focused', label: 'Patient Focused' }
      ]
    }
  }

  // Validate agent configuration
  static validateAgentConfig(agent: Partial<AIAgent>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!agent.name || agent.name.trim().length < 2) {
      errors.push('Agent name must be at least 2 characters long')
    }

    if (!agent.agent_type) {
      errors.push('Agent type is required')
    }

    if (agent.name && agent.name.length > 50) {
      errors.push('Agent name must be less than 50 characters')
    }

    if (agent.description && agent.description.length > 500) {
      errors.push('Agent description must be less than 500 characters')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Get agent performance summary
  static async getAgentPerformance(agentId: string): Promise<{
    performance: {
      totalCalls: number
      successfulCalls: number
      averageDuration: number
      conversionRate: number
      lastCallDate?: string
    } | null
    error: string | null
  }> {
    try {
      // This would typically aggregate from calls table
      // For now, return mock data
      const performance = {
        totalCalls: 0,
        successfulCalls: 0,
        averageDuration: 0,
        conversionRate: 0
      }

      return { performance, error: null }
    } catch (error) {
      return { performance: null, error: 'Failed to fetch agent performance' }
    }
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
