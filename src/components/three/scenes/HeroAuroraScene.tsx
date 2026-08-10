import { Float, Grid, MeshDistortMaterial, Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { SceneCanvas } from '@/components/three/SceneCanvas'

type HeroAuroraSceneProps = {
  visible?: boolean
}

function HeroAuroraContent({ visible }: { visible: boolean }) {
  const orb = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!visible || document.visibilityState === 'hidden') return
    if (orb.current) {
      orb.current.rotation.y += delta * 0.18
      orb.current.rotation.x = Math.sin(performance.now() * 0.0004) * 0.12
    }
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 2, 4]} intensity={1.4} color="#00c2ff" />
      <pointLight position={[-4, -1, 2]} intensity={0.7} color="#7c5cff" />
      <Stars radius={70} depth={35} count={900} factor={2.5} fade speed={0.35} />
      <Grid
        infiniteGrid
        fadeDistance={22}
        cellColor="rgba(30, 136, 255, 0.35)"
        sectionColor="rgba(124, 92, 255, 0.45)"
        position={[0, -1.6, 0]}
        cellSize={0.35}
      />
      <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.55}>
        <group ref={orb} position={[1.2, 0.1, 0]}>
          <mesh>
            <icosahedronGeometry args={[1.05, 2]} />
            <MeshDistortMaterial
              color="#1e88ff"
              roughness={0.25}
              metalness={0.8}
              distort={0.32}
              speed={1.4}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      </Float>
    </>
  )
}

export default function HeroAuroraScene({ visible = true }: HeroAuroraSceneProps) {
  return (
    <SceneCanvas visible={visible} cameraPosition={[0, 0.15, 4.5]} fov={48}>
      <HeroAuroraContent visible={visible} />
    </SceneCanvas>
  )
}
