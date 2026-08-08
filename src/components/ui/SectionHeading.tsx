import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import styles from './SectionHeading.module.css'

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  titleId?: string
  description?: ReactNode
  align?: 'start' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  titleId,
  description,
  align = 'start',
  className,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(styles.heading, align === 'center' && styles.center, className)}
    >
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {description ? <div className={styles.description}>{description}</div> : null}
    </header>
  )
}
