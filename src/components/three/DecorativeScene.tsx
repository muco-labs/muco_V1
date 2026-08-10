import {
  createContext,
  lazy,
  Suspense,
  useContext,
  type ComponentType,
  type ReactNode,
} from 'react'
import { ReducedMotionSceneGate } from '@/components/three/ReducedMotionSceneGate'
import { useSceneVisibility } from '@/components/three/useSceneVisibility'
import styles from './DecorativeScene.module.css'

const SceneScrollContext = createContext(0)

export function useSceneScrollProgress() {
  return useContext(SceneScrollContext)
}

type ScrollSceneSectionProps = {
  children: ReactNode
  scrollProgress?: number
  className?: string
}

export function ScrollSceneSection({
  children,
  scrollProgress = 0,
  className,
}: ScrollSceneSectionProps) {
  return (
    <SceneScrollContext.Provider value={scrollProgress}>
      <section className={className}>{children}</section>
    </SceneScrollContext.Provider>
  )
}

type DecorativeSceneProps = {
  sceneId: string
  scene: () => Promise<{ default: ComponentType<{ visible?: boolean }> }>
  fallback: ReactNode
  className?: string
  disableOnMobile?: boolean
}

const sceneCache = new Map<string, ComponentType<{ visible?: boolean }>>()

function loadScene(
  sceneId: string,
  loader: DecorativeSceneProps['scene'],
) {
  if (!sceneCache.has(sceneId)) {
    sceneCache.set(sceneId, lazy(loader))
  }
  return sceneCache.get(sceneId)!
}

export function DecorativeScene({
  sceneId,
  scene,
  fallback,
  className,
  disableOnMobile = true,
}: DecorativeSceneProps) {
  const { ref, visible } = useSceneVisibility()
  const Scene = loadScene(sceneId, scene)

  return (
    <div ref={ref} className={className ?? styles.mount}>
      <ReducedMotionSceneGate fallback={fallback} disableOnMobile={disableOnMobile}>
        {visible ? (
          <Suspense fallback={fallback}>
            <Scene visible={visible} />
          </Suspense>
        ) : (
          fallback
        )}
      </ReducedMotionSceneGate>
    </div>
  )
}
