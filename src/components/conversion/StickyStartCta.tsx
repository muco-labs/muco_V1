import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { contactHref } from '@/lib/conversion/contact-link'
import { analyticsEvents } from '@/lib/analytics'
import { routePaths } from '@/config/routes'
import styles from './StickyStartCta.module.css'

const hiddenPaths = [routePaths.contact, '/auth/']

export function StickyStartCta() {
  const location = useLocation()
  const hidden = hiddenPaths.some((path) => location.pathname.startsWith(path))

  if (hidden) return null

  const href = contactHref({ source: 'sticky' })

  return (
    <div className={styles.bar} role="region" aria-label="Quick action">
      <Button
        to={href}
        size="sm"
        className={styles.button}
        trackEvent={analyticsEvents.startProjectClick}
        trackParams={{ source: 'sticky' }}
      >
        Start a Project
      </Button>
    </div>
  )
}
