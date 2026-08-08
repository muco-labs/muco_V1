import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import styles from './Container.module.css'

type ContainerProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'main'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function Container({
  children,
  className,
  as: Tag = 'div',
  size = 'xl',
}: ContainerProps) {
  return (
    <Tag className={cn(styles.container, styles[size], className)}>
      {children}
    </Tag>
  )
}
