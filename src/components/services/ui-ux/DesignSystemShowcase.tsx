import styles from './DesignSystemShowcase.module.css'

export function DesignSystemShowcase() {
  return (
    <div className={styles.panel}>
      <div className={styles.row}>
        <div className={styles.typeBlock}>
          <p className={styles.eyebrow}>Typography</p>
          <p className={styles.displaySample}>Display</p>
          <p className={styles.bodySample}>Body text for product interfaces—legible at scale.</p>
          <p className={styles.metaSample}>Metadata · 12px</p>
        </div>
        <div className={styles.spacingBlock}>
          <p className={styles.eyebrow}>Spacing</p>
          <div className={styles.spacingBars}>
            <span style={{ width: '0.5rem' }} />
            <span style={{ width: '1rem' }} />
            <span style={{ width: '1.5rem' }} />
            <span style={{ width: '2rem' }} />
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.controls}>
          <p className={styles.eyebrow}>Controls</p>
          <div className={styles.buttonRow}>
            <button type="button" className={styles.btnPrimary}>
              Primary
            </button>
            <button type="button" className={styles.btnSecondary}>
              Secondary
            </button>
            <button type="button" className={styles.btnGhost}>
              Ghost
            </button>
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <input type="text" className={styles.input} readOnly value="you@company.com" tabIndex={-1} />
          </label>
        </div>
        <div className={styles.components}>
          <p className={styles.eyebrow}>Components</p>
          <nav className={styles.miniNav} aria-label="Example navigation">
            <span className={styles.navItemActive}>Overview</span>
            <span className={styles.navItem}>Projects</span>
            <span className={styles.navItem}>Team</span>
          </nav>
          <div className={styles.cardRow}>
            <article className={styles.sampleCard}>
              <span className={styles.badge}>New</span>
              <p className={styles.cardTitle}>Status card</p>
              <p className={styles.cardBody}>Reusable surface with clear hierarchy.</p>
            </article>
            <article className={styles.sampleCard}>
              <p className={styles.cardTitle}>Metric</p>
              <p className={styles.cardMetric}>94%</p>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
