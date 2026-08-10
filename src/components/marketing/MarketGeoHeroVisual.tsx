import { DecorativeScene } from '@/components/three/DecorativeScene'
import { HeroSceneFallback } from '@/components/three/HeroSceneFallback'

type MarketGeoHeroVisualProps = {
  sceneId: string
  scene:
    | 'aurora'
    | 'constellation'
    | 'lattice'
    | 'product-core'
}

const sceneLoaders = {
  aurora: () => import('@/components/three/scenes/HeroAuroraScene'),
  constellation: () => import('@/components/three/scenes/ServiceConstellationScene'),
  lattice: () => import('@/components/three/scenes/TechnologyLatticeScene'),
  'product-core': () => import('@/components/three/scenes/ProductCoreScene'),
} as const

export function MarketGeoHeroVisual({ sceneId, scene }: MarketGeoHeroVisualProps) {
  return (
    <DecorativeScene
      sceneId={sceneId}
      scene={sceneLoaders[scene]}
      fallback={<HeroSceneFallback />}
    />
  )
}
