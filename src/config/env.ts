const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export const env = {
  siteUrl: trimTrailingSlash(
    import.meta.env.VITE_SITE_URL ?? 'https://mucolabs.com',
  ),
  appUrl: trimTrailingSlash(
    import.meta.env.VITE_APP_URL ?? 'https://app.mucolabs.com',
  ),
  contactApiUrl: import.meta.env.VITE_CONTACT_API_URL?.trim() || undefined,
  isDev: import.meta.env.DEV,
} as const
