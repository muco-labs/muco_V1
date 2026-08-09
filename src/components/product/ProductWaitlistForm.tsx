import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { routePaths } from '@/config/routes'
import { submitProductWaitlist } from '@/services/product-waitlist'
import { Input, Textarea } from '@/components/ui/FormControls'
import { Button } from '@/components/ui/Button'
import styles from './ProductWaitlistForm.module.css'

export function ProductWaitlistForm({
  productSlug,
  sourcePath,
}: {
  productSlug: string
  sourcePath: string
}) {
  const idPrefix = useId()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [useCase, setUseCase] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    const result = await submitProductWaitlist({
      productSlug,
      email,
      fullName,
      company,
      useCase,
      marketingConsent: consent,
      sourcePath,
      website,
    })
    if (!result.ok) {
      setStatus('error')
      setMessage(result.error)
      return
    }
    setStatus('done')
    trackEvent(analyticsEvents.productWaitlistSubmit, { product_slug: productSlug })
    setMessage(
      result.alreadyRegistered
        ? 'You are already on the waitlist for this product. We will be in touch when there is news.'
        : 'Thank you—you are on the waitlist. We will reach out for validation interviews when ready.',
    )
  }

  if (status === 'done') {
    return (
      <p className={styles.success} role="status">
        {message}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <div className={styles.row}>
        <Input
          id={`${idPrefix}-name`}
          label="Name"
          type="text"
          name="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          id={`${idPrefix}-email`}
          label="Work email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Input
        id={`${idPrefix}-company`}
        label="Company (optional)"
        type="text"
        name="company"
        autoComplete="organization"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />
      <Textarea
        id={`${idPrefix}-use-case`}
        label="What would you use this for? (optional)"
        name="useCase"
        rows={4}
        value={useCase}
        onChange={(e) => setUseCase(e.target.value)}
      />
      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span className={styles.consentText}>
          I agree MUCO LABS may contact me about this product and early-access research. See our{' '}
          <Link to={routePaths.privacy}>privacy policy</Link>.
        </span>
      </label>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      {status === 'error' && message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
      <div className={styles.actions}>
        <Button type="submit" size="lg" disabled={status === 'loading'}>
          {status === 'loading' ? 'Submitting…' : 'Join waitlist'}
        </Button>
      </div>
    </form>
  )
}
