import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { HiChevronDown } from 'react-icons/hi2'
import type { NavItem } from '@/data/navigation'
import { cn } from '@/utils/cn'
import styles from './NavDropdown.module.css'

type NavDropdownProps = {
  item: NavItem & { children: NonNullable<NavItem['children']> }
}

export function NavDropdown({ item }: NavDropdownProps) {
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLLIElement>(null)
  const location = useLocation()

  const isActive = item.children.some(
    (child) => location.pathname === child.href || location.pathname.startsWith(`${child.href}/`),
  )

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <li ref={rootRef} className={styles.item}>
      <button
        type="button"
        className={cn(styles.trigger, isActive && styles.active)}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {item.label}
        <HiChevronDown className={cn(styles.chevron, open && styles.chevronOpen)} aria-hidden />
      </button>
      <div id={menuId} className={cn(styles.menu, open && styles.menuOpen)} role="menu">
        {item.children.map((child) => (
          <Link
            key={child.href}
            to={child.href}
            className={styles.menuLink}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className={styles.menuLabel}>{child.label}</span>
            {child.description ? (
              <span className={styles.menuDesc}>{child.description}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </li>
  )
}

export function NavPlainLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <NavLink to={href} className={({ isActive }) => cn(styles.link, isActive && styles.active)}>
        {label}
      </NavLink>
    </li>
  )
}
