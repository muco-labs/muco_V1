import { describe, expect, it, vi } from 'vitest'
import {
  completeAuthNavigation,
  isAbsoluteAuthNavigationUrl,
} from './complete-auth-navigation'

describe('completeAuthNavigation', () => {
  it('detects absolute portal URLs', () => {
    expect(isAbsoluteAuthNavigationUrl('https://app.mucolabs.com/')).toBe(true)
    expect(isAbsoluteAuthNavigationUrl('/app')).toBe(false)
  })

  it('uses window.location.assign for external portal origins', () => {
    const assign = vi.fn()
    vi.stubGlobal('window', { location: { assign } })
    const navigate = vi.fn()
    completeAuthNavigation(navigate, 'https://app.mucolabs.com/')
    expect(assign).toHaveBeenCalledWith('https://app.mucolabs.com/')
    expect(navigate).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('uses react-router navigate for in-app paths', () => {
    const navigate = vi.fn()
    completeAuthNavigation(navigate, '/app/projects')
    expect(navigate).toHaveBeenCalledWith('/app/projects', { replace: true })
  })
})
