import { Link } from 'react-router-dom'
import type { ServiceHighlight } from '@/content/services-catalog'
import { servicePath } from '@/config/routes'
import { cn } from '@/utils/cn'
import styles from './ServiceCard.module.css'

type ServiceCardProps = {
  service: ServiceHighlight
  variant?: 'default' | 'featured'
}

export function ServiceCard({ service, variant = 'default' }: ServiceCardProps) {
  return (
    <article className={cn('surface surface--lift', styles.card, variant === 'featured' && styles.featured)}>
      <div className={styles.top}>
        <span className={styles.category}>{service.category}</span>
        {service.from ? <span className={styles.from}>From {service.from}</span> : null}
      </div>
      <h3 className="text-h3">
        <Link to={servicePath(service.slug)} className={styles.titleLink}>
          {service.title}
        </Link>
      </h3>
      <p className={styles.summary}>{service.summary}</p>
      <p className={styles.outcome}>
        <span className={styles.outcomeLabel}>Outcome</span> {service.delivers[0]}
        {service.delivers.length > 1 ? ` + ${service.delivers.length - 1} more` : ''}
      </p>
      <Link className={cn('link-underline', styles.cta)} to={servicePath(service.slug)}>
        Explore service
      </Link>
    </article>
  )
}
