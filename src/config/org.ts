/** Mirror of server/lib/org/departments.ts for admin UI selects. */
export const mucoDepartments = [
  { slug: 'management', label: 'Foundation / Management' },
  { slug: 'engineering', label: 'Engineering' },
  { slug: 'design', label: 'Design' },
  { slug: 'product', label: 'Product' },
  { slug: 'sales', label: 'Sales' },
  { slug: 'marketing', label: 'Marketing / SEO' },
  { slug: 'customer_success', label: 'Customer Success' },
  { slug: 'support', label: 'Support' },
  { slug: 'finance', label: 'Finance / Operations' },
  { slug: 'people', label: 'HR / People' },
] as const

export const employmentStateOptions = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'offboarded', label: 'Offboarded' },
] as const
