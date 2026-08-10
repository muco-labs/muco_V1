import { useEffect, useRef, useState } from 'react'

/** Mount WebGL only when the container is near the viewport. */
export function useSceneVisibility(rootMargin = '120px') {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry?.isIntersecting ?? false)
      },
      { rootMargin, threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, visible }
}

/** Skip heavy WebGL on narrow viewports. */
export function usePreferLightScene() {
  const [light, setLight] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    const update = () => setLight(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return light
}
