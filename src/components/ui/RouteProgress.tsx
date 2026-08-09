import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Thin top-of-viewport progress bar that animates on route changes to give
 * navigation a sense of momentum. Purely decorative; hidden for reduced motion
 * via the `.route-progress` stylesheet rule.
 */
export function RouteProgress() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const firstRender = useRef(true)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []

    setVisible(true)
    setProgress(12)

    timers.current.push(window.setTimeout(() => setProgress(72), 60))
    timers.current.push(window.setTimeout(() => setProgress(100), 320))
    timers.current.push(
      window.setTimeout(() => {
        setVisible(false)
      }, 620),
    )
    timers.current.push(
      window.setTimeout(() => {
        setProgress(0)
      }, 760),
    )

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
    }
  }, [location.pathname])

  return (
    <div
      className="route-progress"
      aria-hidden="true"
      style={{
        transform: `scaleX(${progress / 100})`,
        opacity: visible ? 1 : 0,
        transition:
          'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out',
      }}
    />
  )
}
