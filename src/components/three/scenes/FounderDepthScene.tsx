import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { SceneCanvas } from '@/components/three/SceneCanvas'

type FounderDepthSceneProps = {
  visible?: boolean
}

function FounderDepthContent({ visible }: { visible: boolean }) {
  const plane = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (!visible || document.visibilityState === 'hidden') return
    if (plane.current) {
      plane.current.rotation.y = Math.sin(performance.now() * 0.0005) * 0.15
      plane.current.rotation.x += delta * 0.02
    }
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[-2, 2, 2]} intensity={0.9} color="#00c2ff" />
      <mesh ref={plane}>
        <planeGeometry args={[2.2, 2.8, 24, 24]} />
        <meshStandardMaterial
          color="#16204a"
          wireframe
          transparent
          opacity={0.35}
          emissive="#7c5cff"
          emissiveIntensity={0.12}
        />
      </mesh>
    </>
  )
}

export default function FounderDepthScene({ visible = true }: FounderDepthSceneProps) {
  return (
    <SceneCanvas visible={visible} cameraPosition={[0, 0, 3.2]} fov={38}>
      <FounderDepthContent visible={visible} />
    </SceneCanvas>
  )
}
