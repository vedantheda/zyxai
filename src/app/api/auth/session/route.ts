import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
export async function GET(_request: NextRequest) {
  try {
    console.log('🔐 Session API: Getting session from server-side')
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('🔐 Session API: Session result', {
      hasSession: !!session,
      hasError: !!error,
      userId: session?.user?.id,
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length,
      errorMessage: error?.message
    })
    if (error) {
      return NextResponse.json({ session: null, error: error.message }, { status: 401 })
    }
    // Return the session data (access token will be included)
    return NextResponse.json({
      session,
      user: session?.user || null,
      error: null
    })
  } catch (err) {
    return NextResponse.json({
      session: null,
      user: null,
      error: 'Failed to get session'
    }, { status: 500 })
  }
}
