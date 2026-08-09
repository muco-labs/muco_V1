export const CRM_INTERACTION_TYPES = [
  'call',
  'email',
  'meeting',
  'message',
  'whatsapp',
  'note',
  'other',
] as const

export type CrmInteractionType = (typeof CRM_INTERACTION_TYPES)[number]

export function formatLeadActivityLabel(action: string, metadata?: string | null): string {
  switch (action) {
    case 'lead.created':
      return 'Lead created'
    case 'lead.status_changed': {
      try {
        const m = JSON.parse(metadata ?? '{}') as { from?: string; to?: string }
        if (m.from && m.to) return `Status changed: ${m.from} → ${m.to}`
      } catch {
        /* ignore */
      }
      return 'Status changed'
    }
    case 'lead.assigned':
      return 'Owner assigned'
    case 'lead.note_added':
      return 'Internal note added'
    case 'lead.follow_up_scheduled':
      return 'Follow-up scheduled'
    case 'lead.interaction_logged':
      return 'Interaction recorded'
    case 'lead.priority_changed':
      return 'Priority updated'
    case 'lead.converted':
      return 'Lead converted'
    case 'sales.opportunity_qualified':
      return 'Opportunity qualified'
    default:
      return action.replace(/\./g, ' · ')
  }
}
