import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Auth: Starting authentication debug check')
    
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Get all cookies for debugging
    const allCookies = cookieStore.getAll()
    console.log('🍪 Debug Auth: All cookies:', allCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })))

    // Look for Supabase auth cookies specifically
    const authCookies = allCookies.filter(c => c.name.includes('auth'))
    console.log('🔐 Debug Auth: Auth cookies:', authCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })))

    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('📋 Debug Auth: Session check:', {
      hasSession: !!session,
      hasError: !!sessionError,
      userId: session?.user?.id,
      email: session?.user?.email,
      errorMessage: sessionError?.message
    })

    // Check user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 Debug Auth: User check:', {
      hasUser: !!user,
      hasError: !!userError,
      userId: user?.id,
      email: user?.email,
      errorMessage: userError?.message
    })

    return NextResponse.json({
      success: true,
      debug: {
        cookieCount: allCookies.length,
        hasCookies: allCookies.length > 0,
        session: {
          exists: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: sessionError?.message
        },
        user: {
          exists: !!user,
          userId: user?.id,
          email: user?.email,
          error: userError?.message
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('🚨 Debug Auth: Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
