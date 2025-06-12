import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  try {
    // Get the session from the middleware client with timeout
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user || null

    console.log('🔐 Middleware: Auth check', {
      pathname: request.nextUrl.pathname,
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id,
      userEmail: user?.email,
      timestamp: new Date().toISOString(),
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length
    })

    const { pathname } = request.nextUrl

    // Special handling for direct-login page - always allow
    if (pathname === '/direct-login') {
      console.log('🔐 Middleware: Allowing direct-login page')
      return response
    }

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/pipeline',
    '/messages',
    '/documents',
    '/clients',
    '/tasks',
    '/settings',
    '/reports',
    '/bookkeeping',
    '/workflows',
    '/api/messages',
    '/api/documents',
    '/api/clients',
    '/api/tasks',
    '/api/bookkeeping',
  ]

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/about',
    '/contact',
    '/api/intake',
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    // Check if this might be a timing issue (recent authentication)
    const authTimestamp = request.cookies.get('auth-timestamp')?.value
    const now = Date.now()

    if (authTimestamp && (now - parseInt(authTimestamp)) < 8000) {
      // Recent auth attempt, allow a longer grace period for session sync
      console.log('🔐 Middleware: Recent auth detected, allowing grace period', {
        pathname,
        timeSinceAuth: now - parseInt(authTimestamp)
      })
      return response
    }

    console.log('🔐 Middleware: Redirecting unauthenticated user to login', { pathname })
    // Redirect to login with the original URL as redirect parameter
    const redirectUrl = new URL('/login', request.url)
    if (pathname !== '/login') {
      redirectUrl.searchParams.set('redirectTo', pathname)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access login/register pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    console.log('🔐 Middleware: Redirecting authenticated user away from login', { userId: user.id })

    // FIXED: Check if there's a redirectTo parameter first
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    if (redirectTo && redirectTo !== '/login' && redirectTo !== '/register') {
      console.log('🔐 Middleware: Using redirectTo parameter', { redirectTo })
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    // Get user role from metadata or database
    let userRole = 'client' // default role

    try {
      // Try to get role from user metadata first
      userRole = user.user_metadata?.role || 'client'

      // If no role in metadata, check the profiles table
      if (!user.user_metadata?.role) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role) {
          userRole = profile.role
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      // Continue with default role
    }

    // Redirect based on role
    if (userRole === 'admin' || userRole === 'staff') {
      return NextResponse.redirect(new URL('/pipeline', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

    return response
  } catch (error) {
    console.error('🔐 Middleware: Error during auth check:', error)
    // On error, allow the request to proceed (fail open for better UX)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
