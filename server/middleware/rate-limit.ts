import { serverEnv } from '../lib/env.js'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function checkRateLimit(
  key: string,
  options?: { max?: number; windowMs?: number },
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const windowMs = options?.windowMs ?? serverEnv.leadRateLimitWindowMs
  const max = options?.max ?? serverEnv.leadRateLimitMax

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now }
  }

  bucket.count += 1
  return { allowed: true }
}

/**
 * In-memory limiter for serverless/dev. For production scale, use Redis/Upstash
 * with a shared store across function instances.
 */
export function rateLimitKeyFromRequest(ip: string | undefined, route: string): string {
  return `${route}:${ip ?? 'unknown'}`
}
