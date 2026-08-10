import { cn } from '@/utils/cn'
import styles from './HeroSceneFallback.module.css'

type HeroSceneFallbackProps = {
  className?: string
  variant?: 'poster' | 'gradient'
}

export function HeroSceneFallback({ className, variant = 'poster' }: HeroSceneFallbackProps) {
  return (
    <div
      className={cn(variant === 'poster' ? styles.poster : styles.gradient, className)}
      aria-hidden="true"
    />
  )
}
