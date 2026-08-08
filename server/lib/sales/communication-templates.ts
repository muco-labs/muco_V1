/** Editable sales communication templates (transactional only — no marketing blasts). */
export const salesCommunicationTemplates = {
  inquiry_ack: {
    subject: 'We received your enquiry',
    body: 'Thank you for reaching out. We will review your message and reply with a clear next step in writing.',
  },
  qualification_follow_up: {
    subject: 'A few details to scope your project',
    body: 'To prepare an accurate proposal, please share your timeline, budget range, and decision process.',
  },
  requirements_request: {
    subject: 'Project requirements',
    body: 'Please share any references, must-have features, and constraints so we can define scope together.',
  },
  proposal_notification: {
    subject: 'Your proposal is ready',
    body: 'Your proposal is available in the customer portal. Review scope, timeline, and payment schedule at your pace.',
  },
  proposal_reminder: {
    subject: 'Proposal follow-up',
    body: 'Checking whether you had questions about the proposal. Reply in the portal or by email — no pressure.',
  },
  payment_request: {
    subject: 'Invoice ready',
    body: 'An invoice has been issued. You can pay securely from your customer portal when you are ready.',
  },
  project_onboarding: {
    subject: 'Project kickoff',
    body: 'Your project is active. We will coordinate milestones and written updates through the portal.',
  },
  renewal_reminder: {
    subject: 'Renewal reminder',
    body: 'Your recurring service renewal date is approaching. We will confirm scope and terms before any renewal.',
  },
} as const

export type SalesTemplateId = keyof typeof salesCommunicationTemplates
