import type { PortfolioProject } from '@/data/portfolio'
import styles from './ProjectPreview.module.css'

type ProjectPreviewProps = {
  visual: PortfolioProject['visual']
  title: string
  category?: string
}

export function ProjectPreview({ visual, title, category }: ProjectPreviewProps) {
  return (
    <div
      className={styles.frame}
      role="img"
      aria-label={`${title} — MUCO LABS concept visual${category ? `, ${category}` : ''}`}
    >
      <div className={styles.chrome}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.chromeTitle}>Concept preview</span>
      </div>
      <div className={styles.art}>
        {visual === 'commerce' && <CommerceArt />}
        {visual === 'ai-dashboard' && <DashboardArt />}
        {visual === 'saas' && <SaasArt />}
        {visual === 'premium-site' && <SiteArt />}
        {visual === 'mobile' && <MobileArt />}
        {visual === 'automation' && <AutomationArt />}
      </div>
      <p className={styles.caption}>MUCO LABS concept work — not a client case study</p>
    </div>
  )
}

function CommerceArt() {
  return (
    <svg viewBox="0 0 400 240" className={styles.svg} aria-hidden="true">
      <rect width="400" height="240" fill="#121214" />
      <text x="24" y="36" fill="#a8a8b3" fontSize="11" fontFamily="system-ui">
        Storefront
      </text>
      <rect x="24" y="48" width="160" height="20" rx="4" fill="#00c2ff" opacity="0.9" />
      <rect x="24" y="88" width="352" height="120" rx="12" fill="#1a1a1f" stroke="#2f2f36" />
      <rect x="40" y="104" width="96" height="88" rx="8" fill="#25252c" />
      <rect x="152" y="104" width="96" height="88" rx="8" fill="#25252c" />
      <rect x="264" y="104" width="96" height="88" rx="8" fill="#25252c" />
      <rect x="40" y="200" width="80" height="8" rx="2" fill="#00c2ff" opacity="0.5" />
    </svg>
  )
}

function DashboardArt() {
  return (
    <svg viewBox="0 0 400 240" className={styles.svg} aria-hidden="true">
      <rect width="400" height="240" fill="#101012" />
      <rect x="16" y="16" width="72" height="208" rx="8" fill="#18181d" />
      <text x="28" y="40" fill="#6f6f7a" fontSize="9" fontFamily="system-ui">
        Nav
      </text>
      <rect x="28" y="52" width="48" height="6" rx="2" fill="#00c2ff" opacity="0.7" />
      <rect x="28" y="68" width="40" height="4" rx="1" fill="#333" />
      <rect x="104" y="16" width="280" height="96" rx="8" fill="#1d1d24" />
      <text x="120" y="40" fill="#a8a8b3" fontSize="10" fontFamily="system-ui">
        Operations KPIs
      </text>
      <polyline
        points="120,88 160,72 200,80 240,56 280,64 320,48 360,60"
        fill="none"
        stroke="#00c2ff"
        strokeWidth="2.5"
      />
      <rect x="104" y="128" width="132" height="96" rx="8" fill="#1d1d24" />
      <rect x="252" y="128" width="132" height="96" rx="8" fill="#1d1d24" />
      <text x="120" y="152" fill="#6f6f7a" fontSize="9" fontFamily="system-ui">
        Approvals
      </text>
      <rect x="120" y="164" width="96" height="8" rx="2" fill="#00c2ff" opacity="0.4" />
    </svg>
  )
}

function SaasArt() {
  return (
    <svg viewBox="0 0 400 240" className={styles.svg} aria-hidden="true">
      <rect width="400" height="240" fill="#0f0f12" />
      <rect x="24" y="28" width="352" height="184" rx="12" fill="#17171c" stroke="#2c2c34" />
      <text x="48" y="56" fill="#00c2ff" fontSize="11" fontFamily="system-ui">
        Tenant admin
      </text>
      <rect x="48" y="68" width="200" height="6" rx="2" fill="#2a2a32" />
      <rect x="48" y="88" width="140" height="48" rx="6" fill="#22222a" />
      <rect x="204" y="88" width="148" height="48" rx="6" fill="#22222a" />
      <rect x="48" y="152" width="304" height="40" rx="6" fill="#1a1a22" />
    </svg>
  )
}

function SiteArt() {
  return (
    <svg viewBox="0 0 400 240" className={styles.svg} aria-hidden="true">
      <rect width="400" height="240" fill="#0c0c0f" />
      <text x="32" y="40" fill="#f6f5f1" fontSize="14" fontFamily="system-ui" opacity="0.9">
        Brand story
      </text>
      <rect x="32" y="56" width="200" height="8" rx="2" fill="#6f6f7a" />
      <rect x="32" y="72" width="160" height="8" rx="2" fill="#6f6f7a" />
      <rect x="240" y="32" width="128" height="140" rx="10" fill="#00c2ff" opacity="0.15" />
      <rect x="32" y="120" width="88" height="28" rx="14" fill="#00c2ff" />
    </svg>
  )
}

function MobileArt() {
  return (
    <svg viewBox="0 0 400 240" className={styles.svg} aria-hidden="true">
      <rect width="400" height="240" fill="#0e0e11" />
      <rect x="148" y="16" width="104" height="208" rx="16" fill="#1a1a20" stroke="#333" />
      <rect x="160" y="40" width="80" height="12" rx="4" fill="#00c2ff" opacity="0.85" />
      <rect x="160" y="64" width="80" height="40" rx="6" fill="#252530" />
      <rect x="160" y="116" width="80" height="40" rx="6" fill="#252530" />
      <rect x="160" y="168" width="80" height="32" rx="8" fill="#00c2ff" opacity="0.35" />
    </svg>
  )
}

function AutomationArt() {
  return (
    <svg viewBox="0 0 400 240" className={styles.svg} aria-hidden="true">
      <rect width="400" height="240" fill="#0b0b0e" />
      <rect x="40" y="100" width="80" height="48" rx="8" fill="#1e1e26" stroke="#00c2ff" opacity="0.5" />
      <text x="52" y="128" fill="#a8a8b3" fontSize="9" fontFamily="system-ui">
        CRM
      </text>
      <rect x="160" y="88" width="80" height="72" rx="8" fill="#00c2ff" opacity="0.2" />
      <text x="172" y="128" fill="#00c2ff" fontSize="9" fontFamily="system-ui">
        Flow
      </text>
      <rect x="280" y="100" width="80" height="48" rx="8" fill="#1e1e26" stroke="#00c2ff" opacity="0.5" />
      <text x="288" y="128" fill="#a8a8b3" fontSize="9" fontFamily="system-ui">
        Billing
      </text>
      <path d="M120 124 H160 M240 124 H280" stroke="#00c2ff" strokeWidth="2" markerEnd="url(#arr)" />
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#00c2ff" />
        </marker>
      </defs>
    </svg>
  )
}
