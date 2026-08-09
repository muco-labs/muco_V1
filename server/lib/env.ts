const trim = (value: string | undefined) => value?.trim() || undefined

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
  supabaseUrl: trim(process.env.SUPABASE_URL),
  supabaseServiceRoleKey: trim(process.env.SUPABASE_SERVICE_ROLE_KEY),
  supabaseAnonKey:
    trim(process.env.SUPABASE_ANON_KEY) ??
    trim(process.env.SUPABASE_PUBLISHABLE_KEY) ??
    trim(process.env.VITE_SUPABASE_PUBLISHABLE_KEY) ??
    trim(process.env.VITE_SUPABASE_ANON_KEY),
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
