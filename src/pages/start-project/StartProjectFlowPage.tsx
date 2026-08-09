import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageMeta } from '@/components/seo/PageMeta'
import { Button } from '@/components/ui/Button'
import {
  budgetPreferenceOptions,
  intakeServiceOptions,
  startProjectPaths,
  timelinePreferenceOptions,
  budgetLabel,
  timelineLabel,
  intakeLabelForService,
} from '@/config/start-project'
import { customerPortalPaths } from '@/config/customer-portal'
import { readStartProjectPrefill } from '@/lib/conversion/start-project-link'
import { customerApi } from '@/services/customer-portal'
import { ApiError } from '@/services/api'
import styles from './StartProjectFlow.module.css'

const STEPS = ['Details', 'Services', 'Requirement', 'Budget & timeline', 'Review'] as const

const INTAKE_DRAFT_KEY = 'muco.start-project.draft.v1'

const VALID_SERVICE_SLUGS = new Set<string>(intakeServiceOptions.map((option) => option.value))

type FormState = {
  fullName: string
  email: string
  phone: string
  companyName: string
  country: string
  state: string
  city: string
  website: string
  primaryService: string
  customPrimaryService: string
  additionalServices: string[]
  requirement: string
  objective: string
  targetAudience: string
  existingUrl: string
  importantFeatures: string
  referenceUrls: string
  budgetPreference: string
  budgetNotes: string
  timelinePreference: string
  timelineNotes: string
  submissionNotes: string
}

const emptyForm: FormState = {
  fullName: '',
  email: '',
  phone: '',
  companyName: '',
  country: '',
  state: '',
  city: '',
  website: '',
  primaryService: 'web-development',
  customPrimaryService: '',
  additionalServices: [],
  requirement: '',
  objective: '',
  targetAudience: '',
  existingUrl: '',
  importantFeatures: '',
  referenceUrls: '',
  budgetPreference: 'not_decided',
  budgetNotes: '',
  timelinePreference: 'not_decided',
  timelineNotes: '',
  submissionNotes: '',
}

