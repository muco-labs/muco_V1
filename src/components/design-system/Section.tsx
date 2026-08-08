import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import styles from './Section.module.css'

type SectionProps = {
  id?: string
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
  className?: string
  tight?: boolean
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  tight,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn('section', tight && 'section--tight', styles.section, className)}
    >
      <div className="shell">
        <header className={styles.header}>
          {eyebrow ? <p className="text-label">{eyebrow}</p> : null}
          <h2 id={id ? `${id}-title` : undefined} className="text-h2">
            {title}
          </h2>
          {description ? <p className={styles.description}>{description}</p> : null}
        </header>
        {children}
      </div>
    </section>
  )
}
