import { describe, expect, it } from 'vitest'
import { presentFollowUp, parseFollowUpAtInput } from './follow-up-presentation.js'

describe('presentFollowUp', () => {
  const now = new Date('2026-08-09T14:00:00')

  it('returns none when no date', () => {
    expect(presentFollowUp(null, 'pending', now).label).toBe('No follow-up scheduled')
  })

  it('labels today', () => {
    const at = new Date('2026-08-09T10:00:00')
    expect(presentFollowUp(at, 'pending', now).bucket).toBe('today')
    expect(presentFollowUp(at, 'pending', now).label).toBe('Follow up today')
  })

  it('labels overdue by days', () => {
    const at = new Date('2026-08-07T10:00:00')
    expect(presentFollowUp(at, 'pending', now).bucket).toBe('overdue')
    expect(presentFollowUp(at, 'pending', now).label).toBe('Overdue by 2 days')
  })

  it('labels upcoming with date', () => {
    const at = new Date('2026-08-15T10:00:00')
    expect(presentFollowUp(at, 'pending', now).bucket).toBe('upcoming')
    expect(presentFollowUp(at, 'pending', now).label).toContain('Aug')
  })
})

describe('parseFollowUpAtInput', () => {
  it('parses ISO datetime', () => {
    const d = parseFollowUpAtInput('2026-08-15T09:30:00.000Z')
    expect(d.getTime()).toBeGreaterThan(0)
  })

  it('rejects empty', () => {
    expect(() => parseFollowUpAtInput('')).toThrow()
  })
})
