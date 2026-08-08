import { Link } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { FaqAccordion } from '@/components/content/FaqAccordion'
import { faqs, homeFaqIds } from '@/content/faqs'
import { routePaths } from '@/config/routes'
import styles from './HomeFaq.module.css'

const homeFaqs = homeFaqIds
  .map((id) => faqs.find((f) => f.id === id))
  .filter((f): f is (typeof faqs)[number] => Boolean(f))

export function HomeFaqSection() {
  return (
    <section className="section" aria-labelledby="home-faq-title">
      <div className="shell">
        <FaqAccordion
          items={homeFaqs}
          title="Common questions"
          description="Straight answers about timelines, pricing and how we work."
        />
        <Reveal className={styles.more}>
          <Link className="link-underline" to={routePaths.contact}>
            Ask something else
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
