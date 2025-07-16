import { NextRequest, NextResponse } from 'next/server'
import { hubspotAnalyticsIntegration } from '@/lib/integrations/hubspot-analytics'
import { hubspotCampaignIntegration } from '@/lib/integrations/hubspot-campaigns'
import { hubspotEmailIntegration } from '@/lib/integrations/hubspot-email'
import { hubspotWorkflowIntegration } from '@/lib/integrations/hubspot-workflows'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const { action, organizationId, options = {} } = await request.json()

    console.log(`🚀 Starting HubSpot advanced integration: ${action}`)

    let result

    switch (action) {
      case 'full_sync':
        result = await performFullIntegrationSync(organizationId)
        break

      case 'analytics_sync':
        result = await hubspotAnalyticsIntegration.performFullAnalyticsSync(organizationId)
        break

      case 'campaign_sync':
        result = await hubspotCampaignIntegration.syncAllCampaigns(organizationId)
        break

      case 'email_sync':
        result = await hubspotEmailIntegration.performFullEmailSync(organizationId)
        break

      case 'workflow_sync':
        result = await hubspotWorkflowIntegration.performFullWorkflowSync(organizationId)
        break

      case 'create_properties':
        result = await createAllCustomProperties()
        break

      case 'generate_report':
        result = await generateComprehensiveReport(organizationId)
        break

      case 'setup_automation':
        result = await setupAdvancedAutomation(organizationId, options)
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { 
          status: 400,
          headers: corsHeaders 
        })
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error in HubSpot advanced integration:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute HubSpot integration',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || 'demo-org-123'
    const reportType = searchParams.get('reportType') || 'overview'

    let data

    switch (reportType) {
      case 'overview':
        data = await getIntegrationOverview(organizationId)
        break

      case 'analytics':
        data = await hubspotAnalyticsIntegration.getAnalyticsData(organizationId)
        break

      case 'campaigns':
        data = await hubspotCampaignIntegration.generateCampaignReport(organizationId)
        break

      case 'emails':
        data = await hubspotEmailIntegration.generateEmailPerformanceReport(organizationId)
        break

      case 'sync_status':
        data = await getSyncStatus(organizationId)
        break

      default:
        data = await getIntegrationOverview(organizationId)
    }

    return NextResponse.json({
      success: true,
      reportType,
      data,
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('❌ Error getting HubSpot integration data:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get integration data',
      details: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

// Perform complete integration sync
async function performFullIntegrationSync(organizationId: string) {
  console.log('🚀 Starting complete HubSpot integration sync...')

  const results = {
    analytics: null,
    campaigns: null,
    emails: null,
    workflows: null,
    properties: null,
    errors: []
  }

  try {
    // 1. Create all custom properties first
    console.log('🔧 Creating custom properties...')
    results.properties = await createAllCustomProperties()

    // 2. Analytics sync
    console.log('📊 Syncing analytics...')
    try {
      results.analytics = await hubspotAnalyticsIntegration.performFullAnalyticsSync(organizationId)
    } catch (error: any) {
      results.errors.push(`Analytics sync failed: ${error.message}`)
    }

    // 3. Campaign sync
    console.log('📢 Syncing campaigns...')
    try {
      results.campaigns = await hubspotCampaignIntegration.syncAllCampaigns(organizationId)
    } catch (error: any) {
      results.errors.push(`Campaign sync failed: ${error.message}`)
    }

    // 4. Email sync
    console.log('📧 Syncing emails...')
    try {
      results.emails = await hubspotEmailIntegration.performFullEmailSync(organizationId)
    } catch (error: any) {
      results.errors.push(`Email sync failed: ${error.message}`)
    }

    // 5. Workflow sync
    console.log('⚡ Syncing workflows...')
    try {
      results.workflows = await hubspotWorkflowIntegration.performFullWorkflowSync(organizationId)
    } catch (error: any) {
      results.errors.push(`Workflow sync failed: ${error.message}`)
    }

    console.log('🎉 Complete integration sync finished!')

    return {
      success: true,
      results,
      summary: {
        contactsUpdated: results.analytics?.contactsUpdated || 0,
        dealsCreated: results.analytics?.dealsCreated || 0,
        campaignsCreated: results.campaigns?.syncedCount || 0,
        emailsSynced: results.emails?.syncResult?.emailsSynced || 0,
        workflowsCreated: results.workflows?.syncResult?.workflowsCreated || 0,
        totalErrors: results.errors.length
      }
    }

  } catch (error) {
    console.error('❌ Complete integration sync failed:', error)
    throw error
  }
}

// Create all custom properties across all integrations
async function createAllCustomProperties() {
  console.log('🔧 Creating all HubSpot custom properties...')

  const results = {
    analytics: false,
    campaigns: false,
    emails: false,
    workflows: false,
    errors: []
  }

  try {
    await hubspotAnalyticsIntegration.createZyxAIProperties()
    results.analytics = true
  } catch (error: any) {
    results.errors.push(`Analytics properties failed: ${error.message}`)
  }

  try {
    await hubspotEmailIntegration.createEmailProperties()
    results.emails = true
  } catch (error: any) {
    results.errors.push(`Email properties failed: ${error.message}`)
  }

  // Campaigns and workflows use existing properties
  results.campaigns = true
  results.workflows = true

  console.log('✅ Custom properties creation complete!')
  return results
}

// Generate comprehensive integration report
async function generateComprehensiveReport(organizationId: string) {
  console.log('📊 Generating comprehensive HubSpot integration report...')

  try {
    const [
      analyticsData,
      campaignReport,
      emailReport,
      syncStatus
    ] = await Promise.all([
      hubspotAnalyticsIntegration.getAnalyticsData(organizationId),
      hubspotCampaignIntegration.generateCampaignReport(organizationId),
      hubspotEmailIntegration.generateEmailPerformanceReport(organizationId),
      getSyncStatus(organizationId)
    ])

    const report = {
      overview: {
        totalContacts: analyticsData.leads.total,
        qualifiedLeads: analyticsData.leads.qualified,
        totalCalls: analyticsData.calls.total,
        successfulCalls: analyticsData.calls.successful,
        totalEmails: emailReport.totalEmails,
        activeCampaigns: analyticsData.campaigns.active,
        pipelineValue: analyticsData.leads.pipelineValue,
        forecastedRevenue: analyticsData.revenue.forecastedRevenue
      },
      analytics: analyticsData,
      campaigns: {
        total: campaignReport.length,
        topPerforming: campaignReport.slice(0, 5),
        averageROI: campaignReport.reduce((sum, c) => sum + c.roi, 0) / campaignReport.length || 0
      },
      emails: emailReport,
      syncStatus,
      recommendations: generateRecommendations(analyticsData, campaignReport, emailReport)
    }

    console.log('✅ Comprehensive report generated!')
    return report

  } catch (error) {
    console.error('❌ Error generating comprehensive report:', error)
    throw error
  }
}

// Generate actionable recommendations
function generateRecommendations(analytics: any, campaigns: any[], emails: any) {
  const recommendations = []

  // Analytics recommendations
  if (analytics.leads.conversionRate < 20) {
    recommendations.push({
      type: 'analytics',
      priority: 'high',
      title: 'Improve Lead Conversion Rate',
      description: `Your conversion rate is ${analytics.leads.conversionRate}%. Consider improving lead qualification criteria.`,
      action: 'Review and optimize lead scoring algorithm'
    })
  }

  if (analytics.calls.successRate < 60) {
    recommendations.push({
      type: 'analytics',
      priority: 'medium',
      title: 'Improve Call Success Rate',
      description: `Call success rate is ${analytics.calls.successRate}%. Consider optimizing call timing and scripts.`,
      action: 'Analyze call patterns and optimize timing'
    })
  }

  // Campaign recommendations
  const lowROICampaigns = campaigns.filter(c => c.roi < 100)
  if (lowROICampaigns.length > 0) {
    recommendations.push({
      type: 'campaigns',
      priority: 'high',
      title: 'Optimize Low-ROI Campaigns',
      description: `${lowROICampaigns.length} campaigns have ROI below 100%. Consider pausing or optimizing.`,
      action: 'Review and optimize underperforming campaigns'
    })
  }

  // Email recommendations
  if (emails.responseRate < 30) {
    recommendations.push({
      type: 'emails',
      priority: 'medium',
      title: 'Improve Email Response Rate',
      description: `Email response rate is ${emails.responseRate}%. Consider improving subject lines and content.`,
      action: 'A/B test email templates and timing'
    })
  }

  return recommendations
}

// Get integration sync status
async function getSyncStatus(organizationId: string) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')

    // Get sync statistics
    const [
      { count: totalContacts },
      { count: hubspotContacts },
      { count: totalCampaigns },
      { count: hubspotCampaigns },
      { count: totalEmails },
      { count: syncedEmails }
    ] = await Promise.all([
      supabaseAdmin.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
      supabaseAdmin.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).not('hubspot_id', 'is', null),
      supabaseAdmin.from('campaigns').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
      supabaseAdmin.from('campaigns').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).not('hubspot_campaign_id', 'is', null),
      supabaseAdmin.from('emails').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
      supabaseAdmin.from('emails').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).not('hubspot_activity_id', 'is', null)
    ])

    return {
      contacts: {
        total: totalContacts || 0,
        synced: hubspotContacts || 0,
        syncRate: totalContacts ? Math.round((hubspotContacts / totalContacts) * 100) : 0
      },
      campaigns: {
        total: totalCampaigns || 0,
        synced: hubspotCampaigns || 0,
        syncRate: totalCampaigns ? Math.round((hubspotCampaigns / totalCampaigns) * 100) : 0
      },
      emails: {
        total: totalEmails || 0,
        synced: syncedEmails || 0,
        syncRate: totalEmails ? Math.round((syncedEmails / totalEmails) * 100) : 0
      },
      lastSync: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Error getting sync status:', error)
    throw error
  }
}

