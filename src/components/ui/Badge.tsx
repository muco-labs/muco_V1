import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import styles from './Badge.module.css'

type BadgeProps = {
  children: ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return <span className={cn(styles.badge, className)}>{children}</span>
}
