/**
 * Auth fallback utilities for development and testing
 */

export function shouldUseMockAuth(): boolean {
  // Use mock auth in development when Supabase is not available
  return process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SUPABASE_URL
}

export function getMockUser() {
  return {
    id: 'mock-user-id',
    email: 'test@example.com',
    name: 'Test User',
    organization_id: 'mock-org-id'
  }
}

export function getMockSession() {
  return {
    user: getMockUser(),
    access_token: 'mock-access-token',
    expires_at: Date.now() + 3600000 // 1 hour from now
  }
}
