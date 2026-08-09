/** Customer-facing reference from internal lead id (UUID). */
export function formatProjectRequestReference(id: string): string {
  const normalized = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return normalized.length >= 8 ? `REQ-${normalized}` : `REQ-${id.slice(0, 12)}`
}

export {
  presentProjectRequestStatus,
  projectRequestNextAction,
  projectRequestStatusLabel,
} from '@/lib/customer/project-request-lifecycle'
