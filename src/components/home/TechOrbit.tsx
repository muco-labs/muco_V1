import type { CSSProperties } from 'react'
import { site } from '@/config/site'
import { techNodes } from '@/data/home-content'
import styles from './TechOrbit.module.css'

export function TechOrbit() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.orbit}>
        {techNodes.map((node, index) => (
          <span
            key={node.id}
            className={styles.node}
            style={{ '--index': index } as CSSProperties}
          >
            {node.label}
          </span>
        ))}
      </div>
      <div className={styles.center}>
        <span className={styles.centerMark} />
        <span className={styles.centerLabel}>{site.name}</span>
      </div>
    </div>
  )
}
