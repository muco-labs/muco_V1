import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type PageTransitionProps = {
  children: ReactNode
  routeKey: string
}

export function PageTransition({ children, routeKey }: PageTransitionProps) {
  const reducedMotion = useReducedMotion()
  const isHome = routeKey === '/'

  if (reducedMotion || isHome) {
    return <div key={routeKey}>{children}</div>
  }

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 16, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.998 }}
      transition={{
        duration: 0.36,
        ease: [0.16, 1, 0.3, 1],
        scale: { duration: 0.44, ease: [0.34, 1.2, 0.64, 1] },
      }}
    >
      {children}
    </motion.div>
  )
}
