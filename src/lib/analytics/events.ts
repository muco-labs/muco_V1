/** GA4 event names used across the public site. */
export const analyticsEvents = {
  pageView: 'page_view',
  startProjectClick: 'start_project_click',
  contactFormStart: 'contact_form_start',
  contactFormSubmit: 'contact_form_submit',
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
