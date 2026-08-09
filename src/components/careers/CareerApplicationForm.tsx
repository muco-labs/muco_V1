import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/FormControls'
import {
  applicationTypeOptions,
  careerRoleOptions,
  careersIntro,
  experienceLevelOptions,
} from '@/content/careers'
import { routePaths } from '@/config/routes'
import {
  registerCareerResumeUpload,
  submitCareerApplication,
  type CareerApplicationPayload,
} from '@/services/careers'
import styles from './CareerApplicationForm.module.css'

const MAX_RESUME_BYTES = 5 * 1024 * 1024
const RESUME_ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export type CareerApplicationFormProps = {
  jobOpeningSlug?: string
  jobTitle?: string
  defaultRoleInterest?: string
  defaultApplicationType?: string
}

export function CareerApplicationForm({
  jobOpeningSlug,
  jobTitle,
  defaultRoleInterest = '',
  defaultApplicationType = 'full_time',
}: CareerApplicationFormProps) {
  const idPrefix = useId().replace(/:/g, '')
  const honeypotRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [resumeWarning, setResumeWarning] = useState<string | null>(null)

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    roleInterest: defaultRoleInterest,
    applicationType: defaultApplicationType,
    experienceLevel: '',
    skills: '',
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    introduction: '',
    availability: '',
    preferredEngagement: '',
    additionalInfo: '',
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  const field = (name: keyof typeof values) => ({
    value: values[name],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((prev) => ({ ...prev, [name]: event.target.value }))
    },
  })

  const onResumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setResumeFile(null)
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError('Resume must be 5 MB or smaller.')
      event.target.value = ''
      setResumeFile(null)
      return
    }
    setResumeFile(file)
    setError(null)
  }

  const buildPayload = (): CareerApplicationPayload => ({
    jobOpeningSlug: jobOpeningSlug || undefined,
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || undefined,
    city: values.city.trim() || undefined,
    country: values.country.trim() || undefined,
    roleInterest: values.roleInterest.trim(),
    applicationType: values.applicationType,
    experienceLevel: values.experienceLevel.trim() || undefined,
    skills: values.skills.trim(),
    portfolioUrl: values.portfolioUrl.trim() || undefined,
    linkedinUrl: values.linkedinUrl.trim() || undefined,
    githubUrl: values.githubUrl.trim() || undefined,
    introduction: values.introduction.trim(),
    availability: values.availability.trim(),
    preferredEngagement: values.preferredEngagement.trim() || undefined,
    additionalInfo: values.additionalInfo.trim() || undefined,
    website: honeypotRef.current?.value ?? '',
  })

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus('submitting')
    setError(null)
    setResumeWarning(null)

    const result = await submitCareerApplication(buildPayload())
    if (!result.ok) {
      setStatus('error')
      setError(result.error)
      return
    }

    setReference(result.reference)

    if (resumeFile && result.resumeUploadAvailable) {
      const upload = await registerCareerResumeUpload(result.id, resumeFile)
      if (!upload.ok) {
        setResumeWarning(upload.error)
      }
    } else if (resumeFile && !result.resumeUploadAvailable) {
      setResumeWarning(
        'Your application was received, but resume upload is unavailable. You may share your CV by email if needed.',
      )
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className={`surface ${styles.success}`} role="status" aria-live="polite">
        <h2 className="text-h3">Application received</h2>
        <p>
          Thank you{values.fullName ? `, ${values.fullName.split(' ')[0]}` : ''}. Your reference is{' '}
          <strong>{reference}</strong>.
        </p>
        <p className={styles.muted}>{careersIntro.process}</p>
        {resumeWarning ? <p className={styles.warning}>{resumeWarning}</p> : null}
        <p>
          <Link className="link-underline" to={routePaths.careers}>
            Back to Careers
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <p className={styles.privacy}>{careersIntro.privacy}</p>
      {jobTitle ? (
        <p className={styles.context}>
          Applying for: <strong>{jobTitle}</strong>
        </p>
      ) : null}

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${idPrefix}-website`}>Website</label>
        <input
          ref={honeypotRef}
          id={`${idPrefix}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={styles.grid}>
        <Input
          id={`${idPrefix}-fullName`}
          label="Full name"
          required
          autoComplete="name"
          {...field('fullName')}
        />
        <Input
          id={`${idPrefix}-email`}
          label="Email"
          type="email"
          required
          autoComplete="email"
          {...field('email')}
        />
        <Input
          id={`${idPrefix}-phone`}
          label="Phone"
          type="tel"
          autoComplete="tel"
          {...field('phone')}
        />
        <Input id={`${idPrefix}-city`} label="City" autoComplete="address-level2" {...field('city')} />
        <Input
          id={`${idPrefix}-country`}
          label="Country"
          autoComplete="country-name"
          {...field('country')}
        />
      </div>

      <Select
        id={`${idPrefix}-applicationType`}
        label="Application type"
        required
        options={applicationTypeOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
        {...field('applicationType')}
      />

      <Select
        id={`${idPrefix}-roleInterest`}
        label="Role / area of interest"
        required
        options={[
          { value: '', label: 'Select a role' },
          ...careerRoleOptions.map((role) => ({ value: role, label: role })),
        ]}
        {...field('roleInterest')}
      />

      <Select
        id={`${idPrefix}-experienceLevel`}
        label="Experience level"
        options={[
          { value: '', label: 'Select (optional)' },
          ...experienceLevelOptions.map((level) => ({ value: level, label: level })),
        ]}
        {...field('experienceLevel')}
      />

      <Textarea
        id={`${idPrefix}-skills`}
        label="Skills"
        required
        rows={4}
        hint="List tools, languages and domains relevant to your work."
        {...field('skills')}
      />

      <div className={styles.grid}>
        <Input
          id={`${idPrefix}-portfolioUrl`}
          label="Portfolio URL"
          type="url"
          inputMode="url"
          placeholder="https://"
          {...field('portfolioUrl')}
        />
        <Input
          id={`${idPrefix}-linkedinUrl`}
          label="LinkedIn URL"
          type="url"
          inputMode="url"
          placeholder="https://"
          {...field('linkedinUrl')}
        />
        <Input
          id={`${idPrefix}-githubUrl`}
          label="GitHub URL"
          type="url"
          inputMode="url"
          placeholder="https://"
          {...field('githubUrl')}
        />
      </div>

      <Textarea
        id={`${idPrefix}-introduction`}
        label="Short introduction"
        required
        rows={5}
        hint="Tell us what you want to work on and what you have built recently (at least a few sentences)."
        {...field('introduction')}
      />

      <Input
        id={`${idPrefix}-availability`}
        label="Availability"
        required
        {...field('availability')}
      />

      <Input
        id={`${idPrefix}-preferredEngagement`}
        label="Preferred engagement type"
        {...field('preferredEngagement')}
      />

      <Textarea
        id={`${idPrefix}-additionalInfo`}
        label="Additional information"
        rows={3}
        {...field('additionalInfo')}
      />

      <div>
        <label className={styles.fileLabel} htmlFor={`${idPrefix}-resume`}>
          Resume / CV (optional)
        </label>
        <input
          id={`${idPrefix}-resume`}
          type="file"
          accept={RESUME_ACCEPT}
          onChange={onResumeChange}
          className={styles.fileInput}
        />
        <p className={styles.hint}>PDF or Word, up to 5 MB. Upload may be unavailable in some environments.</p>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  )
}
