import { NextRequest, NextResponse } from 'next/server'
import { AgentServiceServer } from '@/lib/services/AgentServiceServer'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Bulk create agents API called')
    const body = await request.json()
    const { organizationId, templateIds } = body

    console.log('🤖 Request data:', { organizationId, templateIds })

    if (!organizationId || !templateIds || !Array.isArray(templateIds)) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Organization ID and template IDs array are required' },
        { status: 400 }
      )
    }

    const agents = []
    const errors = []

    console.log(`🤖 Creating ${templateIds.length} agents...`)

    // Create agents from templates
    for (const templateId of templateIds) {
      try {
        console.log(`🤖 Creating agent from template: ${templateId}`)
        const { agent, error } = await AgentServiceServer.createAgentFromTemplate(
          organizationId,
          templateId
        )

        if (agent) {
          console.log(`✅ Agent created successfully: ${agent.name}`)
          agents.push(agent)
        } else {
          console.log(`❌ Failed to create agent: ${error}`)
          errors.push(`Failed to create agent from template ${templateId}: ${error}`)
        }
      } catch (err) {
        console.log(`❌ Exception creating agent: ${err}`)
        errors.push(`Error creating agent from template ${templateId}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    console.log(`🤖 Results: ${agents.length} agents created, ${errors.length} errors`)

    // Return results
    return NextResponse.json({
      agents,
      errors,
      success: agents.length > 0,
      message: `Created ${agents.length} agents${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    }, { status: 201 })

  } catch (error) {
    console.log('❌ Bulk create API error:', error)
    return NextResponse.json(
      { error: 'Failed to create agents' },
      { status: 500 }
    )
  }
}
