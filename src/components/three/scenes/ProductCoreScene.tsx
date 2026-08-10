import { Float, MeshDistortMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { SceneCanvas } from '@/components/three/SceneCanvas'

type ProductCoreSceneProps = {
  visible?: boolean
}

export default function ProductCoreScene({ visible = true }: ProductCoreSceneProps) {
  const core = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (!visible || document.visibilityState === 'hidden') return
    if (core.current) core.current.rotation.y += delta * 0.22
  })

  return (
    <SceneCanvas visible={visible} cameraPosition={[0, 0, 3.8]} fov={42}>
      <ambientLight intensity={0.45} />
      <pointLight position={[2, 2, 3]} intensity={1.1} color="#7c5cff" />
      <Float speed={1.2} floatIntensity={0.4}>
        <mesh ref={core}>
          <octahedronGeometry args={[0.95, 0]} />
          <MeshDistortMaterial
            color="#00c2ff"
            roughness={0.15}
            metalness={0.9}
            distort={0.28}
            speed={1.8}
          />
        </mesh>
      </Float>
    </SceneCanvas>
  )
}
