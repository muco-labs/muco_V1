/** GA4 event names used across the public site. */
export const analyticsEvents = {
  organicLanding: 'organic_landing',
  erodeServiceView: 'erode_service_view',
  tamilNaduPageView: 'tamil_nadu_page_view',
  indiaPageView: 'india_page_view',
  solutionIndustryView: 'solution_industry_view',
  heroCtaClick: 'hero_cta_click',
  startProjectClick: 'start_project_click',
  serviceCtaClick: 'service_cta_click',
  portfolioCtaClick: 'portfolio_cta_click',
  contactFormStart: 'contact_form_start',
  contactFormSubmit: 'contact_form_submit',
  inquiryStarted: 'inquiry_started',
  leadCreated: 'lead_created',
  serviceView: 'service_view',
  portfolioView: 'portfolio_view',
  pricingView: 'pricing_view',
  signInClick: 'sign_in_click',
  signUpClick: 'sign_up_click',
  phoneClick: 'phone_click',
  emailClick: 'email_click',
  customerSignup: 'customer_signup',
} as const

export type AnalyticsEventName = (typeof analyticsEvents)[keyof typeof analyticsEvents]

/** Primary business conversion (project enquiry submitted). */
export const primaryConversionEvent = analyticsEvents.contactFormSubmit

export const secondaryConversionEvents = [
  analyticsEvents.startProjectClick,
  analyticsEvents.contactFormSubmit,
  analyticsEvents.phoneClick,
  analyticsEvents.emailClick,
  analyticsEvents.customerSignup,
] as const
