/** UI/UX service detail — centralized copy for the polished service page. */

export const uiUxHero = {
  eyebrow: 'Design',
  headline: 'UI/UX design',
  lead:
    'MUCO LABS designs interfaces that are beautiful, usable, and ready for real products.',
  supporting:
    'Research, structure, and high-fidelity UI that engineering teams can implement without guesswork.',
} as const

export const uiUxAudience = {
  label: 'Who it’s for',
  statement: 'Founders and product teams shaping what to build—or refining what already exists.',
  body: 'You need clarity before engineering spend accelerates, or you need design leadership that respects delivery constraints.',
} as const

export const uiUxProblem = {
  label: 'The problem',
  statement: 'Interfaces that look fine in mockups but fail in real workflows.',
  body: 'Inconsistent patterns, missing states, and handoffs that leave developers improvising erode trust and slow launches.',
} as const

export const uiUxBuildItems = [
  'Research & flows',
  'Information architecture',
  'Design systems',
  'High-fidelity UI',
  'Responsive design',
  'Prototyping',
  'Developer handoff',
] as const

export const uiUxOutcomeItems = [
  'Clear product language',
  'Consistent UI',
  'Reduced implementation ambiguity',
  'Accessible patterns',
  'Responsive layouts',
  'Reusable components',
  'Production-ready handoff',
] as const

export const uiUxProcessSteps = [
  { num: '01', title: 'Discover', detail: 'Align on users, constraints and success signals before pixels.' },
  { num: '02', title: 'Structure', detail: 'Map journeys, IA and content hierarchy that scale.' },
  { num: '03', title: 'Design', detail: 'Craft UI with systems thinking—not one-off screens.' },
  { num: '04', title: 'Prototype', detail: 'Test flows interactively to surface friction early.' },
  { num: '05', title: 'Validate', detail: 'Review with stakeholders and engineering for feasibility.' },
  { num: '06', title: 'Handoff', detail: 'Specs, components and states developers can ship from.' },
] as const

export const uiUxWhy = {
  quote:
    'Good interface design turns product complexity into something people can understand.',
  principles: [
    {
      title: 'Clarity',
      body: 'Every screen answers what to do next—without noise or cleverness for its own sake.',
    },
    {
      title: 'Consistency',
      body: 'Shared components and patterns so the product feels coherent as it grows.',
    },
    {
      title: 'Confidence',
      body: 'Documented states and handoff that let engineering move fast without rework.',
    },
  ],
} as const

export const uiUxShowcaseProjects = [
  { visual: 'saas' as const, title: 'SaaS control plane', category: 'B2B platform' },
  { visual: 'mobile' as const, title: 'Mobile companion app', category: 'Field operations' },
  { visual: 'ai-dashboard' as const, title: 'AI-assisted dashboard', category: 'Operations UI' },
  { visual: 'commerce' as const, title: 'Commerce experience', category: 'E-commerce' },
] as const
