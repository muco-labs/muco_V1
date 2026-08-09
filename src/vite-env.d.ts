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
  readonly VERCEL_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
