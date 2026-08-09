import { describe, expect, it } from 'vitest'
import { canCreateProjectFromLead, presentCustomerProjectStatus } from './project-fulfillment.js'

describe('canCreateProjectFromLead', () => {
  it('allows eligible leads with a customer', () => {
    expect(canCreateProjectFromLead({ status: 'qualified', customerId: 'cust' }).ok).toBe(true)
  })

  it('blocks lost and archived leads', () => {
    expect(canCreateProjectFromLead({ status: 'lost', customerId: 'cust' }).ok).toBe(false)
    expect(canCreateProjectFromLead({ status: 'archived', customerId: 'cust' }).ok).toBe(false)
  })

  it('requires customerId', () => {
    expect(canCreateProjectFromLead({ status: 'new', customerId: null }).ok).toBe(false)
  })
})

describe('presentCustomerProjectStatus', () => {
  it('maps draft to planning language', () => {
    expect(presentCustomerProjectStatus('draft').label).toBe('Planning')
  })
})
