import { TechOrbit } from '@/components/home/TechOrbit'
import { SectionFrame } from '@/components/sections/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { homeSectionIds } from '@/data/home-sections'
import styles from './TechnologySection.module.css'

const stack = [
  'Web',
  'Mobile',
  'Cloud',
  'AI',
  'Automation',
  'Data',
  'Security',
  'APIs',
]

export function TechnologySection() {
  return (
    <SectionFrame id={homeSectionIds.technology} ariaLabelledBy="technology-title">
      <div className={styles.layout}>
        <div className={styles.copy}>
          <SectionHeading
            eyebrow="Technology"
            title="Engineering across the modern stack"
            titleId="technology-title"
            description="Web, mobile, cloud, AI, automation, data and security—integrated with intent, not bolted on."
          />
          <ul className={styles.stack} aria-label="Technology domains">
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <TechOrbit />
      </div>
    </SectionFrame>
  )
}
