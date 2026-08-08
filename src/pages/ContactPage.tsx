import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/FormControls'
import { PageShell } from '@/layouts/PageShell'
import { site } from '@/config/site'
import { submitContact } from '@/services/contact'
import styles from './ContactPage.module.css'

export function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  )
  const [error, setError] = useState<string | null>(null)

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
    })

    if (!result.ok) {
      setStatus('error')
      setError(result.error)
      return
    }

    setStatus('success')
    event.currentTarget.reset()
  }

  return (
    <PageShell
      title="Contact"
      path="/contact"
      description="Tell us what you are building. We will follow up with a practical next step."
    >
      <div className={styles.layout}>
        <div className={styles.aside}>
          <p className={styles.lead}>
            Prefer email? Reach us at{' '}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
          </p>
        </div>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <Input
            id="contact-name"
            name="name"
            label="Name"
            autoComplete="name"
            required
          />
          <Input
            id="contact-email"
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
          />
          <Input
            id="contact-company"
            name="company"
            label="Company"
            autoComplete="organization"
          />
          <Textarea
            id="contact-message"
            name="message"
            label="Project overview"
            required
          />
          {error ? (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          ) : null}
          {status === 'success' ? (
            <p className={styles.formSuccess} role="status">
              Thanks—your message is ready to send once the secure endpoint is connected.
            </p>
          ) : null}
          <Button type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Sending…' : 'Send message'}
          </Button>
        </form>
      </div>
    </PageShell>
  )
}
