import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import styles from './Card.module.css'

type CardProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'li'
}

export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return <Tag className={cn(styles.card, className)}>{children}</Tag>
}
