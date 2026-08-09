import type { NavigateFunction } from 'react-router-dom'

/** React Router cannot navigate to external portal origins — use full page load. */
export function isAbsoluteAuthNavigationUrl(destination: string): boolean {
  return /^https?:\/\//i.test(destination.trim())
}

export function completeAuthNavigation(
  navigate: NavigateFunction,
  destination: string,
): void {
  const target = destination.trim()
  if (isAbsoluteAuthNavigationUrl(target)) {
    window.location.assign(target)
    return
  }
  navigate(target, { replace: true })
}
