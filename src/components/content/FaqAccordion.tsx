import { useId, useState } from 'react'
import type { FaqItem } from '@/content/faqs'
import styles from './FaqAccordion.module.css'

type FaqAccordionProps = {
  items: FaqItem[]
  title?: string
  description?: string
}

export function FaqAccordion({ items, title, description }: FaqAccordionProps) {
  const baseId = useId()
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  return (
    <section className={styles.section} aria-labelledby={title ? `${baseId}-title` : undefined}>
      {title ? (
        <header className={styles.header}>
          <p className="text-label">FAQ</p>
          <h2 id={`${baseId}-title`} className="text-h2">
            {title}
          </h2>
          {description ? <p className={styles.desc}>{description}</p> : null}
        </header>
      ) : null}
      <div className={styles.list}>
        {items.map((item) => {
          const isOpen = openId === item.id
          const panelId = `${baseId}-${item.id}`
          return (
            <article key={item.id} className="surface">
              <h3>
                <button
                  type="button"
                  className={styles.trigger}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                >
                  {item.question}
                  <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                </button>
              </h3>
              <div
                id={panelId}
                className={styles.panel}
                hidden={!isOpen}
                role="region"
                aria-labelledby={panelId}
              >
                <p>{item.answer}</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
