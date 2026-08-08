import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/FormControls'
import { PageShell } from '@/layouts/PageShell'
import { pageSeo } from '@/config/seo'
import { site } from '@/config/site'
import { contact } from '@/content/contact'
import { socialLinkList } from '@/content/social'
import { company } from '@/content/company'
import { submitContact } from '@/services/contact'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { contactFieldLimits } from '@/utils/validate'
import styles from './ContactPage.module.css'

const contactSeo = pageSeo.contact

export function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  )
  const [error, setError] = useState<string | null>(null)
  const formStarted = useRef(false)

  const markFormStart = () => {
    if (formStarted.current) return
    formStarted.current = true
    trackEvent(analyticsEvents.contactFormStart)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setError(null)

    const form = new FormData(event.currentTarget)
    const result = await submitContact({
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      company: String(form.get('company') ?? ''),
      message: String(form.get('message') ?? ''),
      website: String(form.get('website') ?? ''),
    })

    if (!result.ok) {
      setStatus('error')
      setError(result.error)
      return
    }

    setStatus('success')
    trackEvent(analyticsEvents.contactFormSubmit)
    event.currentTarget.reset()
    formStarted.current = false
  }

  return (
    <PageShell
      title="Start a project"
      documentTitle={contactSeo.documentTitle}
      path={contactSeo.path}
      description="Tell us what you are building. We respond with a practical next step—usually within one business day."
    >
      <div className={styles.layout}>
        <div className={styles.aside}>
          <p className={styles.lead}>
            Share your roadmap, timeline and constraints. We scope honestly—no pressure to oversell.
          </p>
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
                <a href={`tel:${site.contactPhone}`}>{site.contactPhoneDisplay}</a>
              </li>
              <li>
                <span>Location</span>
                <span>
                  {company.location.city}, {company.location.region} {company.location.postalCode}
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
            <Link className="link-underline" to="/pricing">
              View public starting prices
            </Link>
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={onSubmit}
          noValidate
          onFocus={markFormStart}
          aria-busy={status === 'submitting'}
        >
          <div className={styles.honeypot}>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
          </div>
          <Input
            id="contact-name"
            name="name"
            label="Name"
            autoComplete="name"
            required
            maxLength={contactFieldLimits.name}
            onFocus={markFormStart}
          />
          <Input
            id="contact-email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            maxLength={contactFieldLimits.email}
            onFocus={markFormStart}
          />
          <Input
            id="contact-company"
            name="company"
            label="Company"
            autoComplete="organization"
            maxLength={contactFieldLimits.company}
            onFocus={markFormStart}
          />
          <Textarea
            id="contact-message"
            name="message"
            label="Project overview"
            required
            maxLength={contactFieldLimits.message}
            onFocus={markFormStart}
          />
          {error ? (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          ) : null}
          {status === 'success' ? (
            <p className={styles.formSuccess} role="status">
              Thanks—we received your message and will follow up with a practical next step.
            </p>
          ) : null}
          <Button type="submit" disabled={status === 'submitting' || status === 'success'}>
            {status === 'submitting' ? 'Sending…' : 'Send message'}
          </Button>
        </form>
      </div>
    </PageShell>
  )
}
