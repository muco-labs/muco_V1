/**
 * Production security reference — keep vercel.json (or host config) aligned with these values.
 *
 * Client bundle: only VITE_* variables are public. Never put API secrets in VITE_.
 * Server-only secrets (webhooks, DB, signing keys) belong on the backend / host env.
 */

export const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
] as const

/**
 * CSP for static marketing site + optional GA4 + Google Fonts.
 * When VITE_CONTACT_API_URL points to another origin, add that host to connect-src on the host.
 */
export const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://*.supabase.co wss://*.supabase.co https:",
].join('; ')

export const staticAssetCacheControl = 'public, max-age=31536000, immutable'
