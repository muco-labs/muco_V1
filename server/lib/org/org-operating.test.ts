import { describe, expect, it } from 'vitest'
import { isMucoDepartmentSlug, normalizeDepartmentSlug } from './departments.js'
import { inferGrowthStage } from './growth-stages.js'
import { jobPermissionProfiles } from './job-permission-profiles.js'
import { permissionNames } from '../auth/permissions.js'

describe('muco departments', () => {
  it('accepts canonical slugs', () => {
    expect(isMucoDepartmentSlug('engineering')).toBe(true)
    expect(normalizeDepartmentSlug('engineering')).toBe('engineering')
  })

  it('rejects unknown slugs', () => {
    expect(isMucoDepartmentSlug('fake-dept')).toBe(false)
  })
})

describe('growth stages', () => {
  it('infers founder-led for solo team', () => {
    expect(inferGrowthStage(1)).toBe('stage_1_founder_led')
    expect(inferGrowthStage(5)).toBe('stage_2_core_team')
  })
})

describe('job permission profiles', () => {
  it('only references valid permissions', () => {
    const valid = new Set<string>(permissionNames)
    for (const perms of Object.values(jobPermissionProfiles)) {
      for (const p of perms) {
        expect(valid.has(p)).toBe(true)
      }
    }
  })
})
