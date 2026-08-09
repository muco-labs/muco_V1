/** Normalized service category IDs aligned with MUCO offerings (Phase 4.16). */
export const FREELANCER_SERVICE_CATEGORIES = [
  { id: 'website-development', label: 'Website Development' },
  { id: 'web-applications', label: 'Web Applications' },
  { id: 'mobile-app-development', label: 'Mobile App Development' },
  { id: 'ui-ux-design', label: 'UI/UX Design' },
  { id: 'graphic-design', label: 'Graphic Design' },
  { id: 'seo', label: 'SEO' },
  { id: 'digital-marketing', label: 'Digital Marketing' },
  { id: 'ai-automation', label: 'AI / Automation' },
  { id: 'cloud-devops', label: 'Cloud / DevOps' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'content', label: 'Content' },
  { id: 'other', label: 'Other' },
] as const

export const FREELANCER_SERVICE_CATEGORY_IDS = FREELANCER_SERVICE_CATEGORIES.map((c) => c.id)

export function labelFreelancerServiceCategory(id: string): string {
  return FREELANCER_SERVICE_CATEGORIES.find((c) => c.id === id)?.label ?? id
}
