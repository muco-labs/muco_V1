/** Central workflow action names for audit / automation visibility. */
export const WORKFLOW_AUDIT_ACTIONS = {
  projectFromProposal: 'project.created_from_proposal',
  projectCompleted: 'project.completed',
  projectTemplateApplied: 'automation.project_template_applied',
  proposalCreated: 'proposal.created',
  proposalSent: 'proposal.sent',
  paymentSucceeded: 'payment.succeeded',
  paymentFailed: 'payment.failed',
  leadCreated: 'lead.created',
  leadReInquiry: 'lead.re_inquiry',
} as const

export const AUTOMATION_AUDIT_PREFIXES = ['automation.', 'payment.', 'project.created_from_proposal'] as const
