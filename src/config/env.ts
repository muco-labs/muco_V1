const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

/** Values exposed to the browser bundle — never put server secrets in VITE_*. */
export const env = {
  siteUrl: trimTrailingSlash(
    import.meta.env.VITE_SITE_URL ?? 'https://mucolabs.com',
  ),
  appUrl: trimTrailingSlash(
    import.meta.env.VITE_APP_URL ?? 'https://app.mucolabs.com',
  ),
  contactApiUrl: import.meta.env.VITE_CONTACT_API_URL?.trim() || undefined,
  gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || undefined,
  gscVerification: import.meta.env.VITE_GSC_VERIFICATION?.trim() || undefined,
  isDev: import.meta.env.DEV,
} as const
