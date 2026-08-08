import { useCallback, useRef, type CSSProperties, type PointerEvent } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import styles from './HeroVisual.module.css'

export function HeroVisual() {
  const reducedMotion = useReducedMotion()
  const visualRef = useRef<HTMLDivElement>(null)

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !visualRef.current) return
      const rect = visualRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      visualRef.current.style.setProperty('--parallax-x', `${x * 12}px`)
      visualRef.current.style.setProperty('--parallax-y', `${y * 12}px`)
    },
    [reducedMotion],
  )

  return (
    <div
      ref={visualRef}
      className={styles.visual}
      aria-hidden="true"
      onPointerMove={onPointerMove}
    >
      <div className={styles.glow} />
      <div className={styles.grid} />
      <div className={styles.ring} />
      <div className={styles.core} />
      <ul className={styles.particles}>
        {Array.from({ length: 10 }, (_, index) => (
          <li key={index} style={{ '--i': index } as CSSProperties} />
        ))}
      </ul>
    </div>
  )
}
