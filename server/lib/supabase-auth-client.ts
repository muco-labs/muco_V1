import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabasePasswordLoginConfigured, serverEnv } from './env.js'

let authClient: SupabaseClient | null = null

/** Browser-equivalent client for password grant (anon/publishable key only). */
export function getSupabasePasswordAuthClient(): SupabaseClient | null {
  if (!isSupabasePasswordLoginConfigured()) {
    return null
  }
  if (!authClient) {
    authClient = createClient(serverEnv.supabaseUrl!, serverEnv.supabaseAnonKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return authClient
}
