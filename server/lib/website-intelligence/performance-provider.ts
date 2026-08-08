export type PerformanceMeasurement = {
  provider: string
  performanceScore: number | null
  metrics: Record<string, string | number | null>
}

export interface PerformanceProvider {
  readonly name: string
  isConfigured(): boolean
  measure(url: string): Promise<PerformanceMeasurement | null>
}

export class UnconfiguredPerformanceProvider implements PerformanceProvider {
  readonly name = 'none'

  isConfigured(): boolean {
    return false
  }

  async measure(): Promise<PerformanceMeasurement | null> {
    return null
  }
}

export class PageSpeedInsightsProvider implements PerformanceProvider {
  readonly name = 'pagespeed'

  constructor(private apiKey: string | undefined) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey?.trim())
  }

  async measure(url: string): Promise<PerformanceMeasurement | null> {
    if (!this.isConfigured()) return null
    const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
    endpoint.searchParams.set('url', url)
    endpoint.searchParams.set('key', this.apiKey!)
    endpoint.searchParams.set('strategy', 'mobile')

    const response = await fetch(endpoint, { signal: AbortSignal.timeout(60_000) })
    if (!response.ok) return null
    const data = (await response.json()) as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number } }
      }
    }
    const score = data.lighthouseResult?.categories?.performance?.score
    return {
      provider: this.name,
      performanceScore: score != null ? Math.round(score * 100) : null,
      metrics: {},
    }
  }
}

export function createPerformanceProvider(): PerformanceProvider {
  const key = process.env.PAGESPEED_INSIGHTS_API_KEY?.trim()
  if (key) return new PageSpeedInsightsProvider(key)
  return new UnconfiguredPerformanceProvider()
}
