import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files, API routes, and public assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.webmanifest'
  ) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/signin',
    '/signup',
    '/login',
    '/register',
    '/auth-test',
    '/test-instant',
    '/force-signout'
  ]

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, let client-side handle auth to avoid server-client conflicts
  // This prevents the infinite redirect loops we were seeing
  console.log(`🔐 Middleware: Allowing ${pathname} to proceed to client-side auth`)
  return NextResponse.next()
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
