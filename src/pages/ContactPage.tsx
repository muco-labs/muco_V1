import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/FormControls'
import { PageShell } from '@/layouts/PageShell'
import { pageSeo } from '@/config/seo'
import { site } from '@/config/site'
import { submitContact } from '@/services/contact'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { contactFieldLimits } from '@/utils/validate'
import styles from './ContactPage.module.css'

const contact = pageSeo.contact

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
      documentTitle={contact.documentTitle}
      path={contact.path}
      description="Tell us what you are building. We will follow up with a practical next step."
    >
      <div className={styles.layout}>
        <div className={styles.aside}>
          <p className={styles.lead}>
            Prefer email? Reach us at{' '}
            <a
              href={`mailto:${site.contactEmail}`}
              onClick={() => trackEvent(analyticsEvents.emailClick, { location: 'contact' })}
            >
              {site.contactEmail}
            </a>
            .
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
