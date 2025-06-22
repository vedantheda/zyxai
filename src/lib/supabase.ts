import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Re-export createClient for use in other files
export { createClient }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl
  })
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Single Supabase client instance for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable to prevent URL-based auth conflicts
    flowType: 'pkce'
  }
})

// Admin client for server-side operations (only for server-side use)
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient<Database>(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
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


