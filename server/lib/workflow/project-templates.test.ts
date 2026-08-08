import { describe, expect, it } from 'vitest'
import {
  getProjectTemplate,
  isProjectTemplateId,
  PROJECT_TEMPLATES,
} from './project-templates.js'

describe('project templates', () => {
  it('recognizes valid template ids', () => {
    expect(isProjectTemplateId('website')).toBe(true)
    expect(isProjectTemplateId('software')).toBe(true)
    expect(isProjectTemplateId('invalid')).toBe(false)
  })

  it('website template includes discovery and handover milestones', () => {
    const t = getProjectTemplate('website')
    expect(t.milestones[0]?.name).toBe('Discovery')
    expect(t.milestones.at(-1)?.name).toBe('Handover')
    expect(t.milestones.length).toBeGreaterThanOrEqual(8)
  })

  it('software template has fewer milestones than website', () => {
    expect(PROJECT_TEMPLATES.software.milestones.length).toBeLessThan(
      PROJECT_TEMPLATES.website.milestones.length,
    )
  })
})