export function StartProjectFlowPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loadingPrefill, setLoadingPrefill] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const prefill = useMemo(() => readStartProjectPrefill(searchParams.toString()), [searchParams])

  const prefillService =
    prefill.service && VALID_SERVICE_SLUGS.has(prefill.service) ? prefill.service : undefined

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(INTAKE_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as { form?: FormState; step?: number }
      if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }))
      if (typeof draft.step === 'number' && draft.step >= 0 && draft.step < STEPS.length) {
        setStep(draft.step)
      }
    } catch {
      sessionStorage.removeItem(INTAKE_DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ form, step }))
    } catch {
      /* storage full or unavailable */
    }
  }, [form, step])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = (await customerApi.projectRequests.prefill()) as Partial<FormState>
        if (cancelled) return
        setForm((prev) => ({
          ...prev,
          fullName: data.fullName ?? prev.fullName,
          email: data.email ?? prev.email,
          phone: data.phone ?? prev.phone,
          companyName: data.companyName ?? prev.companyName,
          country: data.country ?? prev.country,
          state: data.state ?? prev.state,
          city: data.city ?? prev.city,
          website: data.website ?? prev.website,
          primaryService: prefillService ?? prev.primaryService,
        }))
      } catch {
        if (!cancelled) setError('Could not load your profile. You can still complete the form.')
      } finally {
        if (!cancelled) setLoadingPrefill(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [prefillService])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleAdditional(slug: string) {
    setForm((prev) => {
      const set = new Set(prev.additionalServices)
      if (set.has(slug)) set.delete(slug)
      else set.add(slug)
      return { ...prev, additionalServices: [...set] }
    })
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!form.fullName.trim() || form.fullName.trim().length < 2) return 'Enter your full name.'
      if (!form.email.trim()) return 'Email is required.'
    }
    if (current === 1) {
      if (!VALID_SERVICE_SLUGS.has(form.primaryService)) {
        return 'Select a valid primary service.'
      }
      if (form.primaryService === 'other' && !form.customPrimaryService.trim()) {
        return 'Describe the service you need when selecting Other.'
      }
    }
    if (current === 2) {
      if (form.requirement.trim().length < 20) {
        return 'Please describe your requirement in at least 20 characters.'
      }
    }
    return null
  }

  function next() {
    const message = validateStep(step)
    if (message) {
      setError(message)
      return
    }
    setError(null)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    const message = validateStep(2)
    if (message) {
      setError(message)
      setStep(2)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = (await customerApi.projectRequests.create({
        ...form,
        additionalServices: form.additionalServices,
      })) as { id: string }
      sessionStorage.removeItem(INTAKE_DRAFT_KEY)
      navigate(startProjectPaths.success(result.id), { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Submission failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingPrefill) {
    return (
      <p className={styles.meta} role="status">
        Loading your details…
      </p>
    )
  }

  return (
    <>
      <PageMeta
        documentTitle="Start a Project | MUCO LABS"
        description="Tell us about your project requirements."
        path={startProjectPaths.flow}
        noIndex
      />
      <div className={styles.start}>
        <div className={styles.shell}>
          <p className="eyebrow-line">Start a project</p>
          <h1 className="text-h1">Project intake</h1>
          <p className={styles.meta} id="intake-step-label">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>

          <div
            className={styles.progress}
            aria-labelledby="intake-step-label"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
          >
            {STEPS.map((_, index) => (
              <span
                key={STEPS[index]}
                className={
                  index < step
                    ? `${styles.progressStep} ${styles.progressStepDone}`
                    : index === step
                      ? `${styles.progressStep} ${styles.progressStepActive}`
                      : styles.progressStep
                }
              />
            ))}
          </div>

          <form className={`surface ${styles.card}`} onSubmit={(e) => void onSubmit(e)}>
            {step === 0 ? (
              <div className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    readOnly
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="companyName">Company</label>
                    <input
                      id="companyName"
                      value={form.companyName}
                      onChange={(e) => update('companyName', e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label htmlFor="city">City</label>
                    <input id="city" value={form.city} onChange={(e) => update('city', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="state">State</label>
                    <input id="state" value={form.state} onChange={(e) => update('state', e.target.value)} />
                  </div>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label htmlFor="country">Country</label>
                    <input
                      id="country"
                      value={form.country}
                      onChange={(e) => update('country', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="website">Website (optional)</label>
                    <input
                      id="website"
                      type="url"
                      placeholder="https://"
                      value={form.website}
                      onChange={(e) => update('website', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className={styles.form}>
                <p className={styles.meta}>Select a primary service. You can add more below.</p>
                <div className={styles.serviceList}>
                  {intakeServiceOptions.map((opt) => (
                    <label key={opt.value} className={styles.serviceOption}>
                      <input
                        type="radio"
                        name="primaryService"
                        checked={form.primaryService === opt.value}
                        onChange={() => update('primaryService', opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {form.primaryService === 'other' ? (
                  <div className={styles.field}>
                    <label htmlFor="customPrimaryService">Describe the service</label>
                    <input
                      id="customPrimaryService"
                      required
                      value={form.customPrimaryService}
                      onChange={(e) => update('customPrimaryService', e.target.value)}
                    />
                  </div>
                ) : null}
                <p className={styles.meta}>Additional services (optional)</p>
                <div className={styles.serviceList}>
                  {intakeServiceOptions
                    .filter((o) => o.value !== form.primaryService)
                    .map((opt) => (
                      <label key={opt.value} className={styles.serviceOption}>
                        <input
                          type="checkbox"
                          checked={form.additionalServices.includes(opt.value)}
                          onChange={() => toggleAdditional(opt.value)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="requirement">What do you want us to build or improve?</label>
                  <textarea
                    id="requirement"
                    required
                    minLength={20}
                    value={form.requirement}
                    onChange={(e) => update('requirement', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="objective">Project objective (optional)</label>
                  <textarea
                    id="objective"
                    value={form.objective}
                    onChange={(e) => update('objective', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="targetAudience">Target audience (optional)</label>
                  <textarea
                    id="targetAudience"
                    value={form.targetAudience}
                    onChange={(e) => update('targetAudience', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="existingUrl">Existing website or app URL (optional)</label>
                  <input
                    id="existingUrl"
                    type="url"
                    placeholder="https://"
                    value={form.existingUrl}
                    onChange={(e) => update('existingUrl', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="importantFeatures">Important features (optional)</label>
                  <textarea
                    id="importantFeatures"
                    value={form.importantFeatures}
                    onChange={(e) => update('importantFeatures', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="referenceUrls">Reference websites (optional)</label>
                  <textarea
                    id="referenceUrls"
                    value={form.referenceUrls}
                    onChange={(e) => update('referenceUrls', e.target.value)}
                  />
                </div>
                <p className={styles.meta}>File attachments are not available in this step yet.</p>
              </div>
            ) : null}

            {step === 3 ? (
              <div className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="budgetPreference">Budget preference</label>
                  <select
                    id="budgetPreference"
                    value={form.budgetPreference}
                    onChange={(e) => update('budgetPreference', e.target.value)}
                  >
                    {budgetPreferenceOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className={styles.meta}>Your preference only — not a fixed MUCO price.</p>
                </div>
                {form.budgetPreference === 'custom' ? (
                  <div className={styles.field}>
                    <label htmlFor="budgetNotes">Budget notes</label>
                    <input
                      id="budgetNotes"
                      value={form.budgetNotes}
                      onChange={(e) => update('budgetNotes', e.target.value)}
                    />
                  </div>
                ) : null}
                <div className={styles.field}>
                  <label htmlFor="timelinePreference">Timeline</label>
                  <select
                    id="timelinePreference"
                    value={form.timelinePreference}
                    onChange={(e) => update('timelinePreference', e.target.value)}
                  >
                    {timelinePreferenceOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="timelineNotes">Timeline notes (optional)</label>
                  <input
                    id="timelineNotes"
                    value={form.timelineNotes}
                    onChange={(e) => update('timelineNotes', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="submissionNotes">Anything else? (optional)</label>
                  <textarea
                    id="submissionNotes"
                    value={form.submissionNotes}
                    onChange={(e) => update('submissionNotes', e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <dl className={styles.review}>
                <dt>Customer</dt>
                <dd>
                  {form.fullName}
                  <br />
                  {form.email}
                  {form.phone ? ` · ${form.phone}` : ''}
                </dd>
                <dt>Service</dt>
                <dd>
                  {form.primaryService === 'other'
                    ? form.customPrimaryService
                    : intakeLabelForService(form.primaryService)}
                </dd>
                {form.additionalServices.length ? (
                  <>
                    <dt>Additional services</dt>
                    <dd>{form.additionalServices.map(intakeLabelForService).join(', ')}</dd>
                  </>
                ) : null}
                <dt>Requirement</dt>
                <dd>{form.requirement}</dd>
                <dt>Budget</dt>
                <dd>{budgetLabel(form.budgetPreference)}</dd>
                <dt>Timeline</dt>
                <dd>{timelineLabel(form.timelinePreference)}</dd>
                {(form.website || form.existingUrl) && (
                  <>
                    <dt>Website</dt>
                    <dd>{form.existingUrl || form.website}</dd>
                  </>
                )}
              </dl>
            ) : null}

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <div className={styles.actions}>
              {step > 0 ? (
                <Button type="button" variant="secondary" onClick={back}>
                  Back
                </Button>
              ) : null}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next} disabled={submitting}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={submitting} aria-busy={submitting}>
                  {submitting ? 'Submitting…' : 'Submit project request'}
                </Button>
              )}
            </div>
          </form>

          <p className={styles.meta} style={{ marginTop: 'var(--space-4)' }}>
            <Link to={customerPortalPaths.root}>Customer portal</Link>
          </p>
        </div>
      </div>
    </>
  )
}

export function StartProjectSuccessPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <>
      <PageMeta
        documentTitle="Request received | MUCO LABS"
        description="Your project request was submitted."
        path={id ? startProjectPaths.success(id) : startProjectPaths.flow}
        noIndex
      />
      <div className={styles.start}>
        <div className={`surface ${styles.card} ${styles.shell}`}>
          <h1 className="text-h1">Project request received</h1>
          <p className={styles.meta}>
            Reference: <strong>{id}</strong>
          </p>
          <p>
            Our team will review your requirements and contact you with the next steps.
          </p>
          <div className={styles.actions}>
            <Button to={customerPortalPaths.requests}>View project requests</Button>
            <Button to={customerPortalPaths.root} variant="secondary">
              Customer dashboard
            </Button>
            <Button to={customerPortalPaths.support} variant="ghost">
              Support
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
