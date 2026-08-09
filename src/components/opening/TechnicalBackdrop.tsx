import styles from './TechnicalBackdrop.module.css'

type TechnicalBackdropProps = {
  className?: string
  /** Softer motion for hero sections vs full-screen intro */
  intensity?: 'intro' | 'ambient'
}

export function TechnicalBackdrop({ className, intensity = 'ambient' }: TechnicalBackdropProps) {
  return (
    <div
      className={`${styles.root} ${styles[intensity]} ${className ?? ''}`}
      aria-hidden="true"
    >
      <svg className={styles.grid} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="muco-grid-fade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(30,136,255,0.35)" />
            <stop offset="50%" stopColor="rgba(0,194,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,179,0,0.12)" />
          </linearGradient>
        </defs>
        <g className={styles.lines} stroke="url(#muco-grid-fade)" strokeWidth="0.5" fill="none">
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} />
          ))}
        </g>
        <g className={styles.nodes} fill="var(--color-brand-cyan)">
          <circle cx="120" cy="140" r="2" opacity="0.9" />
          <circle cx="420" cy="220" r="2.5" opacity="0.7" />
          <circle cx="640" cy="160" r="2" opacity="0.85" />
          <circle cx="280" cy="380" r="2" opacity="0.6" />
          <circle cx="520" cy="420" r="3" opacity="0.75" />
        </g>
        <path
          className={styles.path}
          d="M 80 320 Q 200 280 320 300 T 560 260 T 720 300"
          stroke="rgba(0,194,255,0.45)"
          strokeWidth="1"
          fill="none"
        />
        <path
          className={styles.pathAlt}
          d="M 60 180 L 240 200 L 400 160 L 580 190 L 740 150"
          stroke="rgba(30,136,255,0.35)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
      <div className={styles.glow} />
    </div>
  )
}
