import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🏷️ Setting up white-label database tables...')

    // Read the SQL migration file
    const sqlPath = path.join(process.cwd(), 'src/lib/database/migrations/white-label-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: sqlContent
    })

    if (error) {
      console.error('❌ Failed to create white-label tables:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ White-label tables created successfully')

    // Verify tables were created
    const { data: tables, error: checkError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'white_label_configs',
        'agency_clients', 
        'multi_channel_agents',
        'conversation_contexts',
        'multi_channel_messages'
      ])

    if (checkError) {
      console.error('❌ Failed to verify tables:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Failed to verify table creation'
      }, { status: 500 })
    }

    const createdTables = tables?.map(t => t.table_name) || []
    const expectedTables = [
      'white_label_configs',
      'agency_clients',
      'multi_channel_agents', 
      'conversation_contexts',
      'multi_channel_messages'
    ]

    const missingTables = expectedTables.filter(t => !createdTables.includes(t))

    return NextResponse.json({
      success: true,
      message: 'White-label database setup completed',
      tables_created: createdTables,
      missing_tables: missingTables,
      setup_complete: missingTables.length === 0
    })

  } catch (error: any) {
    console.error('❌ White-label setup failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to setup white-label database'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if white-label tables exist
    const { data: tables, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'white_label_configs',
        'agency_clients',
        'multi_channel_agents',
        'conversation_contexts', 
        'multi_channel_messages'
      ])

    if (error) {
      throw error
    }

    const existingTables = tables?.map(t => t.table_name) || []
    const expectedTables = [
      'white_label_configs',
      'agency_clients',
      'multi_channel_agents',
      'conversation_contexts',
      'multi_channel_messages'
    ]

    const missingTables = expectedTables.filter(t => !existingTables.includes(t))

    return NextResponse.json({
      success: true,
      existing_tables: existingTables,
      missing_tables: missingTables,
      is_setup_complete: missingTables.length === 0,
      setup_required: missingTables.length > 0
    })

  } catch (error: any) {
    console.error('❌ Failed to check white-label setup:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check white-label setup'
    }, { status: 500 })
  }
}
