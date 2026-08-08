/** Public product positioning — no fabricated traction or customer counts. */
export const clientHubProductSlug = 'client-hub' as const

export const clientHubSeo = {
  path: '/products/client-hub',
  documentTitle: 'MUCO Client Hub (waitlist) | Client workspace for agencies',
  description:
    'Join the waitlist for MUCO Client Hub—a focused client portal for agencies and service businesses to share projects, files, invoices and messages. In development; no fake testimonials.',
}

export const productsHubSeo = {
  path: '/products',
  documentTitle: 'MUCO Products | SaaS in validation',
  description:
    'Software products from MUCO LABS currently in research and validation. Join a waitlist to help shape the roadmap—no inflated claims.',
}

export const clientHubConcept = {
  name: 'MUCO Client Hub',
  statusLabel: 'Waitlist · in validation',
  h1: 'A client workspace your customers will actually use',
  lead:
    'Agencies and professional services teams still email PDFs, chase approvals in chat, and lose context between projects. Client Hub is our focused answer: one branded place for deliverables, invoices, and updates—built on patterns we already run for MUCO delivery.',
  problem:
    'Client communication is fragmented across email, WhatsApp, and shared drives. Invoices and project status live in different tools. Clients ask “where is my file?” and teams re-send links.',
  solution:
    'A lightweight client portal: projects, files, proposals, invoices, and support tickets—with clear permissions and audit-friendly history.',
  forWho: [
    'Digital agencies and studios with recurring client work',
    'Consultancies that deliver milestones and need client sign-off',
    'Boutique software shops that outgrew email but do not need enterprise PSA bloat',
  ],
  notFor: [
    'Teams that only need a CRM (use a CRM-first tool)',
    'Enterprises requiring deep ERP integrations on day one',
  ],
  howItWorks: [
    'Create your organization and invite teammates',
    'Add a client and a project with shared files and status',
    'Client signs in to view only their work—no cross-client leakage',
    'Optional billing views when you are ready to connect payments',
  ],
  pricingConcept:
    'Validation pricing target: affordable per-organization tiers (Starter / Pro) once MVP ships. Waitlist members will receive early-access terms—nothing is charged today.',
  faqs: [
    {
      question: 'Is this available today?',
      answer:
        'No. Client Hub is in validation. You can join the waitlist to express interest and share your use case. We will not claim launch dates we have not committed to.',
    },
    {
      question: 'How is this different from MUCO services?',
      answer:
        'MUCO LABS still delivers custom projects as a services company. Client Hub is a separate product direction we are testing—productized client portal software.',
    },
    {
      question: 'Will my waitlist data be sold?',
      answer:
        'No. We use your details only to contact you about this product and related early-access research, per our privacy policy and the consent you provide on the form.',
    },
  ],
} as const
