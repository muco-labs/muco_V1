export const insightCategories = [
  'Web development',
  'Software engineering',
  'AI & automation',
  'SEO & growth',
  'Digital marketing',
  'Erode & Tamil Nadu tech',
] as const

export type InsightTopic = {
  id: string
  title: string
  description: string
}

/** Editorial topics planned — no fabricated publication dates or articles. */
export const insightTopics: InsightTopic[] = [
  {
    id: 'web-performance',
    title: 'Performance-first marketing sites',
    description: 'Core Web Vitals, structured content and conversion-focused engineering.',
  },
  {
    id: 'ai-rag',
    title: 'Practical AI assistants for business',
    description: 'RAG, guardrails and human handoff without hype.',
  },
  {
    id: 'local-seo',
    title: 'Local SEO for Tamil Nadu businesses',
    description: 'Being discoverable in Erode, Coimbatore and beyond.',
  },
]

export const insightsIntro =
  'Long-form articles publish here when ready. Until then, explore services or start a conversation about your roadmap.'
