/**
 * Template Deployment Service
 * Handles the deployment of industry templates to create working agents and campaigns
 */

import VapiService from './VapiService'
import { supabaseAdmin } from '@/lib/supabase'
import { getIndustryTemplate, type IndustryTemplate, type AgentTemplate } from '@/lib/templates/IndustryTemplates'

interface DeploymentConfig {
  industryId: string
  companyInfo: {
    name: string
    phone: string
    website?: string
    address?: string
  }
  customization: {
    agentNames: Record<string, string>
    companyGreeting?: string
    businessHours?: string
  }
  userId: string
  organizationId?: string
}

interface DeploymentResult {
  success: boolean
  agents: Array<{
    id: string
    vapiAssistantId: string
    name: string
    role: string
  }>
  campaigns: Array<{
    id: string
    name: string
    agentId: string
  }>
  workflows: Array<{
    id: string
    name: string
  }>
  error?: string
}

export class TemplateDeploymentService {
  private vapiService: VapiService

  constructor() {
    this.vapiService = new VapiService()
  }

  /**
   * Deploy a complete industry template
   */
  async deployTemplate(config: DeploymentConfig): Promise<DeploymentResult> {
    const result: DeploymentResult = {
      success: false,
      agents: [],
      campaigns: [],
      workflows: []
    }

    try {
      // Get the template
      const template = getIndustryTemplate(config.industryId)
      if (!template) {
        throw new Error(`Template not found: ${config.industryId}`)
      }

      console.log(`Deploying ${template.name} template for ${config.companyInfo.name}`)

      // Deploy agents
      for (const agentTemplate of template.agents) {
        try {
          const agent = await this.deployAgent(agentTemplate, config, template)
          result.agents.push(agent)
          console.log(`✅ Agent deployed: ${agent.name}`)
        } catch (error: any) {
          console.error(`❌ Failed to deploy agent ${agentTemplate.name}:`, error.message)
          // Continue with other agents
        }
      }

      // Deploy campaigns
      for (const campaignTemplate of template.campaigns) {
        try {
          const campaign = await this.deployCampaign(campaignTemplate, config, template, result.agents)
          result.campaigns.push(campaign)
          console.log(`✅ Campaign deployed: ${campaign.name}`)
        } catch (error: any) {
          console.error(`❌ Failed to deploy campaign ${campaignTemplate.name}:`, error.message)
          // Continue with other campaigns
        }
      }

      // Deploy workflows
      for (const workflowTemplate of template.workflows) {
        try {
          const workflow = await this.deployWorkflow(workflowTemplate, config, template)
          result.workflows.push(workflow)
          console.log(`✅ Workflow deployed: ${workflow.name}`)
        } catch (error: any) {
          console.error(`❌ Failed to deploy workflow ${workflowTemplate.name}:`, error.message)
          // Continue with other workflows
        }
      }

      result.success = result.agents.length > 0 // Success if at least one agent was deployed

      if (result.success) {
        // Mark template as deployed for user
        await this.markTemplateDeployed(config.userId, config.industryId, template.name)
      }

      return result

    } catch (error: any) {
      console.error('Template deployment failed:', error)
      result.error = error.message
      return result
    }
  }

  /**
   * Deploy a single agent from template
   */
  private async deployAgent(
    agentTemplate: AgentTemplate,
    config: DeploymentConfig,
    template: IndustryTemplate
  ) {
    // Customize the agent with company information
    const customizedPrompt = this.customizeSystemPrompt(
      agentTemplate.systemPrompt,
      config.companyInfo,
      config.customization
    )

    const customizedFirstMessage = this.customizeFirstMessage(
      agentTemplate.firstMessage,
      config.companyInfo
    )

    const agentName = config.customization.agentNames[agentTemplate.id] || agentTemplate.name

    // Create VAPI assistant using the correct API format
    let vapiAssistantId = null
    try {
      const vapiResult = await VapiService.createAssistant({
        name: `${config.companyInfo.name} - ${agentName}`,
        firstMessage: customizedFirstMessage,
        systemPrompt: customizedPrompt,
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.7,
          messages: [{
            role: 'system',
            content: customizedPrompt
          }]
        },
        voice: {
          provider: agentTemplate.voice.provider as any,
          voiceId: agentTemplate.voice.voiceId,
          speed: agentTemplate.voice.speed,
          stability: 0.5,
          similarityBoost: 0.75
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        }
      })

      if (vapiResult && !vapiResult.error) {
        vapiAssistantId = vapiResult.id || (vapiResult as any).assistant?.id
        console.log(`✅ VAPI assistant created: ${vapiAssistantId}`)
      } else {
        console.warn(`⚠️ VAPI assistant creation failed: ${vapiResult?.error}`)
        // Continue without VAPI - agent will still be created
      }
    } catch (vapiError: any) {
      console.warn(`⚠️ VAPI integration error: ${vapiError.message}`)
      // Continue without VAPI
    }

