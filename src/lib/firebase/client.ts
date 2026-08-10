import { initializeApp, type FirebaseApp } from 'firebase/app'
import { isFirebaseWebConfigured, resolveFirebaseWebConfig } from '@/config/firebase-config'

let app: FirebaseApp | null = null

export function isFirebaseGoogleConfigured(): boolean {
  return isFirebaseWebConfigured()
}

export function getFirebaseApp(): FirebaseApp {
  const config = resolveFirebaseWebConfig()
  if (!config) {
    throw new Error('Firebase is not configured.')
  }
  if (!app) {
    app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      measurementId: config.measurementId,
    })
  }
  return app
}
