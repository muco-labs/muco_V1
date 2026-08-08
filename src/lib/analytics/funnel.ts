/** Funnel stage names for analytics reporting (GA4 exploration / BigQuery). */
export const conversionFunnelStages = [
  'visitor',
  'engaged',
  'service_view',
  'cta_click',
  'contact_form_start',
  'contact_form_submit',
  'crm_lead',
] as const

export type ConversionFunnelStage = (typeof conversionFunnelStages)[number]

/** Maps existing GA4 events to funnel stages — no fabricated metrics. */
export const funnelEventMap: Record<string, ConversionFunnelStage> = {
  page_view: 'visitor',
  organic_landing: 'engaged',
  service_view: 'service_view',
  portfolio_view: 'engaged',
  pricing_view: 'engaged',
  start_project_click: 'cta_click',
  service_cta_click: 'cta_click',
  portfolio_cta_click: 'cta_click',
  hero_cta_click: 'cta_click',
  contact_form_start: 'contact_form_start',
  contact_form_submit: 'contact_form_submit',
}
