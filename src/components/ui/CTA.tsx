import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { cn } from '@/utils/cn'
import styles from './CTA.module.css'

type CTAProps = {
  title: string
  description?: ReactNode
  primaryLabel: string
  primaryTo: string
  secondaryLabel?: string
  secondaryTo?: string
  className?: string
}

export function CTA({
  title,
  description,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  className,
}: CTAProps) {
  return (
    <section className={cn(styles.cta, className)} aria-labelledby="cta-title">
      <Container>
        <div className={styles.inner}>
          <SectionHeading
            title={title}
            description={description}
            align="center"
            className={styles.heading}
          />
          <div className={styles.actions}>
            <Button to={primaryTo} size="lg">
              {primaryLabel}
            </Button>
            {secondaryLabel && secondaryTo ? (
              <Button to={secondaryTo} variant="secondary" size="lg">
                {secondaryLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}
