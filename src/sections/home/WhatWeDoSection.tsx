import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { homeSectionIds } from '@/data/home-sections'

export function WhatWeDoSection() {
  return (
    <SectionFrame id={homeSectionIds.whatWeDo} ariaLabelledBy="what-we-do-title">
      <SectionHeading
        eyebrow="Overview"
        title="What MUCO LABS does"
        description="A single partner for product engineering, intelligent automation, and growth systems—structured for long-term digital businesses."
      />
    </SectionFrame>
  )
}
