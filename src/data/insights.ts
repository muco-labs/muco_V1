/** Future insights content engine — publish articles only when content exists. */
export const insightCategories = [
  'Web Development',
  'Software',
  'AI',
  'Automation',
  'SEO',
  'Digital Marketing',
  'Business Technology',
  'E-commerce',
  'Local Erode Technology',
] as const

export type InsightCategory = (typeof insightCategories)[number]

export type InsightArticle = {
  slug: string
  title: string
  description: string
  category: InsightCategory
  datePublished: string
  dateModified?: string
  path: string
}

/** Published articles (empty until real posts ship). */
export const insightArticles: InsightArticle[] = []

export function getPublishedInsightSlugs(): string[] {
  return insightArticles.map((article) => article.slug)
}
