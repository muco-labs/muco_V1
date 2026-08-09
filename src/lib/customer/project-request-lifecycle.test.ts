import { describe, expect, it } from 'vitest'
import {
  presentProjectRequestStatus,
  projectRequestNextAction,
  lifecycleStepState,
} from './project-request-lifecycle'

describe('presentProjectRequestStatus', () => {
  it('maps new lead status to submitted presentation', () => {
    const p = presentProjectRequestStatus('new')
    expect(p.label).toBe('Submitted')
    expect(p.tone).toBe('active')
  })

  it('maps won to project-started presentation', () => {
    expect(presentProjectRequestStatus('won').label).toBe('In progress')
  })
})

describe('projectRequestNextAction', () => {
  it('returns wait message for new requests', () => {
    expect(projectRequestNextAction('new')).toMatch(/Wait for MUCO/)
  })
})

describe('lifecycleStepState', () => {
  it('marks earlier steps complete', () => {
    expect(lifecycleStepState(0, 2, 'active')).toBe('complete')
    expect(lifecycleStepState(2, 2, 'active')).toBe('current')
  })
})
