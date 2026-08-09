import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiMagnifyingGlass, HiXMark } from 'react-icons/hi2'
import { routePaths } from '@/config/routes'
import { serviceCategories } from '@/data/services'
import { servicePath } from '@/config/routes'
import styles from './SiteSearchDialog.module.css'

const staticPages = [
  { label: 'Home', href: routePaths.home },
  { label: 'Services', href: routePaths.services },
  { label: 'Solutions', href: routePaths.solutions },
  { label: 'Work', href: routePaths.work },
  { label: 'About', href: routePaths.about },
  { label: 'Pricing', href: routePaths.pricing },
  { label: 'Contact', href: routePaths.contact },
  { label: 'Careers', href: routePaths.careers },
  { label: 'Start a project', href: '/start-project' },
  { label: 'Products', href: '/products' },
  { label: 'Client Hub', href: '/products/client-hub' },
]

const serviceLinks = serviceCategories.flatMap((category) =>
  category.offerings
    .filter((o) => o.slug)
    .map((o) => ({
      label: o.title,
      href: servicePath(o.slug!),
    })),
)

const allLinks = [...staticPages, ...serviceLinks]

type SiteSearchDialogProps = {
  open: boolean
  onClose: () => void
}

export function SiteSearchDialog({ open, onClose }: SiteSearchDialogProps) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    inputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allLinks.slice(0, 12)
    return allLinks.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 12)
  }, [query])

  if (!open) return null

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 id={titleId} className="sr-only">
            Search site
          </h2>
          <label className={styles.field}>
            <HiMagnifyingGlass aria-hidden className={styles.icon} />
            <input
              ref={inputRef}
              type="search"
              placeholder="Search pages and services…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </label>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close search">
            <HiXMark />
          </button>
        </div>
        <ul className={styles.results}>
          {results.map((item) => (
            <li key={`${item.href}-${item.label}`}>
              <Link to={item.href} onClick={onClose}>
                {item.label}
              </Link>
            </li>
          ))}
          {results.length === 0 ? (
            <li className={styles.empty}>No matches. Try &quot;contact&quot; or &quot;web&quot;.</li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
