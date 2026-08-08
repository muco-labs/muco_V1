/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
  readonly VITE_APP_URL: string
  readonly VITE_CONTACT_API_URL?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_GSC_VERIFICATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
