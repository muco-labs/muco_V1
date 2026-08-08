export type PortfolioProject = {
  id: string
  title: string
  category: string
  label: 'CONCEPT PROJECT' | 'MUCO LABS DEMO'
  problem: string
  solution: string
  capabilities: string[]
  technology: string[]
  visual: 'commerce' | 'ai-dashboard' | 'saas' | 'premium-site'
}

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'concept-commerce',
    title: 'Modular commerce experience',
    category: 'E-commerce Experience',
    label: 'CONCEPT PROJECT',
    problem:
      'Retail teams need fast storefront iteration without rebuilding the entire stack each season.',
    solution:
      'Composable storefront concept with merchandising zones, performance-first product discovery and checkout clarity.',
    capabilities: ['UX architecture', 'Headless commerce patterns', 'Performance budgeting'],
    technology: ['Web', 'Edge delivery', 'Design systems'],
    visual: 'commerce',
  },
  {
    id: 'concept-ai-dashboard',
    title: 'Operations intelligence surface',
    category: 'AI Business Dashboard',
    label: 'MUCO LABS DEMO',
    problem:
      'Operations leaders lack a single trustworthy view across workflows, alerts and human approvals.',
    solution:
      'Dashboard demo with role-based panels, AI-assisted summaries and explicit human-in-the-loop actions.',
    capabilities: ['Data visualization', 'Workflow states', 'AI assist UX'],
    technology: ['Web', 'APIs', 'Applied AI'],
    visual: 'ai-dashboard',
  },
  {
    id: 'concept-saas',
    title: 'Vertical SaaS control plane',
    category: 'SaaS Product',
    label: 'CONCEPT PROJECT',
    problem:
      'B2B SaaS teams need onboarding, billing and admin tools that feel cohesive from day one.',
    solution:
      'Product concept for tenant admin, usage insights and modular feature flags with clear permissions.',
    capabilities: ['Product design', 'Multi-tenant UX', 'Admin patterns'],
    technology: ['SaaS', 'Cloud', 'Security'],
    visual: 'saas',
  },
  {
    id: 'concept-premium-site',
    title: 'Editorial brand platform',
    category: 'Premium Business Website',
    label: 'MUCO LABS DEMO',
    problem:
      'Professional firms need a digital presence that signals credibility without generic agency tropes.',
    solution:
      'Editorial site demo with asymmetric layouts, structured service storytelling and conversion paths.',
    capabilities: ['Brand narrative', 'Content architecture', 'SEO foundation'],
    technology: ['Web', 'CMS-ready structure'],
    visual: 'premium-site',
  },
]
