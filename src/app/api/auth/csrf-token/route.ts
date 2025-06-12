import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/security/csrfProtection'

/**
 * CSRF Token Generation Endpoint
 * Provides secure CSRF tokens for client-side forms
 */

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || ''
    const token = generateCSRFToken(userAgent)
    
    return NextResponse.json(
      { 
        token,
        expiresIn: 15 * 60 * 1000 // 15 minutes in milliseconds
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

// Disable caching for this endpoint
export const dynamic = 'force-dynamic'
