import { resolveCanonicalSiteUrl } from './canonical-site'
import { resolveDeployEnv } from './deploy-env'
import { resolveSupabaseBrowserKey } from './resolve-supabase-browser-key'
import { resolveSupabaseProjectUrl } from './resolve-supabase-project-url'

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

function readDeployEnvFromBundle(): string | undefined {
  if (typeof import.meta.env !== 'undefined') {
    const meta = import.meta.env as ImportMetaEnv & { DEPLOY_ENV?: string; VERCEL_ENV?: string }
    if (meta.DEPLOY_ENV) return meta.DEPLOY_ENV
    if (meta.VERCEL_ENV) return meta.VERCEL_ENV
  }
  return resolveDeployEnv()
}

/** Values exposed to the browser bundle — never put server secrets in VITE_*. */
const supabaseAnonKey = resolveSupabaseBrowserKey(
  readViteEnv('VITE_SUPABASE_ANON_KEY'),
  readViteEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
)

export const env = {
  siteUrl: trimTrailingSlash(
    resolveCanonicalSiteUrl({
      viteSiteUrl: readViteEnv('VITE_SITE_URL'),
      deployEnv: readDeployEnvFromBundle(),
    }),
  ),
  appUrl: trimTrailingSlash(readViteEnv('VITE_APP_URL') ?? 'https://app.mucolabs.com'),
  apiBaseUrl: trimTrailingSlash(readViteEnv('VITE_API_BASE_URL') ?? ''),
  contactApiUrl: readViteEnv('VITE_CONTACT_API_URL')?.trim() || '/api/v1/leads',
  gaMeasurementId: readViteEnv('VITE_GA_MEASUREMENT_ID')?.trim() || undefined,
  gscVerification: readViteEnv('VITE_GSC_VERIFICATION')?.trim() || undefined,
  supabaseUrl: resolveSupabaseProjectUrl(readViteEnv('VITE_SUPABASE_URL'), supabaseAnonKey),
  supabaseAnonKey,
  authRedirectUrl: readViteEnv('VITE_AUTH_REDIRECT_URL')?.trim() || undefined,
  firebaseApiKey: readViteEnv('VITE_FIREBASE_API_KEY')?.trim() || undefined,
  firebaseAuthDomain: readViteEnv('VITE_FIREBASE_AUTH_DOMAIN')?.trim() || undefined,
  firebaseProjectId: readViteEnv('VITE_FIREBASE_PROJECT_ID')?.trim() || undefined,
  firebaseAppId: readViteEnv('VITE_FIREBASE_APP_ID')?.trim() || undefined,
  isDev: typeof import.meta.env !== 'undefined' ? Boolean(import.meta.env.DEV) : false,
} as const
