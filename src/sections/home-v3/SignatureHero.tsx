import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { TechnicalBackdrop } from '@/components/opening/TechnicalBackdrop'
import { DecorativeScene } from '@/components/three/DecorativeScene'
import { routePaths } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import { HeroSignalPanel } from '@/components/home/HeroSignalPanel'
import { HeroSceneFallback } from '@/components/three/HeroSceneFallback'
import { Magnetic } from '@/components/motion/Magnetic'
import { Reveal } from '@/components/motion/Reveal'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { company } from '@/content/company'
import { site } from '@/config/site'
import { analyticsEvents } from '@/lib/analytics'
import { startProjectHref } from '@/lib/conversion/start-project-link'
import styles from './SignatureHero.module.css'

const HEADLINE_LEAD = ['We', 'build', 'digital', 'products', 'that']
const HEADLINE_HIGHLIGHT = 'move businesses forward.'
const HEADLINE_LABEL = `${HEADLINE_LEAD.join(' ')} ${HEADLINE_HIGHLIGHT}`

const headlineContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
}

const headlineWord = {
  hidden: { opacity: 0, y: '0.45em', filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: '0em',
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function SignatureHero() {
  const reducedMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const backdropY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const visualY = useTransform(scrollYProgress, [0, 1], [0, -50])

  return (
    <section ref={heroRef} className={styles.hero} aria-labelledby="home-hero-title">
      <motion.div
        className={styles.backdropLayer}
        style={reducedMotion ? undefined : { y: backdropY }}
        aria-hidden="true"
      >
        <TechnicalBackdrop intensity="ambient" className={styles.backdrop} />
        <DecorativeScene
          sceneId="home-hero-aurora"
          className={styles.sceneCanvas}
          scene={() => import('@/components/three/scenes/HeroAuroraScene')}
          fallback={<HeroSceneFallback />}
        />
      </motion.div>
      <div className="shell">
        <div className={styles.grid}>
          <Reveal className={styles.copy}>
            <p className="eyebrow-line">{site.name} · Web, software & AI</p>
            {reducedMotion ? (
              <h1 id="home-hero-title" className="text-display">
                {HEADLINE_LEAD.join(' ')}{' '}
                <span className={styles.highlight}>{HEADLINE_HIGHLIGHT}</span>
              </h1>
            ) : (
              <motion.h1
                id="home-hero-title"
                className="text-display"
                aria-label={HEADLINE_LABEL}
                variants={headlineContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
              >
                {HEADLINE_LEAD.map((word, index) => (
                  <motion.span
                    key={`${word}-${index}`}
                    className={styles.word}
                    variants={headlineWord}
                    aria-hidden="true"
                  >
                    {word}
                    {'\u00A0'}
                  </motion.span>
                ))}
                <motion.span
                  className={`${styles.word} ${styles.highlight}`}
                  variants={headlineWord}
                  aria-hidden="true"
                >
                  {HEADLINE_HIGHLIGHT}
                </motion.span>
              </motion.h1>
            )}
            <p className={styles.lead}>
              <strong>MUCO LABS</strong> is a founder-led technology company in Erode—websites,
              custom software, mobile apps, AI systems and growth programs for teams who need
              clarity, craft and accountable delivery. {company.positioning}
            </p>
            <div className={styles.actions}>
              <Magnetic>
                <Button
                  to={startProjectHref({ source: 'home_hero' })}
                  size="lg"
                  trackEvent={analyticsEvents.heroCtaClick}
                  trackParams={{ source: 'home_hero', cta: 'start_project' }}
                >
                  Start a project
                </Button>
              </Magnetic>
              <Magnetic strength={0.22}>
                <Button
                  to={routePaths.contact}
                  variant="secondary"
                  size="lg"
                  trackEvent={analyticsEvents.contactClick}
                  trackParams={{ source: 'home_hero', cta: 'contact' }}
                >
                  Talk to us
                </Button>
              </Magnetic>
              <Button
                to={routePaths.work}
                variant="ghost"
                size="lg"
                trackEvent={analyticsEvents.heroCtaClick}
                trackParams={{ source: 'home_hero', cta: 'view_work' }}
              >
                View work
              </Button>
            </div>
          </Reveal>

          <Reveal className={styles.visual} variant="slide-left" delayMs={120}>
            <motion.div style={reducedMotion ? undefined : { y: visualY }}>
              <HeroSignalPanel />
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
