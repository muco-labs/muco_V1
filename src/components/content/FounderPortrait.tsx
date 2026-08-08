import styles from './FounderPortrait.module.css'

type FounderPortraitProps = {
  name: string
  imageSrc?: string
  size?: 'md' | 'lg'
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function FounderPortrait({ name, imageSrc, size = 'lg' }: FounderPortraitProps) {
  const initials = initialsFromName(name)

  if (imageSrc) {
    return (
      <div className={`${styles.frame} ${styles[size]}`}>
        <img src={imageSrc} alt="" className={styles.photo} loading="lazy" decoding="async" />
      </div>
    )
  }

  return (
    <div className={`${styles.frame} ${styles[size]} ${styles.initials}`} aria-hidden="true">
      <span>{initials}</span>
    </div>
  )
}
