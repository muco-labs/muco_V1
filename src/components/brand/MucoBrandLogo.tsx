import { brandAssets } from '@/config/brand-assets'
import { site } from '@/config/site'
import styles from './MucoBrandLogo.module.css'

type MucoBrandLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

export function MucoBrandLogo({ size = 'md', showWordmark = true, className }: MucoBrandLogoProps) {
  const src = brandAssets.logoMark.src ?? brandAssets.logo.src
  if (!src) return null

  return (
    <span className={[styles.root, styles[size], className].filter(Boolean).join(' ')}>
      <img
        src={src}
        alt=""
        className={styles.mark}
        width={512}
        height={512}
        decoding="async"
      />
      {showWordmark ? <span className={styles.wordmark}>{site.name}</span> : null}
    </span>
  )
}
