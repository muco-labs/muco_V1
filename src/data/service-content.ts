import type { ServiceSlug } from '@/config/routes'

export type ServiceContent = {
  slug: ServiceSlug
  title: string
  category: string
  summary: string
  forWho: string
  problem: string
  builds: string[]
  outcomes: string[]
  whyItMatters: string
  process: string[]
  erodeNote?: string
}

export const serviceContent: ServiceContent[] = [
  {
    slug: 'web-development',
    title: 'Website Development',
    category: 'Build',
    summary: 'Fast, accessible marketing and product sites engineered for conversion and SEO.',
    forWho: 'Brands, startups and established businesses launching or refreshing their public surface.',
    problem: 'Outdated sites that load slowly, read generically and cannot support growth campaigns.',
    builds: [
      'Responsive, accessible frontends',
      'CMS or headless content architecture',
      'Performance and Core Web Vitals focus',
      'Analytics and conversion instrumentation',
    ],
    outcomes: [
      'A credible digital flagship',
      'Editorial flexibility for your team',
      'Technical foundation for future product work',
    ],
    whyItMatters: 'Your website is often the first production system prospects experience—it should feel intentional.',
    process: ['Discover', 'Structure content', 'Design', 'Build', 'Launch', 'Iterate'],
    erodeNote: 'Website development in Erode with standards suited for Tamil Nadu and international audiences.',
  },
  {
    slug: 'software-development',
    title: 'Software Development',
    category: 'Build',
    summary: 'Custom applications, internal tools and platforms built for real operations.',
    forWho: 'Teams replacing spreadsheets, legacy tools or manual workflows with dependable software.',
    problem: 'Fragile tools that cannot scale with users, data or compliance needs.',
    builds: [
      'Full-stack product engineering',
      'APIs and integrations',
      'Automated testing and CI/CD',
      'Observability and documentation',
    ],
    outcomes: ['Maintainable codebase', 'Faster operations', 'Room to add features safely'],
    whyItMatters: 'Software should reduce chaos—not add another system to fight.',
    process: ['Discover', 'Architect', 'Build in slices', 'Harden', 'Deploy', 'Support'],
    erodeNote: 'Software development in Erode for businesses scaling beyond off-the-shelf tools.',
  },
  {
    slug: 'mobile-app-development',
    title: 'Mobile App Development',
    category: 'Build',
    summary: 'Native-quality mobile experiences for customers and field teams.',
    forWho: 'Businesses needing iOS/Android apps tied to real backend workflows.',
    problem: 'Mobile ideas stuck in prototypes without reliable release and update paths.',
    builds: ['Cross-platform or native strategy', 'Offline-aware UX', 'Secure auth flows', 'Store-ready builds'],
    outcomes: ['Shipped apps', 'Consistent brand experience', 'Integrated analytics'],
    whyItMatters: 'Mobile is where attention and operations meet—execution must be disciplined.',
    process: ['Define journeys', 'Prototype', 'Build', 'Test devices', 'Release', 'Iterate'],
    erodeNote: 'Mobile app development in Erode with maintainable engineering practices.',
  },
  {
    slug: 'ecommerce-development',
    title: 'E-commerce Development',
    category: 'Build',
    summary: 'Storefronts and commerce systems designed for merchandising and conversion.',
    forWho: 'Retailers and D2C brands scaling catalog, payments and fulfillment touchpoints.',
    problem: 'Stores that are hard to merchandise and slow at checkout.',
    builds: ['Composable storefronts', 'Payment & shipping integrations', 'Inventory-aware UX', 'Growth hooks'],
    outcomes: ['Higher conversion clarity', 'Operational visibility', 'Platform you can extend'],
    whyItMatters: 'Commerce UX directly affects revenue—every friction point costs sales.',
    process: ['Audit funnel', 'Design catalog UX', 'Build', 'Integrate ops', 'Launch', 'Optimize'],
  },
  {
    slug: 'ai-solutions',
    title: 'AI Solutions',
    category: 'AI & Automation',
    summary: 'Applied AI embedded in products and operations—with human oversight.',
    forWho: 'Teams exploring assistants, classification, search or workflow augmentation.',
    problem: 'AI demos that never reach production or lack governance.',
    builds: ['Use-case design', 'Model integration', 'Evaluation & guardrails', 'Monitoring'],
    outcomes: ['Production-ready AI features', 'Documented limitations', 'Measurable time savings'],
    whyItMatters: 'AI should create leverage—not novelty without accountability.',
    process: ['Frame use case', 'Prototype', 'Evaluate', 'Integrate', 'Monitor', 'Improve'],
    erodeNote: 'AI solutions in Erode for businesses ready to operationalize intelligence responsibly.',
  },
  {
    slug: 'ui-ux-design',
    title: 'UI/UX Design',
    category: 'Design',
    summary: 'Product experiences that are clear, distinctive and buildable.',
    forWho: 'Founders and product teams before or during engineering.',
    problem: 'Interfaces that look fine in mockups but fail in real workflows.',
    builds: ['Research & flows', 'Design systems', 'High-fidelity UI', 'Engineering handoff'],
    outcomes: ['Cohesive product language', 'Reduced rework in build', 'Accessible patterns'],
    whyItMatters: 'Design is how complexity becomes usable.',
    process: ['Discover', 'Map journeys', 'Design', 'Validate', 'Ship', 'Learn'],
  },
  {
    slug: 'seo',
    title: 'SEO',
    category: 'Growth',
    summary: 'Technical and content SEO aligned with how people actually search.',
    forWho: 'Businesses investing in organic discovery and local visibility.',
    problem: 'Pages that cannot be crawled, indexed or matched to intent.',
    builds: ['Technical audits', 'Content architecture', 'On-page optimization', 'Measurement'],
    outcomes: ['Cleaner site structure', 'Intent-aligned pages', 'Reporting you can act on'],
    whyItMatters: 'Organic discovery compounds—if the foundation is sound.',
    process: ['Audit', 'Prioritize', 'Implement', 'Publish', 'Measure', 'Refine'],
    erodeNote: 'SEO in Erode with respect for local intent and broader market reach.',
  },
  {
    slug: 'digital-marketing',
    title: 'Digital Marketing',
    category: 'Growth',
    summary: 'Campaign systems connected to product and analytics—not isolated ads.',
    forWho: 'Teams needing coordinated acquisition across channels.',
    problem: 'Spend without feedback loops into product and content.',
    builds: ['Channel strategy', 'Landing experiences', 'Tracking architecture', 'Iteration cadence'],
    outcomes: ['Aligned messaging', 'Measurable funnels', 'Creative that matches product'],
    whyItMatters: 'Growth works when product, content and campaigns share one story.',
    process: ['Define goals', 'Build surfaces', 'Launch', 'Measure', 'Optimize'],
    erodeNote: 'Digital marketing in Erode for businesses targeting regional and national customers.',
  },
  {
    slug: 'automation',
    title: 'Business Automation',
    category: 'AI & Automation',
    summary: 'Workflow automation that removes repetitive work between tools and teams.',
    forWho: 'Operations-heavy businesses drowning in manual handoffs.',
    problem: 'Copy-paste workflows between email, sheets and legacy software.',
    builds: ['Process mapping', 'Integration layers', 'Approval flows', 'Alerts & logging'],
    outcomes: ['Hours returned to teams', 'Fewer errors', 'Auditable automation'],
    whyItMatters: 'Automation should be boring, reliable and visible—not mysterious.',
    process: ['Map workflow', 'Prototype', 'Integrate', 'Test edge cases', 'Deploy', 'Monitor'],
  },
  {
    slug: 'technology-consulting',
    title: 'Technology Consulting',
    category: 'Technology',
    summary: 'Architecture, stack and delivery guidance before major investments.',
    forWho: 'Leadership teams planning platforms, migrations or vendor decisions.',
    problem: 'Expensive commitments made without an independent technical view.',
    builds: ['Architecture reviews', 'Roadmaps', 'Vendor evaluation', 'Team enablement'],
    outcomes: ['Clear options and tradeoffs', 'Aligned stakeholders', 'Reduced delivery risk'],
    whyItMatters: 'Good decisions early prevent expensive rewrites later.',
    process: ['Listen', 'Assess', 'Recommend', 'Plan', 'Support execution'],
  },
]

export function getServiceContent(slug: string): ServiceContent | undefined {
  return serviceContent.find((entry) => entry.slug === slug)
}
