import { DEFAULT_CANONICAL_SITE_URL } from './canonical-site'

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

function readViteEnv(key: string): string | undefined {
  if (typeof import.meta.env !== 'undefined' && import.meta.env) {
    const fromVite = (import.meta.env as Record<string, string | undefined>)[key]
    if (fromVite !== undefined && fromVite !== '') return fromVite
  }
  const rawNodeEnv =
    typeof globalThis !== 'undefined' &&
    'process' in globalThis &&
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  const nodeEnv = rawNodeEnv && typeof rawNodeEnv === 'object' ? rawNodeEnv : undefined
  return nodeEnv?.[key]
}

/** Values exposed to the browser bundle — never put server secrets in VITE_*. */
export const env = {
  siteUrl: trimTrailingSlash(readViteEnv('VITE_SITE_URL') ?? DEFAULT_CANONICAL_SITE_URL),
  appUrl: trimTrailingSlash(readViteEnv('VITE_APP_URL') ?? 'https://app.mucolabs.com'),
  apiBaseUrl: trimTrailingSlash(readViteEnv('VITE_API_BASE_URL') ?? ''),
  contactApiUrl: readViteEnv('VITE_CONTACT_API_URL')?.trim() || '/api/v1/leads',
  gaMeasurementId: readViteEnv('VITE_GA_MEASUREMENT_ID')?.trim() || undefined,
  gscVerification: readViteEnv('VITE_GSC_VERIFICATION')?.trim() || undefined,
  supabaseUrl: readViteEnv('VITE_SUPABASE_URL')?.trim() || undefined,
  supabaseAnonKey:
    readViteEnv('VITE_SUPABASE_PUBLISHABLE_KEY')?.trim() ||
    readViteEnv('VITE_SUPABASE_ANON_KEY')?.trim() ||
    undefined,
  authRedirectUrl: readViteEnv('VITE_AUTH_REDIRECT_URL')?.trim() || undefined,
  isDev: typeof import.meta.env !== 'undefined' ? Boolean(import.meta.env.DEV) : false,
} as const
