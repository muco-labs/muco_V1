import styles from './FounderPortrait.module.css'

type PortraitSize = 'md' | 'lg' | 'hero' | 'team' | 'editorial'

type FounderPortraitProps = {
  name: string
  imageSrc?: string
  size?: PortraitSize
  /** Shown on intentional placeholder surfaces (e.g. "Founder photo"). */
  placeholderLabel?: string
  objectPosition?: string
  loading?: 'lazy' | 'eager'
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
  objectPosition = 'center 20%',
  loading = 'lazy',
}: FounderPortraitProps) {
  const initials = initialsFromName(name)
  const hoverable = size === 'lg' || size === 'hero' || size === 'md'

  if (imageSrc) {
    return (
      <div
        className={`${styles.frame} ${styles[size]} ${hoverable ? styles.interactive : ''}`}
      >
        <img
          src={imageSrc}
          alt={name}
          className={styles.photo}
          style={{ objectPosition }}
          loading={loading}
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
