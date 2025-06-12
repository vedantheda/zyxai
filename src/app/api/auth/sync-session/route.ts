import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 API: Session sync requested')
    
    const { session, user } = await request.json()
    
    if (!session || !user) {
      console.log('🔐 API: Missing session or user data')
      return NextResponse.json({ error: 'Missing session data' }, { status: 400 })
    }
    
    console.log('🔐 API: Creating Supabase client for session sync')
    
    // Create a Supabase client for the API route
    const supabase = createRouteHandlerClient({ cookies })
    
    // Set the session in the Supabase client
    console.log('🔐 API: Setting session in Supabase client')
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    })
    
    if (error) {
      console.error('🔐 API: Error setting session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('🔐 API: Session set successfully', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      userId: data?.user?.id
    })
    
    // Create response with success
    const response = NextResponse.json({ 
      success: true, 
      message: 'Session synced successfully',
      userId: data?.user?.id 
    })
    
    console.log('🔐 API: Session sync completed successfully')
    
    return response
    
  } catch (error) {
    console.error('🔐 API: Session sync error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
