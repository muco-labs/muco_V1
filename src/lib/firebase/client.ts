import { initializeApp, type FirebaseApp } from 'firebase/app'
import { env } from '@/config/env'

let app: FirebaseApp | null = null

export function isFirebaseGoogleConfigured(): boolean {
  return Boolean(
    env.firebaseApiKey &&
      env.firebaseAuthDomain &&
      env.firebaseProjectId &&
      env.firebaseAppId,
  )
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseGoogleConfigured()) {
    throw new Error('Firebase is not configured.')
  }
  if (!app) {
    app = initializeApp({
      apiKey: env.firebaseApiKey!,
      authDomain: env.firebaseAuthDomain!,
      projectId: env.firebaseProjectId!,
      appId: env.firebaseAppId!,
    })
  }
  return app
}
