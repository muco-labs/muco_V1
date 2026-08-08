import { useEffect, useRef } from 'react'
import styles from './HeroSignalPanel.module.css'

const LINES = [
  '> muco build --scope product',
  '> stack: web · mobile · ai · growth',
  '> status: shipping with intent',
]

export function HeroSignalPanel() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8
      el.style.setProperty('--tilt-x', `${y}deg`)
      el.style.setProperty('--tilt-y', `${-x}deg`)
    }

    el.addEventListener('pointermove', onMove)
    return () => el.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div ref={ref} className={styles.panel} aria-hidden="true">
      <div className={styles.scan} />
      <div className={styles.grid} />
      <div className={styles.terminal}>
        <span className={styles.terminalLabel}>signal</span>
        <pre className={styles.code}>
          {LINES.map((line) => (
            <span key={line} className={styles.line}>
              {line}
            </span>
          ))}
        </pre>
      </div>
      <div className={styles.orbit} />
      <ul className={styles.pills}>
        <li>Product</li>
        <li>Platform</li>
        <li>Automation</li>
        <li>Growth</li>
      </ul>
    </div>
  )
}
