import { describe, expect, it } from 'vitest'
import { isFirebaseWebConfigured, resolveFirebaseWebConfig } from './firebase-config'

describe('firebase-config', () => {
  it('does not enable Firebase Google popup without VITE_FIREBASE_* env', () => {
    expect(isFirebaseWebConfigured()).toBe(false)
    expect(resolveFirebaseWebConfig()).toBeNull()
  })
})
