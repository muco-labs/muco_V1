import { useState } from 'react'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { submitProductWaitlist } from '@/services/product-waitlist'

export function ProductWaitlistForm({
  productSlug,
  sourcePath,
}: {
  productSlug: string
  sourcePath: string
}) {
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
    return <p role="status">{message}</p>
  }

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 'var(--space-3)' }} noValidate>
      <label className="stack" style={{ gap: 'var(--space-1)' }}>
        <span>Name</span>
        <input
          type="text"
          name="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </label>
      <label className="stack" style={{ gap: 'var(--space-1)' }}>
        <span>Work email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="stack" style={{ gap: 'var(--space-1)' }}>
        <span>Company (optional)</span>
        <input
          type="text"
          name="company"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </label>
      <label className="stack" style={{ gap: 'var(--space-1)' }}>
        <span>What would you use this for? (optional)</span>
        <textarea
          name="useCase"
          rows={3}
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
        />
      </label>
      <label className="cluster" style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span>
          I agree MUCO LABS may contact me about this product and early-access research. See our{' '}
          <a href="/privacy-policy">privacy policy</a>.
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
        <p role="alert" style={{ color: 'var(--color-danger, #b42318)' }}>
          {message}
        </p>
      ) : null}
      <button type="submit" className="btn btn--primary" disabled={status === 'loading'}>
        {status === 'loading' ? 'Submitting…' : 'Join waitlist'}
      </button>
    </form>
  )
}
