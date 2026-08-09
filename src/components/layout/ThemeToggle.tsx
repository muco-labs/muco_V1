import { HiMoon, HiSun } from 'react-icons/hi2'
import styles from './ThemeToggle.module.css'

type ThemeToggleProps = {
  theme: 'dark' | 'light'
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
    >
      {isDark ? <HiSun aria-hidden /> : <HiMoon aria-hidden />}
    </button>
  )
}
