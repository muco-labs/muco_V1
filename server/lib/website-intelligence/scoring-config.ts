export type ScoreCategory =
  | 'technicalSeo'
  | 'content'
  | 'accessibility'
  | 'performance'
  | 'mobile'
  | 'security'
  | 'conversion'

export const scoreCategoryWeights: Record<ScoreCategory, number> = {
  technicalSeo: 0.25,
  content: 0.15,
  accessibility: 0.15,
  performance: 0.2,
  mobile: 0.1,
  security: 0.1,
  conversion: 0.05,
}

export const severityPenalties: Record<string, number> = {
  critical: 18,
  high: 10,
  medium: 5,
  low: 2,
  informational: 0,
}

export function computeCategoryScore(
  base: number,
  issueCountBySeverity: Record<string, number>,
): number {
  let score = base
  for (const [severity, count] of Object.entries(issueCountBySeverity)) {
    score -= (severityPenalties[severity] ?? 1) * count
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function computeOverallScore(
  categories: Partial<Record<ScoreCategory, number | null>>,
): number | null {
  let totalWeight = 0
  let weighted = 0
  for (const [key, weight] of Object.entries(scoreCategoryWeights) as [ScoreCategory, number][]) {
    const value = categories[key]
    if (value === null || value === undefined) continue
    totalWeight += weight
    weighted += value * weight
  }
  if (totalWeight === 0) return null
  return Math.round(weighted / totalWeight)
}
