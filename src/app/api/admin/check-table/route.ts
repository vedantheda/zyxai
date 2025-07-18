import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user data to check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User data not found' },
        { status: 404 }
      )
    }

    // Check if user is admin
    if (!['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Get table name from query params
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table')

    if (!tableName) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      )
    }

    // Validate table name to prevent SQL injection
    const allowedTables = [
      'user_invitations',
      'audit_logs',
      'ai_agents',
      'campaigns',
      'contacts',
      'calls',
      'organizations',
      'users'
    ]

    if (!allowedTables.includes(tableName)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      )
    }

    try {
      // Try to query the table with a limit to check if it exists
      const { error: tableError } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(1)

      if (tableError) {
        // Check if error is due to missing table
        if (tableError.message?.includes('does not exist') || 
            tableError.message?.includes('relation') ||
            tableError.code === 'PGRST116') {
          return NextResponse.json({
            exists: false,
            table: tableName,
            error: tableError.message
          })
        }

        // Other errors might indicate the table exists but has permission issues
        return NextResponse.json({
          exists: true,
          table: tableName,
          warning: tableError.message
        })
      }

      // If no error, table exists and is accessible
      return NextResponse.json({
        exists: true,
        table: tableName
      })

    } catch (error: any) {
      // Catch any other errors
      return NextResponse.json({
        exists: false,
        table: tableName,
        error: error.message
      })
    }

  } catch (error: any) {
    console.error('Error checking table:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
