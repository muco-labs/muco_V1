export type FaqItem = {
  id: string
  question: string
  answer: string
  category: 'general' | 'process' | 'pricing' | 'technology' | 'support'
}

export const faqs: FaqItem[] = [
  {
    id: 'timeline-website',
    category: 'process',
    question: 'How long does a business website take?',
    answer:
      'Typical business websites take about 5–18 business days depending on scope, content readiness and integrations. Custom web applications take longer; we confirm a schedule at kickoff.',
  },
  {
    id: 'stack',
    category: 'technology',
    question: 'Do you use React and modern TypeScript?',
    answer:
      'Yes. Most marketing and product surfaces use React with TypeScript for maintainability, performance and SEO-friendly rendering patterns.',
  },
  {
    id: 'ownership',
    category: 'pricing',
    question: 'Will I own the code and design assets?',
    answer:
      'Yes. After final payment per your agreement, source code and agreed design assets transfer to you without hidden license fees.',
  },
  {
    id: 'mobile-stack',
    category: 'technology',
    question: 'React Native or Flutter for mobile?',
    answer:
      'We recommend based on your timeline, team and feature needs. Both can reach production quality—we document the trade-offs before you commit.',
  },
  {
    id: 'crm-build',
    category: 'technology',
    question: 'Should we build a custom CRM or buy off-the-shelf?',
    answer:
      'Buy when a standard CRM fits. Build when your workflow, pricing model or integrations are unique and create competitive advantage.',
  },
  {
    id: 'ai-scope',
    category: 'technology',
    question: 'What do AI chatbot projects include?',
    answer:
      'Typically: knowledge ingestion (RAG), embeddable chat, guardrails, human handoff and analytics. Scope is defined in your proposal—no black-box promises.',
  },
  {
    id: 'pricing-how',
    category: 'pricing',
    question: 'How does MUCO LABS pricing work?',
    answer:
      'Public “starting from” packages are listed on our pricing page. Larger work is quoted after discovery with milestone billing and clear deliverables.',
  },
  {
    id: 'support',
    category: 'support',
    question: 'Do you offer maintenance after launch?',
    answer:
      'Yes. AMC and care plans cover updates, monitoring and small improvements—scoped monthly so you know what is included.',
  },
  {
    id: 'contact',
    category: 'general',
    question: 'How do I start a project?',
    answer:
      'Use the contact form, email contact@mucolabs.com or call +91 63818 09844. We respond with a practical next step—not a generic brochure.',
  },
  {
    id: 'location',
    category: 'general',
    question: 'Where is MUCO LABS based?',
    answer:
      'We are headquartered in Erode, Tamil Nadu, India and work with clients locally and internationally.',
  },
  {
    id: 'remote',
    category: 'general',
    question: 'Do you work with businesses outside Erode?',
    answer:
      'Yes. We serve clients across Tamil Nadu, India and remote engagements where async collaboration fits the project.',
  },
  {
    id: 'quote',
    category: 'process',
    question: 'How do I request a quote?',
    answer:
      'Share your goals via the contact form or email. We follow up with clarifying questions, then a written scope and quote—no pressure to oversell.',
  },
  {
    id: 'custom-software',
    category: 'technology',
    question: 'Can you build custom software or SaaS products?',
    answer:
      'Yes—when discovery shows a bespoke product is the right fit. We document architecture, milestones and ownership before development starts.',
  },
  {
    id: 'apis',
    category: 'technology',
    question: 'Can you integrate APIs and third-party tools?',
    answer:
      'Yes. Integrations (payments, CRM, email, analytics and internal APIs) are a core part of most software and automation engagements.',
  },
  {
    id: 'payment-flow',
    category: 'pricing',
    question: 'How does payment work?',
    answer:
      'Milestone billing is typical for larger projects; smaller packages may use agreed upfront schedules. Terms are confirmed in your proposal and invoice.',
  },
  {
    id: 'seo-offer',
    category: 'support',
    question: 'Do you provide SEO services?',
    answer:
      'Yes—technical SEO, content structure and measurement. We tie SEO to your site and product, not isolated keyword lists.',
  },
]

export const homeFaqIds = [
  'timeline-website',
  'pricing-how',
  'ownership',
  'support',
  'contact',
] as const
