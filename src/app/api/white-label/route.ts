import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { WhiteLabelService } from '@/lib/services/WhiteLabelService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const subdomain = searchParams.get('subdomain')
    const domain = searchParams.get('domain')

    if (!organizationId && !subdomain && !domain) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID, subdomain, or domain is required'
      }, { status: 400 })
    }

    let config = null
    let error = null

    if (organizationId) {
      const result = await WhiteLabelService.getWhiteLabelConfig(organizationId)
      config = result.config
      error = result.error
    } else if (subdomain) {
      const result = await WhiteLabelService.getConfigBySubdomain(subdomain)
      config = result.config
      error = result.error
    } else if (domain) {
      const result = await WhiteLabelService.getConfigByDomain(domain)
      config = result.config
      error = result.error
    }

    if (error) {
      return NextResponse.json({
        success: false,
        error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      config
    })

  } catch (error: any) {
    console.error('❌ Failed to get white-label config:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get white-label configuration'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, config } = body

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    // Check if subdomain is available (if it's being changed)
    if (config.subdomain) {
      const isAvailable = await WhiteLabelService.isSubdomainAvailable(config.subdomain)
      if (!isAvailable) {
        // Check if it's the same organization (updating existing config)
        const { config: existingConfig } = await WhiteLabelService.getWhiteLabelConfig(organizationId)
        if (!existingConfig || existingConfig.subdomain !== config.subdomain) {
          return NextResponse.json({
            success: false,
            error: 'Subdomain is already taken'
          }, { status: 400 })
        }
      }
    }

    const { config: savedConfig, error } = await WhiteLabelService.upsertWhiteLabelConfig(
      organizationId,
      config
    )

    if (error) {
      return NextResponse.json({
        success: false,
        error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      config: savedConfig,
      message: 'White-label configuration saved successfully'
    })

  } catch (error: any) {
    console.error('❌ Failed to save white-label config:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save white-label configuration'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, updates } = body

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    // Get existing config
    const { config: existingConfig, error: getError } = await WhiteLabelService.getWhiteLabelConfig(organizationId)
    
    if (getError) {
      return NextResponse.json({
        success: false,
        error: getError
      }, { status: 500 })
    }

    if (!existingConfig) {
      return NextResponse.json({
        success: false,
        error: 'White-label configuration not found'
      }, { status: 404 })
    }

    // Merge updates with existing config
    const updatedConfig = {
      ...existingConfig,
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { config: savedConfig, error } = await WhiteLabelService.upsertWhiteLabelConfig(
      organizationId,
      updatedConfig
    )

    if (error) {
      return NextResponse.json({
        success: false,
        error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      config: savedConfig,
      message: 'White-label configuration updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Failed to update white-label config:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update white-label configuration'
    }, { status: 500 })
  }
}
