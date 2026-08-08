const trim = (value: string | undefined) => value?.trim() || undefined

export const serverEnv = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: trim(process.env.DATABASE_URL),
  authSecret: trim(process.env.AUTH_SECRET),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  leadRateLimitWindowMs: Number(process.env.LEAD_RATE_LIMIT_WINDOW_MS ?? 60_000),
  leadRateLimitMax: Number(process.env.LEAD_RATE_LIMIT_MAX ?? 5),
} as const

export function isDatabaseConfigured(): boolean {
  return Boolean(serverEnv.databaseUrl)
}
