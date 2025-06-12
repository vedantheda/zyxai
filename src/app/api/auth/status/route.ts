import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/lib/supabase'

// Create Supabase client for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Get session from Authorization header
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        authenticated: false,
        error: 'No authorization header provided'
      })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({
        authenticated: false,
        error: error?.message || 'Invalid token'
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
