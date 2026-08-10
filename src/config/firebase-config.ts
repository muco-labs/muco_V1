import { env } from '@/config/env'
import appletDefaults from './firebase-applet-config.json'

export type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  storageBucket?: string
  messagingSenderId?: string
  measurementId?: string
}

/** Env overrides win; applet fills gaps only when VITE_FIREBASE_API_KEY is set on the host. */
export function resolveFirebaseWebConfig(): FirebaseWebConfig | null {
  if (!env.firebaseApiKey?.trim()) {
    return null
  }

  const apiKey = env.firebaseApiKey.trim()
  const authDomain = env.firebaseAuthDomain?.trim() ?? appletDefaults.authDomain?.trim()
  const projectId = env.firebaseProjectId?.trim() ?? appletDefaults.projectId?.trim()
  const appId = env.firebaseAppId?.trim() ?? appletDefaults.appId?.trim()

  if (!authDomain || !projectId || !appId) {
    return null
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: appletDefaults.storageBucket,
    messagingSenderId: appletDefaults.messagingSenderId,
    measurementId: appletDefaults.measurementId,
  }
}

/** Popup Google only when operator set VITE_FIREBASE_* on the host (not bundled applet alone). */
export function isFirebaseWebConfigured(): boolean {
  return Boolean(
    env.firebaseApiKey?.trim() &&
      env.firebaseAuthDomain?.trim() &&
      env.firebaseProjectId?.trim() &&
      env.firebaseAppId?.trim(),
  )
}
