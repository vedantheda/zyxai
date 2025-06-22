import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Database Setup API - Creates all necessary tables for ZyxAI
 * This ensures the database schema is properly set up for templates and agents
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ Setting up ZyxAI database schema...')

    // Create agents table if it doesn't exist
    const agentsTableSQL = `
      CREATE TABLE IF NOT EXISTS public.agents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        organization_id TEXT,
        
        -- Basic agent info
        name VARCHAR(255) NOT NULL,
        description TEXT,
        agent_type VARCHAR(100) NOT NULL,
        
        -- Template information
        industry_template VARCHAR(100),
        template_agent_id VARCHAR(100),
        
        -- Configuration
        personality JSONB DEFAULT '{}',
        voice_config JSONB DEFAULT '{}',
        script_config JSONB DEFAULT '{}',
        skills JSONB DEFAULT '[]',
        
        -- VAPI integration
        vapi_assistant_id VARCHAR(255),
        
        -- System prompts and messages
        system_prompt TEXT,
        first_message TEXT,
        
        -- Status and performance
        is_active BOOLEAN DEFAULT TRUE,
        performance_metrics JSONB DEFAULT '{}',
        
        -- Timestamps
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // Create campaigns table if it doesn't exist
    const campaignsTableSQL = `
      CREATE TABLE IF NOT EXISTS public.campaigns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        organization_id TEXT,
        agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
        
        -- Basic campaign info
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        
        -- Template information
        industry_template VARCHAR(100),
        template_campaign_id VARCHAR(100),
        
        -- Campaign configuration
        target_audience TEXT,
        call_script TEXT,
        follow_up_sequence JSONB DEFAULT '[]',
        success_metrics JSONB DEFAULT '[]',
        
        -- Execution details
        total_contacts INTEGER DEFAULT 0,
        completed_calls INTEGER DEFAULT 0,
        successful_calls INTEGER DEFAULT 0,
        
        -- Timestamps
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
      );
    `

    // Create user_templates table
    const userTemplatesTableSQL = `
      CREATE TABLE IF NOT EXISTS public.user_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        
        -- Template information
        industry_id VARCHAR(100) NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        
        -- Deployment details
        deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        
        -- Configuration used during deployment
        company_info JSONB DEFAULT '{}',
        customization JSONB DEFAULT '{}',
        integrations JSONB DEFAULT '{}',
        
        -- Deployment results
        deployment_result JSONB DEFAULT '{}',
        
        -- Metadata
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        -- Unique constraint per user/industry
        UNIQUE(user_id, industry_id)
      );
    `

    // Create workflows table
    const workflowsTableSQL = `
      CREATE TABLE IF NOT EXISTS public.workflows (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        organization_id TEXT,
        
        -- Workflow details
        name VARCHAR(255) NOT NULL,
        description TEXT,
        
        -- Template information
        industry_template VARCHAR(100),
        template_workflow_id VARCHAR(100),
        
        -- Workflow configuration
        steps JSONB DEFAULT '[]',
        triggers JSONB DEFAULT '[]',
        automations JSONB DEFAULT '[]',
        
        -- Status
        is_active BOOLEAN DEFAULT TRUE,
        
        -- Timestamps
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // Create calls table if it doesn't exist
    const callsTableSQL = `
      CREATE TABLE IF NOT EXISTS public.calls (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        organization_id TEXT,
        campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
        
        -- Call details
        vapi_call_id VARCHAR(255),
        contact_phone VARCHAR(50) NOT NULL,
        contact_name VARCHAR(255),
        
        -- Call status and results
        status VARCHAR(50) DEFAULT 'pending',
        duration INTEGER DEFAULT 0, -- seconds
        cost DECIMAL(10,4) DEFAULT 0,
        
        -- Call data
        transcript TEXT,
        summary TEXT,
        outcome VARCHAR(100),
        sentiment VARCHAR(50),
        
        -- Timestamps
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        ended_at TIMESTAMPTZ
      );
    `

    // Execute table creation
    console.log('📋 Creating agents table...')
    await supabaseAdmin.rpc('exec_sql', { sql: agentsTableSQL })

    console.log('📋 Creating campaigns table...')
    await supabaseAdmin.rpc('exec_sql', { sql: campaignsTableSQL })

    console.log('📋 Creating user_templates table...')
    await supabaseAdmin.rpc('exec_sql', { sql: userTemplatesTableSQL })

    console.log('📋 Creating workflows table...')
    await supabaseAdmin.rpc('exec_sql', { sql: workflowsTableSQL })

    console.log('📋 Creating calls table...')
    await supabaseAdmin.rpc('exec_sql', { sql: callsTableSQL })

    // Create indexes for performance
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
      CREATE INDEX IF NOT EXISTS idx_agents_template ON public.agents(industry_template);
      CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
      CREATE INDEX IF NOT EXISTS idx_campaigns_agent_id ON public.campaigns(agent_id);
      CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON public.user_templates(user_id);
      CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
      CREATE INDEX IF NOT EXISTS idx_calls_user_id ON public.calls(user_id);
      CREATE INDEX IF NOT EXISTS idx_calls_campaign_id ON public.calls(campaign_id);
    `

    console.log('📊 Creating indexes...')
    await supabaseAdmin.rpc('exec_sql', { sql: indexSQL })

    console.log('✅ Database schema setup complete!')

    return NextResponse.json({
      success: true,
      message: 'Database schema created successfully',
      tables: ['agents', 'campaigns', 'user_templates', 'workflows', 'calls'],
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Database setup failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Database setup failed'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if tables exist
    const { data: tables, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['agents', 'campaigns', 'user_templates', 'workflows', 'calls'])

    if (error) {
      throw error
    }

    const existingTables = tables?.map(t => t.table_name) || []
    const requiredTables = ['agents', 'campaigns', 'user_templates', 'workflows', 'calls']
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))

    return NextResponse.json({
      success: true,
      existingTables,
      missingTables,
      isSetupComplete: missingTables.length === 0
    })

  } catch (error: any) {
    console.error('❌ Database check failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Database check failed'
    }, { status: 500 })
  }
}
