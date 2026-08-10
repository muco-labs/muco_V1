import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

type RevealProps = {
  children: ReactNode
  className?: string
  as?: ElementType
  variant?: 'up' | 'fade' | 'slide-left'
  delayMs?: number
}

export function Reveal({
  children,
  className,
  as: Tag = 'div',
  variant = 'up',
  delayMs = 0,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -4% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const style: CSSProperties | undefined = delayMs ? { transitionDelay: `${delayMs}ms` } : undefined

  return createElement(
    Tag,
    {
      ref,
      className: cn(
        'reveal',
        variant === 'fade' && 'reveal--fade',
        variant === 'slide-left' && 'reveal--slide-left',
        visible && 'is-visible',
        className,
      ),
      style,
    },
    children,
  )
}
