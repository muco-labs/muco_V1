import { describe, expect, it } from 'vitest'
import { formatLeadActivityLabel } from './activity-labels'

describe('formatLeadActivityLabel', () => {
  it('humanizes status changes', () => {
    const label = formatLeadActivityLabel(
      'lead.status_changed',
      JSON.stringify({ from: 'new', to: 'contacted' }),
    )
    expect(label).toContain('new')
    expect(label).toContain('contacted')
  })
})