    // Save agent to database
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .insert({
        name: agentName,
        type: agentTemplate.role.toLowerCase().replace(/\s+/g, '_'),
        voice_settings: {
          provider: agentTemplate.voice.provider,
          voice_id: agentTemplate.voice.voiceId,
          speed: agentTemplate.voice.speed,
          pitch: agentTemplate.voice.pitch
        },
        system_prompt: customizedPrompt,
        first_message: customizedFirstMessage,
        vapi_assistant_id: vapiAssistantId,
        user_id: config.userId,
        organization_id: config.organizationId,
        industry_template: template.id,
        template_agent_id: agentTemplate.id,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save agent to database: ${error.message}`)
    }

    return {
      id: agent.id,
      vapiAssistantId: vapiAssistantId,
      name: agentName,
      role: agentTemplate.role
    }
  }

  /**
   * Deploy a campaign from template
   */
  private async deployCampaign(
    campaignTemplate: any,
    config: DeploymentConfig,
    template: IndustryTemplate,
    deployedAgents: any[]
  ) {
    // Find the corresponding deployed agent
    const agent = deployedAgents.find(a =>
      template.agents.find(ta => ta.id === campaignTemplate.agentId)
    )

    if (!agent) {
      throw new Error(`Agent not found for campaign: ${campaignTemplate.name}`)
    }

    // Save campaign to database
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        name: campaignTemplate.name,
        description: campaignTemplate.description,
        type: campaignTemplate.type,
        agent_id: agent.id,
        user_id: config.userId,
        organization_id: config.organizationId,
        industry_template: template.id,
        template_campaign_id: campaignTemplate.id,
        target_audience: campaignTemplate.targetAudience,
        call_script: campaignTemplate.callScript,
        follow_up_sequence: campaignTemplate.followUpSequence,
        success_metrics: campaignTemplate.successMetrics,
        status: 'draft',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save campaign to database: ${error.message}`)
    }

    return {
      id: campaign.id,
      name: campaignTemplate.name,
      agentId: agent.id
    }
  }

  /**
   * Deploy a workflow from template
   */
  private async deployWorkflow(
    workflowTemplate: any,
    config: DeploymentConfig,
    template: IndustryTemplate
  ) {
    // Save workflow to database
    const { data: workflow, error } = await supabaseAdmin
      .from('workflows')
      .insert({
        name: workflowTemplate.name,
        description: workflowTemplate.description,
        user_id: config.userId,
        organization_id: config.organizationId,
        industry_template: template.id,
        template_workflow_id: workflowTemplate.id,
        steps: workflowTemplate.steps,
        triggers: workflowTemplate.triggers,
        automations: workflowTemplate.automations,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save workflow to database: ${error.message}`)
    }

    return {
      id: workflow.id,
      name: workflowTemplate.name
    }
  }

  /**
   * Customize system prompt with company information
   */
  private customizeSystemPrompt(
    prompt: string,
    companyInfo: DeploymentConfig['companyInfo'],
    customization: DeploymentConfig['customization']
  ): string {
    let customized = prompt

    // Replace placeholders
    customized = customized.replace(/\[COMPANY_NAME\]/g, companyInfo.name)
    customized = customized.replace(/\[COMPANY_PHONE\]/g, companyInfo.phone)
    customized = customized.replace(/\[COMPANY_WEBSITE\]/g, companyInfo.website || '')
    customized = customized.replace(/\[COMPANY_ADDRESS\]/g, companyInfo.address || '')
    customized = customized.replace(/\[BUSINESS_HOURS\]/g, customization.businessHours || '9 AM - 5 PM')

    // Add company-specific greeting if provided
    if (customization.companyGreeting) {
      customized += `\n\nCOMPANY GREETING: "${customization.companyGreeting}"`
    }

    return customized
  }

  /**
   * Customize first message with company information
   */
  private customizeFirstMessage(
    message: string,
    companyInfo: DeploymentConfig['companyInfo']
  ): string {
    let customized = message

    customized = customized.replace(/\[COMPANY_NAME\]/g, companyInfo.name)
    customized = customized.replace(/\[COMPANY_PHONE\]/g, companyInfo.phone)

    return customized
  }

  /**
   * Mark template as deployed for user
   */
  private async markTemplateDeployed(
    userId: string,
    industryId: string,
    templateName: string
  ) {
    await supabaseAdmin
      .from('user_templates')
      .upsert({
        user_id: userId,
        industry_id: industryId,
        template_name: templateName,
        deployed_at: new Date().toISOString(),
        is_active: true
      })
  }

  /**
   * Get deployed templates for user
   */
  async getDeployedTemplates(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('user_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      throw new Error(`Failed to get deployed templates: ${error.message}`)
    }

    return data || []
  }

  /**
   * Check if template is already deployed
   */
  async isTemplateDeployed(userId: string, industryId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('user_templates')
      .select('id')
      .eq('user_id', userId)
      .eq('industry_id', industryId)
      .eq('is_active', true)
      .single()

    return !error && !!data
  }
}

// Export singleton instance
export const templateDeploymentService = new TemplateDeploymentService()
