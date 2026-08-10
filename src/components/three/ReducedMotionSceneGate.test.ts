import { describe, expect, it } from 'vitest'
import { shouldMountWebGlScene } from '@/components/three/ReducedMotionSceneGate'

describe('shouldMountWebGlScene', () => {
  it('blocks when reduced motion is preferred', () => {
    expect(shouldMountWebGlScene(true, false, true)).toBe(false)
  })

  it('blocks on mobile when disableOnMobile is true', () => {
    expect(shouldMountWebGlScene(false, true, true)).toBe(false)
  })

  it('allows desktop when motion is ok', () => {
    expect(shouldMountWebGlScene(false, false, true)).toBe(true)
  })
})