// Get integration overview
async function getIntegrationOverview(organizationId: string) {
  try {
    const [analyticsData, syncStatus] = await Promise.all([
      hubspotAnalyticsIntegration.getAnalyticsData(organizationId),
      getSyncStatus(organizationId)
    ])

    return {
      summary: {
        totalContacts: analyticsData.leads.total,
        syncedContacts: syncStatus.contacts.synced,
        totalCalls: analyticsData.calls.total,
        successRate: analyticsData.calls.successRate,
        pipelineValue: analyticsData.leads.pipelineValue,
        conversionRate: analyticsData.leads.conversionRate
      },
      syncStatus,
      healthScore: calculateHealthScore(analyticsData, syncStatus),
      lastUpdated: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Error getting integration overview:', error)
    throw error
  }
}

// Calculate integration health score
function calculateHealthScore(analytics: any, syncStatus: any): number {
  let score = 0

  // Sync rate contributes 40% to health score
  const avgSyncRate = (syncStatus.contacts.syncRate + syncStatus.campaigns.syncRate + syncStatus.emails.syncRate) / 3
  score += (avgSyncRate / 100) * 40

  // Call success rate contributes 30%
  score += (analytics.calls.successRate / 100) * 30

  // Conversion rate contributes 20%
  score += (analytics.leads.conversionRate / 100) * 20

  // Data completeness contributes 10%
  const dataCompleteness = analytics.leads.total > 0 ? 100 : 0
  score += (dataCompleteness / 100) * 10

  return Math.round(score)
}

// Setup advanced automation
async function setupAdvancedAutomation(organizationId: string, options: any) {
  console.log('⚡ Setting up advanced HubSpot automation...')

  try {
    // Create workflow triggers
    const triggersCreated = await hubspotWorkflowIntegration.createWorkflowTriggers(organizationId)

    // Setup campaign automation
    const campaignAutomation = await hubspotCampaignIntegration.syncAllCampaigns(organizationId)

    // Setup email automation
    await hubspotEmailIntegration.syncEmailRoutingRules(organizationId)

    return {
      triggersCreated,
      campaignAutomation,
      automationEnabled: true,
      message: 'Advanced automation setup complete'
    }

  } catch (error) {
    console.error('❌ Error setting up advanced automation:', error)
    throw error
  }
}
