import type { PortfolioProject } from '@/data/portfolio'
import styles from './ProjectPreview.module.css'

type ProjectPreviewProps = {
  visual: PortfolioProject['visual']
  title: string
}

export function ProjectPreview({ visual, title }: ProjectPreviewProps) {
  return (
    <div className={styles.frame} role="img" aria-label={`${title} concept preview`}>
      {visual === 'commerce' && <CommerceArt />}
      {visual === 'ai-dashboard' && <DashboardArt />}
      {visual === 'saas' && <SaasArt />}
      {visual === 'premium-site' && <SiteArt />}
    </div>
  )
}

function CommerceArt() {
  return (
    <svg viewBox="0 0 400 260" className={styles.svg} aria-hidden="true">
      <rect width="400" height="260" fill="#121214" />
      <rect x="24" y="24" width="120" height="16" rx="4" fill="#2a2a30" />
      <rect x="24" y="56" width="200" height="28" rx="6" fill="#d4ff5c" opacity="0.85" />
      <rect x="24" y="100" width="352" height="120" rx="12" fill="#1a1a1f" stroke="#2f2f36" />
      <rect x="40" y="120" width="96" height="80" rx="8" fill="#25252c" />
      <rect x="152" y="120" width="96" height="80" rx="8" fill="#25252c" />
      <rect x="264" y="120" width="96" height="80" rx="8" fill="#25252c" />
    </svg>
  )
}

function DashboardArt() {
  return (
    <svg viewBox="0 0 400 260" className={styles.svg} aria-hidden="true">
      <rect width="400" height="260" fill="#101012" />
      <rect x="20" y="20" width="80" height="220" rx="10" fill="#18181d" />
      <rect x="116" y="20" width="264" height="100" rx="10" fill="#1d1d24" />
      <rect x="116" y="136" width="124" height="104" rx="10" fill="#1d1d24" />
      <rect x="256" y="136" width="124" height="104" rx="10" fill="#1d1d24" />
      <circle cx="60" cy="60" r="16" fill="#d4ff5c" opacity="0.7" />
      <polyline
        points="140,90 180,70 220,82 260,50 300,64 340,40"
        fill="none"
        stroke="#d4ff5c"
        strokeWidth="3"
      />
    </svg>
  )
}

function SaasArt() {
  return (
    <svg viewBox="0 0 400 260" className={styles.svg} aria-hidden="true">
      <rect width="400" height="260" fill="#0f0f12" />
      <rect x="28" y="36" width="344" height="188" rx="14" fill="#17171c" stroke="#2c2c34" />
      <rect x="48" y="60" width="120" height="12" rx="3" fill="#d4ff5c" opacity="0.8" />
      <rect x="48" y="88" width="304" height="8" rx="2" fill="#2a2a32" />
      <rect x="48" y="108" width="240" height="8" rx="2" fill="#2a2a32" />
      <rect x="48" y="140" width="140" height="56" rx="8" fill="#22222a" />
      <rect x="204" y="140" width="148" height="56" rx="8" fill="#22222a" />
    </svg>
  )
}

function SiteArt() {
  return (
    <svg viewBox="0 0 400 260" className={styles.svg} aria-hidden="true">
      <rect width="400" height="260" fill="#0c0c0f" />
      <rect x="32" y="40" width="160" height="24" rx="4" fill="#f6f5f1" opacity="0.9" />
      <rect x="32" y="80" width="220" height="10" rx="2" fill="#6f6f7a" />
      <rect x="32" y="100" width="180" height="10" rx="2" fill="#6f6f7a" />
      <rect x="240" y="48" width="128" height="160" rx="12" fill="#d4ff5c" opacity="0.12" />
      <rect x="32" y="140" width="96" height="32" rx="16" fill="#d4ff5c" />
      <line x1="32" y1="220" x2="368" y2="220" stroke="#2a2a32" />
    </svg>
  )
}
