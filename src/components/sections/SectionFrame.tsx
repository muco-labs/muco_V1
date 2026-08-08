import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { cn } from '@/utils/cn'

type SectionFrameProps = {
  id?: string
  children: ReactNode
  className?: string
  tight?: boolean
  ariaLabelledBy?: string
}

export function SectionFrame({
  id,
  children,
  className,
  tight,
  ariaLabelledBy,
}: SectionFrameProps) {
  return (
    <section
      id={id}
      className={cn('section-shell', tight && 'section-shell--tight', className)}
      aria-labelledby={ariaLabelledBy}
    >
      <Container size="2xl">{children}</Container>
    </section>
  )
}
