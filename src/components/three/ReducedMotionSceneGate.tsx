import type { ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { usePreferLightScene } from '@/components/three/useSceneVisibility'

export function shouldMountWebGlScene(
  reducedMotion: boolean,
  lightScene: boolean,
  disableOnMobile: boolean,
) {
  if (reducedMotion) return false
  if (disableOnMobile && lightScene) return false
  return true
}

type ReducedMotionSceneGateProps = {
  children: ReactNode
  fallback: ReactNode
  /** When true, skip WebGL on mobile widths. */
  disableOnMobile?: boolean
}

export function ReducedMotionSceneGate({
  children,
  fallback,
  disableOnMobile = true,
}: ReducedMotionSceneGateProps) {
  const reducedMotion = useReducedMotion()
  const lightScene = usePreferLightScene()

  if (!shouldMountWebGlScene(reducedMotion, lightScene, disableOnMobile)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
