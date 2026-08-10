import { motion, useScroll, useSpring } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/** Thin gradient beam along the top edge tracking scroll progress. */
export function ScrollProgress() {
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 })

  if (reducedMotion) return null

  return (
    <motion.div
      aria-hidden="true"
      style={{
        scaleX,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        transformOrigin: '0 50%',
        zIndex: 101,
        background:
          'linear-gradient(90deg, var(--color-brand-blue), var(--color-brand-cyan) 55%, var(--color-accent-aurora))',
        pointerEvents: 'none',
      }}
    />
  )
}
