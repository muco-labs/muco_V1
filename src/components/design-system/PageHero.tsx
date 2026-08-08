import type { ReactNode } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import styles from './PageHero.module.css'

type PageHeroProps = {
  eyebrow: string
  title: string
  lead: string
  children?: ReactNode
}

export function PageHero({ eyebrow, title, lead, children }: PageHeroProps) {
  return (
    <header className={styles.hero}>
      <div className="shell">
        <Reveal className={styles.inner}>
          <p className="text-label">{eyebrow}</p>
          <h1 className="text-display">{title}</h1>
          <p className={styles.lead}>{lead}</p>
          {children}
        </Reveal>
      </div>
    </header>
  )
}
