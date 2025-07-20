import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Re-export createClient for use in other files
export { createClient }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a safe Supabase client that won't throw on connection errors
function createSafeSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables')
    return null
  }

  try {
    console.log('🔗 Creating Supabase client...')
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'zyxai-auth-token',
        // Disable debug logs to clean up terminal
        debug: false,
        // Reduce token refresh frequency to prevent conflicts
        refreshTokenRetryAttempts: 3,
        refreshTokenRetryDelay: 1000
      },
      global: {
        headers: {
          'X-Client-Info': 'zyxai-client'
        }
      },
      // Add realtime configuration for better connection handling
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  } catch (error) {
    console.warn('Failed to create Supabase client:', error)
    return null
  }
}

// Single Supabase client instance for the entire app
export const supabase = createSafeSupabaseClient()

// Admin client for server-side operations (only for server-side use)
export const supabaseAdmin = typeof window === 'undefined' && supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

// Re-export Database type from our types file
export type { Database } from '@/types/database'


