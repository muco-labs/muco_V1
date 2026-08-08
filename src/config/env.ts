const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

/** Values exposed to the browser bundle — never put server secrets in VITE_*. */
export const env = {
  siteUrl: trimTrailingSlash(
    import.meta.env.VITE_SITE_URL ?? 'https://mucolabs.com',
  ),
  appUrl: trimTrailingSlash(
    import.meta.env.VITE_APP_URL ?? 'https://app.mucolabs.com',
  ),
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? ''),
  contactApiUrl:
    import.meta.env.VITE_CONTACT_API_URL?.trim() || '/api/v1/leads',
  gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || undefined,
  gscVerification: import.meta.env.VITE_GSC_VERIFICATION?.trim() || undefined,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() || undefined,
  supabaseAnonKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    undefined,
  authRedirectUrl: import.meta.env.VITE_AUTH_REDIRECT_URL?.trim() || undefined,
  isDev: import.meta.env.DEV,
} as const
