import { NextRequest, NextResponse } from 'next/server'
import { AgentService } from '@/lib/services/AgentService'
import { AgentServiceServer } from '@/lib/services/AgentServiceServer'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const { agents, error } = await AgentService.getOrganizationAgents(organizationId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ agents })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, templateId, customizations } = body

    if (!organizationId || !templateId) {
      return NextResponse.json(
        { error: 'Organization ID and template ID are required' },
        { status: 400 }
      )
    }

    const { agent, error } = await AgentServiceServer.createAgentFromTemplate(
      organizationId,
      templateId,
      customizations
    )

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, updates } = body

    if (!agentId || !updates) {
      return NextResponse.json(
        { error: 'Agent ID and updates are required' },
        { status: 400 }
      )
    }

    const { agent, error } = await AgentServiceServer.updateAgentWithVapiSync(agentId, updates)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}
