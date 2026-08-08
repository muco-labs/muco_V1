import styles from './UiUxHeroVisual.module.css'

export function UiUxHeroVisual() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.desktop}>
        <div className={styles.chrome}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.chromeLabel}>Product shell</span>
        </div>
        <div className={styles.desktopBody}>
          <aside className={styles.sidebar}>
            <span className={styles.navActive} />
            <span className={styles.navLine} />
            <span className={styles.navLine} />
            <span className={styles.navLine} />
          </aside>
          <div className={styles.main}>
            <div className={styles.toolbar}>
              <span className={styles.pill}>Dashboard</span>
              <span className={styles.pillMuted}>Settings</span>
            </div>
            <div className={styles.cards}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Active users</span>
                <span className={styles.metricValue}>2.4k</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Tasks</span>
                <span className={styles.metricValue}>128</span>
              </div>
            </div>
            <div className={styles.chart}>
              <svg viewBox="0 0 200 48" className={styles.chartSvg}>
                <polyline
                  points="0,40 30,32 60,36 90,20 120,24 150,12 180,16 200,8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.phone}>
        <div className={styles.phoneNotch} />
        <div className={styles.phoneScreen}>
          <span className={styles.phoneTitle}>Today</span>
          <div className={styles.phoneCard} />
          <div className={styles.phoneCard} />
          <span className={styles.phoneCta}>Primary action</span>
        </div>
      </div>

      <div className={styles.tokens}>
        <span className={styles.token}>Aa</span>
        <span className={styles.tokenSwatch} />
        <span className={styles.tokenBtn}>Button</span>
      </div>
    </div>
  )
}
