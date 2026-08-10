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

/** Env overrides win; otherwise defaults from muco-webpage `firebase-applet-config.json`. */
export function resolveFirebaseWebConfig(): FirebaseWebConfig | null {
  const apiKey = env.firebaseApiKey ?? appletDefaults.apiKey?.trim()
  const authDomain = env.firebaseAuthDomain ?? appletDefaults.authDomain?.trim()
  const projectId = env.firebaseProjectId ?? appletDefaults.projectId?.trim()
  const appId = env.firebaseAppId ?? appletDefaults.appId?.trim()

  if (!apiKey || !authDomain || !projectId || !appId) {
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

export function isFirebaseWebConfigured(): boolean {
  return resolveFirebaseWebConfig() !== null
}
