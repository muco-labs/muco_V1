export type DeliveryStage = {
  step: string
  detail: string
}

/** Shared client journey — used on home, about, and service pages. */
export const deliveryProcess: DeliveryStage[] = [
  {
    step: 'Discover',
    detail: 'Goals, constraints, stakeholders and success metrics—documented in plain language.',
  },
  {
    step: 'Plan',
    detail: 'Scope, architecture, timeline and proposal you can approve before build begins.',
  },
  {
    step: 'Design',
    detail: 'UX, UI and content structure aligned with conversion and maintainability.',
  },
  {
    step: 'Build',
    detail: 'TypeScript-first engineering, reviews, tests and secure defaults.',
  },
  {
    step: 'Test',
    detail: 'QA across devices, critical flows and performance budgets.',
  },
  {
    step: 'Launch',
    detail: 'Deploy, monitor, hand off documentation and train your team where needed.',
  },
  {
    step: 'Support & grow',
    detail: 'Maintenance, SEO, automation and iteration tied to measurable outcomes.',
  },
]
