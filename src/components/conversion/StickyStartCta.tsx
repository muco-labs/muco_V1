import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import { startProjectPaths } from '@/config/start-project'
import { analyticsEvents } from '@/lib/analytics'
import { routePaths } from '@/config/routes'
import styles from './StickyStartCta.module.css'

const hiddenPaths = [routePaths.contact, '/auth/', startProjectPaths.entry, '/app/start-project']

export function StickyStartCta() {
  const location = useLocation()
  const hidden = hiddenPaths.some((path) => location.pathname.startsWith(path))

  if (hidden) return null

  const href = startProjectHref({ source: 'sticky' })

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
