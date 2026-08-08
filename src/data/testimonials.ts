/** Structured testimonials — empty until verified client quotes exist. */
export type Testimonial = {
  id: string
  quote: string
  name: string
  role: string
  company?: string
}

export const testimonials: Testimonial[] = []

export const trustPillars = [
  {
    title: 'Transparent delivery',
    body: 'Clear scopes, visible progress and documentation you can hand to your team.',
  },
  {
    title: 'Production standards',
    body: 'Security, performance and maintainability treated as requirements—not extras.',
  },
  {
    title: 'Honest portfolio',
    body: 'Concept work is labelled. Client stories publish only when verified.',
  },
] as const
