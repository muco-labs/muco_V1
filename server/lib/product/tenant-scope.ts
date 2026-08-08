export type ProductOrgMemberRole = 'owner' | 'admin' | 'member'

const roleRank: Record<ProductOrgMemberRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
}

/** Returns false when tenant boundaries do not match (IDOR guard at app layer). */
export function assertOrganizationScope(
  resourceOrganizationId: string,
  contextOrganizationId: string,
): boolean {
  if (!resourceOrganizationId || !contextOrganizationId) return false
  return resourceOrganizationId === contextOrganizationId
}

export function roleMeetsMinimum(
  actual: ProductOrgMemberRole,
  required: ProductOrgMemberRole,
): boolean {
  return roleRank[actual] >= roleRank[required]
}
