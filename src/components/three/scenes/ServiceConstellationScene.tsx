import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Points } from 'three'
import * as THREE from 'three'
import { SceneCanvas } from '@/components/three/SceneCanvas'

type ServiceConstellationSceneProps = {
  visible?: boolean
}

function ServiceConstellationContent({ visible }: { visible: boolean }) {
  const points = useRef<Points>(null)
  const positions = useMemo(() => {
    const count = 140
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const r = 1.6 + Math.random() * 0.8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])

  useFrame((_, delta) => {
    if (!visible || document.visibilityState === 'hidden') return
    if (points.current) points.current.rotation.y += delta * 0.08
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <points ref={points} geometry={geometry}>
        <pointsMaterial
          size={0.04}
          color="#00c2ff"
          transparent
          opacity={0.85}
          sizeAttenuation
        />
      </points>
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#1e88ff" emissive="#1e88ff" emissiveIntensity={0.35} />
      </mesh>
    </>
  )
}

export default function ServiceConstellationScene({ visible = true }: ServiceConstellationSceneProps) {
  return (
    <SceneCanvas visible={visible} cameraPosition={[0, 0, 5]} fov={45}>
      <ServiceConstellationContent visible={visible} />
    </SceneCanvas>
  )
}
