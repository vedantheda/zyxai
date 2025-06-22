import { NextRequest, NextResponse } from 'next/server'
import IndustrySolutionsManager from '@/lib/services/IndustrySolutionsManager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list_industries'
    const industry = searchParams.get('industry')
    const agentId = searchParams.get('agentId')
    const specialization = searchParams.get('specialization')
    const keyword = searchParams.get('keyword')
    const businessType = searchParams.get('businessType')
    const useCase = searchParams.get('useCase')

    console.log(`🏢 Industry Solutions API - Action: ${action}`)

    switch (action) {
      case 'list_industries':
        const industries = IndustrySolutionsManager.getAvailableIndustries()
        return NextResponse.json({
          success: true,
          industries,
          total: industries.length
        })

      case 'get_industry_agents':
        if (!industry) {
          return NextResponse.json(
            { error: 'Industry parameter is required' },
            { status: 400 }
          )
        }
        const agents = IndustrySolutionsManager.getIndustryAgents(industry)
        return NextResponse.json({
          success: true,
          industry,
          agents,
          count: agents.length
        })

      case 'get_industry_workflows':
        if (!industry) {
          return NextResponse.json(
            { error: 'Industry parameter is required' },
            { status: 400 }
          )
        }
        const workflows = IndustrySolutionsManager.getIndustryWorkflows(industry)
        return NextResponse.json({
          success: true,
          industry,
          workflows,
          count: workflows.length
        })

      case 'get_industry_templates':
        if (!industry) {
          return NextResponse.json(
            { error: 'Industry parameter is required' },
            { status: 400 }
          )
        }
        const templates = IndustrySolutionsManager.getIndustryTemplates(industry)
        return NextResponse.json({
          success: true,
          industry,
          templates
        })

      case 'get_agent':
        if (!agentId) {
          return NextResponse.json(
            { error: 'Agent ID parameter is required' },
            { status: 400 }
          )
        }
        const agent = IndustrySolutionsManager.getAgentById(agentId)
        if (!agent) {
          return NextResponse.json(
            { error: 'Agent not found' },
            { status: 404 }
          )
        }
        return NextResponse.json({
          success: true,
          agent
        })

      case 'search_agents':
        if (specialization) {
          const specializationAgents = IndustrySolutionsManager.getAgentsBySpecialization(specialization)
          return NextResponse.json({
            success: true,
            specialization,
            agents: specializationAgents,
            count: specializationAgents.length
          })
        }
        
        if (keyword) {
          const searchResults = IndustrySolutionsManager.searchAgents(keyword)
          return NextResponse.json({
            success: true,
            keyword,
            agents: searchResults,
            count: searchResults.length
          })
        }

        return NextResponse.json(
          { error: 'Specialization or keyword parameter is required for search' },
          { status: 400 }
        )

      case 'get_recommendations':
        if (!businessType) {
          return NextResponse.json(
            { error: 'Business type parameter is required' },
            { status: 400 }
          )
        }
        const recommendations = IndustrySolutionsManager.getRecommendedAgents(businessType, useCase || '')
        return NextResponse.json({
          success: true,
          businessType,
          useCase,
          recommendations,
          count: recommendations.length
        })

      case 'get_compliance':
        if (!industry) {
          return NextResponse.json(
            { error: 'Industry parameter is required' },
            { status: 400 }
          )
        }
        const compliance = IndustrySolutionsManager.getIndustryCompliance(industry)
        return NextResponse.json({
          success: true,
          industry,
          compliance
        })

      case 'get_metrics':
        if (!industry) {
          return NextResponse.json(
            { error: 'Industry parameter is required' },
            { status: 400 }
          )
        }
        const metrics = IndustrySolutionsManager.getIndustryMetrics(industry)
        return NextResponse.json({
          success: true,
          industry,
          metrics
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('❌ Industry Solutions API error:', error)
    return NextResponse.json(
      { 
        error: 'Industry Solutions API failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, industry, campaignType, configuration } = body

    console.log(`🏢 Industry Solutions API - POST Action: ${action}`)

    switch (action) {
      case 'create_campaign':
        if (!industry || !campaignType) {
          return NextResponse.json(
            { error: 'Industry and campaign type are required' },
            { status: 400 }
          )
        }

        const campaign = IndustrySolutionsManager.createIndustryCampaign(
          industry,
          campaignType,
          configuration || {}
        )

        return NextResponse.json({
          success: true,
          message: 'Industry campaign created successfully',
          campaign
        })

      case 'validate_configuration':
        if (!industry || !configuration) {
          return NextResponse.json(
            { error: 'Industry and configuration are required' },
            { status: 400 }
          )
        }

        const validation = IndustrySolutionsManager.validateIndustryConfiguration(
          industry,
          configuration
        )

        return NextResponse.json({
          success: true,
          validation
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('❌ Industry Solutions API POST error:', error)
    return NextResponse.json(
      { 
        error: 'Industry Solutions API POST failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
