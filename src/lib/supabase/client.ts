import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'
import { createSupabaseAuthStorage } from '@/lib/supabase/cross-subdomain-auth-storage'
import { resolveSupabaseAuthStorageKey } from '@/lib/supabase/supabase-auth-storage-key'

let browserClient: SupabaseClient | null = null
let browserClientStorageKey: string | null = null

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey)
}

export function getSupabaseAuthStorageKey(): string | null {
  if (!isSupabaseConfigured()) return null
  return resolveSupabaseAuthStorageKey(env.supabaseUrl!, env.supabaseAnonKey!)
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }
  const storageKey = resolveSupabaseAuthStorageKey(
    env.supabaseUrl!,
    env.supabaseAnonKey!,
  )
  if (!browserClient || browserClientStorageKey !== storageKey) {
    browserClientStorageKey = storageKey
    browserClient = createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      auth: {
        storageKey,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: createSupabaseAuthStorage(),
      },
    })
  }
  return browserClient
}

export async function getAccessToken(): Promise<string | null> {
  const client = getSupabaseClient()
  if (!client) return null
  const { data } = await client.auth.getSession()
  return data.session?.access_token ?? null
}
