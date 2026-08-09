import { describe, expect, it } from 'vitest'
import { leadEntryChannel } from './lead-channel.js'
import { PROJECT_INTAKE_PAGE_SOURCE } from './project-intake-constants.js'

describe('leadEntryChannel', () => {
  it('identifies start project leads', () => {
    expect(leadEntryChannel(PROJECT_INTAKE_PAGE_SOURCE)).toBe('start_project')
  })

  it('identifies contact form leads', () => {
    expect(leadEntryChannel('contact')).toBe('contact')
    expect(leadEntryChannel('website_contact')).toBe('contact')
  })

  it('marks other page sources as other', () => {
    expect(leadEntryChannel('service_detail')).toBe('other')
    expect(leadEntryChannel(null)).toBe('other')
  })
})
