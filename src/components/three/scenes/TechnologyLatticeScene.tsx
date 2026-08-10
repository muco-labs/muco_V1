/** R3F hooks must run inside SceneCanvas children, not this file's default export wrapper. */
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'
import { SceneCanvas } from '@/components/three/SceneCanvas'
import { useSceneScrollProgress } from '@/components/three/DecorativeScene'

type TechnologyLatticeSceneProps = {
  visible?: boolean
}

function TechnologyLatticeContent({ visible }: { visible: boolean }) {
  const group = useRef<Group>(null)
  const scroll = useSceneScrollProgress()

  useFrame((_, delta) => {
    if (!visible || document.visibilityState === 'hidden') return
    if (!group.current) return
    group.current.rotation.y += delta * (0.25 + scroll * 0.4)
    group.current.rotation.x = scroll * 0.35
  })

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[2, 3, 3]} intensity={1} color="#00c2ff" />
      <group ref={group}>
        <mesh>
          <torusKnotGeometry args={[0.85, 0.22, 120, 16]} />
          <meshStandardMaterial color="#7c5cff" wireframe transparent opacity={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.4, 1.55, 64]} />
          <meshBasicMaterial color="#1e88ff" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  )
}

export default function TechnologyLatticeScene({ visible = true }: TechnologyLatticeSceneProps) {
  return (
    <SceneCanvas visible={visible} cameraPosition={[0, 0, 4]} fov={40}>
      <TechnologyLatticeContent visible={visible} />
    </SceneCanvas>
  )
}
