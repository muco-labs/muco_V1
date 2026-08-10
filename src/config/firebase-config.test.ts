import { describe, expect, it } from 'vitest'
import { isFirebaseWebConfigured, resolveFirebaseWebConfig } from './firebase-config'

describe('firebase-config', () => {
  it('loads muco-labs defaults from firebase-applet-config.json', () => {
    const config = resolveFirebaseWebConfig()
    expect(config).not.toBeNull()
    expect(config?.projectId).toBe('muco-labs')
    expect(config?.authDomain).toBe('muco-labs.firebaseapp.com')
    expect(isFirebaseWebConfigured()).toBe(true)
  })
})
