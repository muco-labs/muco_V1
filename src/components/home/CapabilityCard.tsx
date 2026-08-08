import { Link } from 'react-router-dom'
import type { CapabilityId } from '@/data/home-content'
import styles from './CapabilityCard.module.css'

type CapabilityCardProps = {
  id: CapabilityId
  title: string
  description: string
  href: string
}

const icons: Record<CapabilityId, string> = {
  build: '▣',
  design: '◈',
  automate: '◎',
  grow: '↗',
}

export function CapabilityCard({
  id,
  title,
  description,
  href,
}: CapabilityCardProps) {
  return (
    <Link to={href} className={`interactive-card ${styles.card}`}>
      <span className={styles.icon} aria-hidden="true">
        {icons[id]}
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <span className={styles.action}>Explore</span>
    </Link>
  )
}
