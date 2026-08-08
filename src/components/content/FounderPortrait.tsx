import styles from './FounderPortrait.module.css'

type FounderPortraitProps = {
  name: string
  imageSrc?: string
  size?: 'md' | 'lg' | 'hero'
  /** Shown on intentional placeholder surfaces (e.g. "Founder photo"). */
  placeholderLabel?: string
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function FounderPortrait({
  name,
  imageSrc,
  size = 'lg',
  placeholderLabel = 'Photo pending',
}: FounderPortraitProps) {
  const initials = initialsFromName(name)

  if (imageSrc) {
    return (
      <div className={`${styles.frame} ${styles[size]} ${styles.interactive}`}>
        <img
          src={imageSrc}
          alt={name}
          className={styles.photo}
          loading="lazy"
          decoding="async"
        />
      </div>
    )
  }

  return (
    <div
      className={`${styles.frame} ${styles[size]} ${styles.initials} ${styles.interactive} ${styles.placeholder}`}
      role="img"
      aria-label={`${name}. ${placeholderLabel}.`}
    >
      <span className={styles.initialsText}>{initials}</span>
      <span className={styles.placeholderCaption}>{placeholderLabel}</span>
    </div>
  )
}
