import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import styles from './MarketLandingHero.module.css'

type BreadcrumbItem = {
  label: string
  href?: string
}

type MarketLandingHeroProps = {
  breadcrumbs: BreadcrumbItem[]
  label: string
  title: string
  lead: string
  visual?: ReactNode
  children?: ReactNode
}

export function MarketLandingHero({
  breadcrumbs,
  label,
  title,
  lead,
  visual,
  children,
}: MarketLandingHeroProps) {
  return (
    <header className={styles.hero}>
      {visual ? <div className={styles.visual}>{visual}</div> : null}
      <div className="shell">
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className={styles.crumb}>
              {item.href ? <Link to={item.href}>{item.label}</Link> : <span>{item.label}</span>}
              {index < breadcrumbs.length - 1 ? (
                <span aria-hidden="true" className={styles.sep}>
                  /
                </span>
              ) : null}
            </span>
          ))}
        </nav>
        <Reveal>
          <p className="text-label">{label}</p>
          <h1 className="text-display">{title}</h1>
          <p className={styles.lead}>{lead}</p>
          {children}
        </Reveal>
      </div>
    </header>
  )
}
