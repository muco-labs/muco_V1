import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { HeroVisual } from '@/components/home/HeroVisual'
import { SectionFrame } from '@/components/sections/SectionFrame'
import { routePaths } from '@/config/routes'
import { hero } from '@/data/home-content'
import { homeSectionIds } from '@/data/home-sections'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import styles from './HeroSection.module.css'

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function HeroSection() {
  const reducedMotion = useReducedMotion()

  const motionProps = reducedMotion
    ? {}
    : {
        initial: 'hidden',
        animate: 'show',
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
      }

  return (
    <SectionFrame
      id={homeSectionIds.hero}
      hero
      ariaLabelledBy="hero-title"
      className={styles.hero}
    >
      <div className={styles.grid}>
        <motion.div className={styles.copy} {...motionProps}>
          <motion.p className={styles.eyebrow} variants={fade}>
            Technology · Software · AI
          </motion.p>
          <motion.h1 id="hero-title" className={styles.title} variants={fade}>
            {hero.headline}
          </motion.h1>
          <motion.p className={styles.lead} variants={fade}>
            {hero.subcopy}
          </motion.p>
          <motion.div className={styles.actions} variants={fade}>
            <Button to={routePaths.contact} size="lg">
              {hero.primaryCta}
            </Button>
            <Button to={routePaths.services} variant="secondary" size="lg">
              {hero.secondaryCta}
            </Button>
          </motion.div>
        </motion.div>
        <motion.div
          className={styles.visualWrap}
          {...(reducedMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6, delay: 0.15 } })}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </SectionFrame>
  )
}
