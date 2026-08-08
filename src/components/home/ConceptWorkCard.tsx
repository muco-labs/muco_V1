import styles from './ConceptWorkCard.module.css'

type ConceptWorkCardProps = {
  title: string
  type: string
  discipline: string
  description: string
}

export function ConceptWorkCard({
  title,
  type,
  discipline,
  description,
}: ConceptWorkCardProps) {
  return (
    <article className={`interactive-card ${styles.card}`}>
      <div className={styles.visual} aria-hidden="true">
        <span className={styles.visualGrid} />
      </div>
      <div className={styles.body}>
        <p className={styles.type}>{type}</p>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.discipline}>{discipline}</p>
        <p className={styles.description}>{description}</p>
      </div>
    </article>
  )
}
