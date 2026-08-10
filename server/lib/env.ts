import { resolveSupabaseProjectUrl } from '../../src/config/resolve-supabase-project-url.js'

const trim = (value: string | undefined) => value?.trim() || undefined

/** JWT anon key required for Supabase password grant; `sb_publishable_*` is not valid for auth API. */
function resolveSupabaseServerAnonKey(): string | undefined {
  const candidates = [
    trim(process.env.SUPABASE_ANON_KEY),
    trim(process.env.VITE_SUPABASE_ANON_KEY),
    trim(process.env.SUPABASE_PUBLISHABLE_KEY),
    trim(process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  ].filter(Boolean) as string[]

  const jwt = candidates.find((key) => key.startsWith('eyJ'))
  if (jwt) return jwt

  return candidates[0]
}

export const serverEnv = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl:
    trim(process.env.DATABASE_URL) ??
    trim(process.env.POSTGRES_PRISMA_URL) ??
    trim(process.env.POSTGRES_URL),
  authSecret: trim(process.env.AUTH_SECRET),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  leadRateLimitWindowMs: Number(process.env.LEAD_RATE_LIMIT_WINDOW_MS ?? 60_000),
  leadRateLimitMax: Number(process.env.LEAD_RATE_LIMIT_MAX ?? 5),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 60_000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
  supabaseUrl: resolveSupabaseProjectUrl(trim(process.env.SUPABASE_URL), resolveSupabaseServerAnonKey()),
  supabaseServiceRoleKey: trim(process.env.SUPABASE_SERVICE_ROLE_KEY),
  supabaseAnonKey: resolveSupabaseServerAnonKey(),
  supabaseJwtSecret: trim(process.env.SUPABASE_JWT_SECRET),
  authRedirectUrl: trim(process.env.AUTH_REDIRECT_URL),
  bootstrapSecret: trim(process.env.FOUNDER_BOOTSTRAP_SECRET),
  razorpayKeyId: trim(process.env.RAZORPAY_KEY_ID),
  razorpayKeySecret: trim(process.env.RAZORPAY_KEY_SECRET),
  razorpayWebhookSecret: trim(process.env.RAZORPAY_WEBHOOK_SECRET),
  storageBucket: trim(process.env.SUPABASE_STORAGE_BUCKET) || 'customer-files',
} as const

export function isDatabaseConfigured(): boolean {
  return Boolean(serverEnv.databaseUrl)
}

export function isRazorpayConfigured(): boolean {
  return Boolean(serverEnv.razorpayKeyId && serverEnv.razorpayKeySecret)
}

export function isRazorpayWebhookConfigured(): boolean {
  return Boolean(serverEnv.razorpayWebhookSecret)
}

export function isSupabaseConfigured(): boolean {
  return Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey)
}

export function isSupabasePasswordLoginConfigured(): boolean {
  return Boolean(serverEnv.supabaseUrl && serverEnv.supabaseAnonKey)
}

export function isSupabaseStorageConfigured(): boolean {
  return isSupabaseConfigured()
}
