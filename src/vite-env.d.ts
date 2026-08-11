/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
  readonly VITE_APP_URL: string
  readonly VITE_CONTACT_API_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_GSC_VERIFICATION?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_AUTH_REDIRECT_URL?: string
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly DEPLOY_ENV?: string
  /** @deprecated Prefer DEPLOY_ENV — mirrored for legacy readers */
  readonly VERCEL_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
