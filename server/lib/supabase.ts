import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, serverEnv } from '../lib/env.js'

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }
  if (!adminClient) {
    adminClient = createClient(serverEnv.supabaseUrl!, serverEnv.supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return adminClient
}
