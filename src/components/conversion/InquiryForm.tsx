import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/FormControls'
import {
  budgetRangeOptions,
  serviceInquiryOptions,
  timelineOptions,
} from '@/content/inquiry'
import { contact } from '@/content/contact'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { submitContact } from '@/services/contact'
import { contactFieldLimits } from '@/utils/validate'
import styles from './InquiryForm.module.css'

export type InquiryFormValues = {
  name: string
  email: string
  phone: string
  company: string
  serviceInterest: string
  budget: string
  timeline: string
  message: string
}

type InquiryFormProps = {
  idPrefix?: string
  pageSource?: string
  initialValues?: Partial<InquiryFormValues>
  submitLabel?: string
}

const emptyValues: InquiryFormValues = {
  name: '',
  email: '',
  phone: '',
  company: '',
  serviceInterest: '',
  budget: '',
  timeline: '',
  message: '',
}

export function InquiryForm({
  idPrefix = 'inquiry',
  pageSource = 'contact',
  initialValues,
  submitLabel = 'Send inquiry',
}: InquiryFormProps) {
  const [values, setValues] = useState<InquiryFormValues>({
    ...emptyValues,
    ...initialValues,
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [leadRef, setLeadRef] = useState<string | null>(null)
  const formStarted = useRef(false)

  const markFormStart = () => {
    if (formStarted.current) return
    formStarted.current = true
    trackEvent(analyticsEvents.contactFormStart, { source: pageSource })
  }

  const field = (name: keyof InquiryFormValues) => ({
    value: values[name],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [name]: event.target.value }))
    },
    onFocus: markFormStart,
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setError(null)

    const honeypot = new FormData(event.currentTarget).get('website')
    const result = await submitContact({
      name: values.name,
      email: values.email,
      phone: values.phone,
      company: values.company,
      message: values.message,
      serviceInterest: values.serviceInterest,
      budget: values.budget,
      timeline: values.timeline,
      pageSource,
      website: String(honeypot ?? ''),
    })

    if (!result.ok) {
      setStatus('error')
      setError(result.error)
      return
    }

    setStatus('success')
    setLeadRef(result.leadId?.slice(0, 8).toUpperCase() ?? null)
    trackEvent(analyticsEvents.contactFormSubmit, { source: pageSource })
    formStarted.current = false
  }

  if (status === 'success') {
    return (
      <div className={styles.success} role="status">
        <h2 className="text-h3">Your inquiry has been received.</h2>
        <p>
          Thank you—we received your message and will follow up with a practical next step.
          {leadRef ? (
            <>
              {' '}
              Reference: <strong>{leadRef}</strong>
            </>
          ) : null}
        </p>
        <p className={styles.successHint}>
          You can also reach us at{' '}
          <a href={`mailto:${contact.email}`}>{contact.email}</a> if you need to add details.
        </p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-busy={status === 'submitting'}>
      <div className={styles.honeypot}>
        <input
          id={`${idPrefix}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>
      <div className={styles.row}>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          label="Name"
          autoComplete="name"
          required
          placeholder="Your name"
          maxLength={contactFieldLimits.name}
          {...field('name')}
        />
        <Input
          id={`${idPrefix}-email`}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          maxLength={contactFieldLimits.email}
          {...field('email')}
        />
      </div>
      <div className={styles.row}>
        <Input
          id={`${idPrefix}-phone`}
          name="phone"
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+91 …"
          maxLength={contactFieldLimits.phone}
          hint="Helps us reach you faster for time-sensitive projects."
          {...field('phone')}
        />
        <Input
          id={`${idPrefix}-company`}
          name="company"
          label="Company (optional)"
          autoComplete="organization"
          placeholder="Company or brand name"
          maxLength={contactFieldLimits.company}
          {...field('company')}
        />
      </div>
      <Select
        id={`${idPrefix}-service`}
        name="serviceInterest"
        label="Service"
        options={[...serviceInquiryOptions]}
        {...field('serviceInterest')}
      />
      <div className={styles.row}>
        <Select
          id={`${idPrefix}-budget`}
          name="budget"
          label="Budget range"
          options={[...budgetRangeOptions]}
          {...field('budget')}
        />
        <Select
          id={`${idPrefix}-timeline`}
          name="timeline"
          label="Timeline"
          options={[...timelineOptions]}
          {...field('timeline')}
        />
      </div>
      <Textarea
        id={`${idPrefix}-message`}
        name="message"
        label="Project overview"
        required
        placeholder="What are you building? Who is it for? Any deadlines or constraints?"
        maxLength={contactFieldLimits.message}
        {...field('message')}
      />
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={status === 'submitting'} fullWidth>
        {status === 'submitting' ? 'Sending…' : submitLabel}
      </Button>
    </form>
  )
}
