import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { cn } from '@/utils/cn'
import styles from './SceneCanvas.module.css'

type SceneCanvasProps = {
  children: ReactNode
  className?: string
  visible?: boolean
  cameraPosition?: [number, number, number]
  fov?: number
}

export function SceneCanvas({
  children,
  className,
  visible = true,
  cameraPosition = [0, 0, 5],
  fov = 42,
}: SceneCanvasProps) {
  return (
    <div className={cn(styles.root, className)} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={visible ? 'always' : 'demand'}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: cameraPosition, fov }}
      >
        {children}
      </Canvas>
    </div>
  )
}
