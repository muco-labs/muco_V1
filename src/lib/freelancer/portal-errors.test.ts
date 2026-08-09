import { describe, expect, it } from 'vitest'
import { approvalStatusLabel, availabilityStatusTone } from '@/lib/freelancer/portal-errors'

describe('freelancer portal copy helpers', () => {
  it('maps availability tones', () => {
    expect(availabilityStatusTone('unavailable')).toBe('muted')
    expect(availabilityStatusTone('available')).toBe('success')
  })

  it('describes approval states', () => {
    expect(approvalStatusLabel('pending')).toMatch(/review/i)
  })
})
