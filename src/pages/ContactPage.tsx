import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { PageHero } from '@/components/design-system/PageHero'
import { FinalCta } from '@/components/design-system/FinalCta'
import { InquiryForm } from '@/components/conversion/InquiryForm'
import { pageSeo } from '@/config/seo'
import { site } from '@/config/site'
import { contact } from '@/content/contact'
import { socialLinkList } from '@/content/social'
import { company } from '@/content/company'
import { serviceLabelForSlug } from '@/content/inquiry'
import { readContactPrefill } from '@/lib/conversion/contact-link'
import { getPortfolioProject } from '@/data/portfolio'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { routePaths } from '@/config/routes'
import { startProjectPaths } from '@/config/start-project'
import styles from './ContactPage.module.css'

const contactSeo = pageSeo.contact

export function ContactPage() {
  const [searchParams] = useSearchParams()
  const prefill = readContactPrefill(searchParams.toString())
  const pageSource = prefill.source ?? 'contact'

  const initialValues = useMemo(() => {
    const project = prefill.project ? getPortfolioProject(prefill.project) : undefined
    const serviceLine = prefill.service
      ? `Service interest: ${serviceLabelForSlug(prefill.service) ?? prefill.service}.`
      : ''
    const projectLine = project
      ? `Interested in something similar to: ${project.title} (${project.kind}).`
      : ''
    const message = [projectLine, serviceLine].filter(Boolean).join('\n')

    return {
      serviceInterest: prefill.service ?? '',
      businessCity: prefill.city ?? (prefill.source?.includes('erode') ? 'Erode' : ''),
      businessState:
        prefill.state ??
        (prefill.source?.includes('tamil_nadu') ? 'Tamil Nadu' : ''),
      message: message ? `${message}\n\n` : '',
    }
  }, [prefill.project, prefill.service, prefill.city, prefill.state, prefill.source])

  return (
    <>
      <PageMeta
        documentTitle={contactSeo.documentTitle}
        description={contactSeo.description}
        path={contactSeo.path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Contact', path: contactSeo.path },
        ]}
      />
      <div className={styles.page}>
        <PageHero
          eyebrow="Contact"
          title="Contact & project inquiry"
          lead="Tell us what you are building. We respond with a practical next step—usually within one business day."
        />
        <section className="section section--tight">
          <div className="shell">
            <p className={styles.intro}>
              Share your goals, timeline and budget range if you know them. We scope honestly—no
              pressure to oversell. Prefer a guided intake with your MUCO account?{' '}
              <Link className="link-underline" to={startProjectPaths.entry}>
                Start a project
              </Link>
              .
            </p>
            <div className={styles.layout}>
              <div className={styles.aside}>
                <div className={`surface ${styles.contactCard}`}>
                  <h2 className="text-h3">Direct contact</h2>
                  <ul className={styles.contactList}>
                    <li>
                      <span>Email</span>
                      <a
                        href={`mailto:${site.contactEmail}`}
                        onClick={() => trackEvent(analyticsEvents.emailClick, { location: 'contact' })}
                      >
                        {site.contactEmail}
                      </a>
                    </li>
                    <li>
                      <span>Phone</span>
                      <a
                        href={`tel:${site.contactPhone}`}
                        onClick={() => trackEvent(analyticsEvents.phoneClick, { location: 'contact' })}
                      >
                        {site.contactPhoneDisplay}
                      </a>
                    </li>
                    <li>
                      <span>Location</span>
                      <span>
                        {company.location.city}, {company.location.region}{' '}
                        {company.location.postalCode}
                      </span>
                    </li>
                    <li>
                      <span>Hours</span>
                      <span>
                        Mon–Sat {contact.hours.opens}–{contact.hours.closes} IST
                      </span>
                    </li>
                  </ul>
                  <p className={styles.response}>{contact.responseExpectation}</p>
                  <div className={`surface ${styles.guidance}`}>
                    <h2 className="text-h3">{contact.formGuidance.headline}</h2>
                    <ul>
                      {contact.formGuidance.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p>{contact.formGuidance.afterSubmit}</p>
                  </div>
                  <ul className={styles.social}>
                    {socialLinkList.map((item) => (
                      <li key={item.id}>
                        <a href={item.href} target="_blank" rel="noopener noreferrer">
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className={styles.pricingHint}>
                  <Link className="link-underline" to={routePaths.pricing}>
                    View public starting prices
                  </Link>
                  {' · '}
                  <Link className="link-underline" to={routePaths.work}>
                    Explore work
                  </Link>
                </p>
              </div>

              <div className={styles.formWrap}>
                <h2 className="text-h3">Project inquiry</h2>
                <InquiryForm pageSource={pageSource} initialValues={initialValues} />
              </div>
            </div>
          </div>
        </section>
        <FinalCta source="contact" title="Prefer a guided intake?" body="Use Start a project for a structured brief—we will still reply within one business day." />
      </div>
    </>
  )
}
