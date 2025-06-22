import { NextRequest, NextResponse } from 'next/server'
import { templateDeploymentService } from '@/lib/services/TemplateDeploymentService'
import { supabase } from '@/lib/supabase'

/**
 * Deploy Industry Template API
 * Creates agents, campaigns, and workflows from industry templates
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      industryId,
      companyInfo,
      customization = {},
      integrations = {}
    } = body

    // Validate required fields
    if (!industryId || !companyInfo?.name || !companyInfo?.phone) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: industryId, companyInfo.name, companyInfo.phone'
      }, { status: 400 })
    }

    // For now, use a demo user ID for testing
    // TODO: Implement proper authentication
    const user = {
      id: 'demo-user-' + Date.now(),
      user_metadata: {
        organization_id: 'demo-org-' + Date.now()
      }
    }

    console.log('🧪 Using demo user for template deployment:', user.id)

    // Check if template is already deployed
    const isAlreadyDeployed = await templateDeploymentService.isTemplateDeployed(
      user.id,
      industryId
    )

    if (isAlreadyDeployed) {
      return NextResponse.json({
        success: false,
        error: 'Template already deployed for this user'
      }, { status: 409 })
    }

    // Deploy the template
    const deploymentResult = await templateDeploymentService.deployTemplate({
      industryId,
      companyInfo,
      customization,
      userId: user.id,
      organizationId: user.user_metadata?.organization_id
    })

    if (!deploymentResult.success) {
      return NextResponse.json({
        success: false,
        error: deploymentResult.error || 'Template deployment failed'
      }, { status: 500 })
    }

    // Return success with deployment details
    return NextResponse.json({
      success: true,
      message: 'Template deployed successfully',
      deployment: {
        industryId,
        agents: deploymentResult.agents,
        campaigns: deploymentResult.campaigns,
        workflows: deploymentResult.workflows,
        summary: {
          agentsCreated: deploymentResult.agents.length,
          campaignsCreated: deploymentResult.campaigns.length,
          workflowsCreated: deploymentResult.workflows.length
        }
      }
    })

  } catch (error: any) {
    console.error('Template deployment error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * GET - List available templates and deployment status
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid authorization header'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token'
      }, { status: 401 })
    }

    // Get deployed templates for user
    const deployedTemplates = await templateDeploymentService.getDeployedTemplates(user.id)

    // Import templates dynamically to avoid circular dependencies
    const { getAllIndustryTemplates } = await import('@/lib/templates/IndustryTemplates')
    const allTemplates = getAllIndustryTemplates()

    // Add deployment status to each template
    const templatesWithStatus = allTemplates.map(template => ({
      ...template,
      isDeployed: deployedTemplates.some(dt => dt.industry_id === template.id),
      deployedAt: deployedTemplates.find(dt => dt.industry_id === template.id)?.deployed_at
    }))

    return NextResponse.json({
      success: true,
      templates: templatesWithStatus,
      deployedCount: deployedTemplates.length
    })

  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}
