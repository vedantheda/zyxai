import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 API SignIn: Starting server-side sign in')
    const { email, password, redirectTo } = await request.json()
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (data.user) {
      console.log('🔐 API SignIn: Success for user:', data.user.email)
      // Return success with redirect URL
      return NextResponse.json({
        success: true,
        user: data.user,
        redirectTo: redirectTo || '/pipeline'
      })
    }
    return NextResponse.json({ error: 'Sign in failed' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Sign in failed' }, { status: 500 })
  }
}
