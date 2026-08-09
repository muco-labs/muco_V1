import { describe, expect, it } from 'vitest'
import {
  buildProjectStorageKey,
  isCustomerVisibleFile,
  isDeliverableFile,
  sanitizeProjectFileName,
  serializeCustomerProjectFile,
  SIGNED_DOWNLOAD_TTL_SECONDS,
  validateProjectFileUpload,
} from './project-file.js'
import { defaultRolePermissions } from '../auth/role-permissions.js'
import { hasPermission } from '../auth/permissions.js'

describe('validateProjectFileUpload', () => {
  it('rejects empty names', () => {
    expect(validateProjectFileUpload({ fileName: '   ', mimeType: 'application/pdf', fileSizeBytes: 100 }).ok).toBe(
      false,
    )
  })

  it('accepts pdf uploads', () => {
    const result = validateProjectFileUpload({
      fileName: 'scope.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024,
    })
    expect(result.ok).toBe(true)
  })

  it('rejects disallowed extensions', () => {
    expect(
      validateProjectFileUpload({
        fileName: 'virus.exe',
        mimeType: 'application/octet-stream',
        fileSizeBytes: 100,
      }).ok,
    ).toBe(false)
  })
})

describe('sanitizeProjectFileName', () => {
  it('strips path traversal', () => {
    expect(sanitizeProjectFileName('../secret.pdf')).not.toContain('..')
  })
})

describe('buildProjectStorageKey', () => {
  it('namespaces under project id', () => {
    const key = buildProjectStorageKey('11111111-1111-1111-1111-111111111111', 'doc.pdf')
    expect(key.startsWith('projects/11111111-1111-1111-1111-111111111111/')).toBe(true)
    expect(key).toContain('doc.pdf')
  })
})

describe('visibility and deliverables', () => {
  it('hides internal files from customer visibility', () => {
    expect(isCustomerVisibleFile({ visibility: 'internal', status: 'active' })).toBe(false)
  })

  it('shows customer_visible active files', () => {
    expect(isCustomerVisibleFile({ visibility: 'customer_visible', status: 'active' })).toBe(true)
  })

  it('requires deliverable category and customer visibility', () => {
    expect(
      isDeliverableFile({ category: 'deliverable', visibility: 'customer_visible', status: 'active' }),
    ).toBe(true)
    expect(
      isDeliverableFile({ category: 'deliverable', visibility: 'internal', status: 'active' }),
    ).toBe(false)
  })
})

describe('customer DTO security', () => {
  it('omits storage metadata', () => {
    const dto = serializeCustomerProjectFile({
      id: 'f1',
      fileName: 'a.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 10,
      category: 'deliverable',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    expect(dto).not.toHaveProperty('storageKey')
    expect(dto.isDeliverable).toBe(true)
  })
})

describe('signed URL policy', () => {
  it('uses short-lived downloads', () => {
    expect(SIGNED_DOWNLOAD_TTL_SECONDS).toBeLessThanOrEqual(300)
  })
})

describe('files RBAC', () => {
  it('grants customers upload and view only', () => {
    const customer = new Set(defaultRolePermissions.CUSTOMER)
    expect(hasPermission(customer, 'files.view')).toBe(true)
    expect(hasPermission(customer, 'files.upload')).toBe(true)
    expect(hasPermission(customer, 'files.delete')).toBe(false)
  })
})
