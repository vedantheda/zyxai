import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    console.log('🔍 Team members API: Starting authentication check')

    // Check for Authorization header first
    const authHeader = request.headers.get('authorization')
    let authUser = null
    let authError = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use token from Authorization header
      const token = authHeader.substring(7)
      console.log('🔐 Team members API: Using Authorization header token')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      authUser = user
      authError = error
    } else {
      // Fall back to cookie-based auth
      console.log('🔐 Team members API: Using cookie-based auth')
      const { data: { user }, error } = await supabase.auth.getUser()
      authUser = user
      authError = error
    }

    if (authError) {
      console.error('🚨 Team members API: Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      )
    }

    if (!authUser) {
      console.error('🚨 Team members API: No authenticated user found')
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }

    console.log('✅ Team members API: User authenticated:', authUser.id)

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .eq('id', authUser.id)
      .single()

    if (userError) {
      console.error('🚨 Team members API: User lookup error:', userError)
      return NextResponse.json(
        { error: 'Failed to find user data', details: userError.message },
        { status: 404 }
      )
    }

    if (!userData) {
      console.error('🚨 Team members API: No user data found for:', authUser.id)

      // Try to create a basic user profile if it doesn't exist
      const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
      const nameParts = fullName.split(' ')

      const { data: newUserData, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          first_name: nameParts[0] || 'User',
          last_name: nameParts.slice(1).join(' ') || '',
          role: 'owner', // First user becomes owner
        })
        .select()
        .single()

      if (createError || !newUserData) {
        console.error('🚨 Team members API: Failed to create user profile:', createError)
        return NextResponse.json(
          { error: 'User profile not found and could not be created. Please contact support.' },
          { status: 500 }
        )
      }

      console.log('✅ Team members API: Created new user profile:', newUserData.id)

      // Also create an organization for this user
      const orgName = newUserData.first_name ?
        `${newUserData.first_name}${newUserData.last_name ? ' ' + newUserData.last_name : ''}'s Organization` :
        'My Organization'

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: `org-${newUserData.id.slice(0, 8)}`, // Required field
        })
        .select()
        .single()

      if (orgData) {
        // Update user with organization_id
        await supabase
          .from('users')
          .update({ organization_id: orgData.id })
          .eq('id', authUser.id)

        console.log('✅ Team members API: Created organization:', orgData.id)
      }

      return NextResponse.json({
        members: [newUserData],
        message: 'Profile created successfully'
      })
    }

    console.log('✅ Team members API: User data found:', userData.id, 'Org:', userData.organization_id)

    if (!userData.organization_id) {
      console.error('🚨 Team members API: User has no organization_id:', userData.id)

      // Try to create an organization for this user
      const orgName = userData.first_name ?
        `${userData.first_name}${userData.last_name ? ' ' + userData.last_name : ''}'s Organization` :
        'My Organization'

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: `org-${userData.id.slice(0, 8)}`, // Required field
        })
        .select()
        .single()

      if (orgError || !orgData) {
        console.error('🚨 Team members API: Failed to create organization:', orgError)
        return NextResponse.json(
          { error: 'User not associated with an organization and could not create one' },
          { status: 500 }
        )
      }

      // Update user with organization_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ organization_id: orgData.id })
        .eq('id', authUser.id)

      if (updateError) {
        console.error('🚨 Team members API: Failed to update user with org_id:', updateError)
        return NextResponse.json(
          { error: 'Failed to associate user with organization' },
          { status: 500 }
        )
      }

      console.log('✅ Team members API: Created organization and updated user:', orgData.id)

      // Return the user as the only member
      return NextResponse.json({
        members: [{ ...userData, organization_id: orgData.id }],
        message: 'Organization created successfully'
      })
    }

    // Get all team members for the organization
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      members: members || []
    })

  } catch (error: any) {
    console.error('Team members API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
