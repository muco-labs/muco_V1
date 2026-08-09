import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '@/layouts/PageShell'
import { routePaths } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import {
  fetchFreelancerServiceCategories,
  submitFreelancerApplication,
} from '@/services/freelancers-public'

export function FreelancersApplyPage() {
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([])
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void fetchFreelancerServiceCategories()
      .then((r) => setCategories(r.items))
      .catch(() => setCategories([]))
  }, [])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    const form = new FormData(e.currentTarget)
    const portfolioRaw = String(form.get('portfolioUrls') ?? '')
    const portfolioUrls = portfolioRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    try {
      const result = await submitFreelancerApplication({
        fullName: String(form.get('fullName')),
        email: String(form.get('email')),
        phone: String(form.get('phone') || undefined),
        country: String(form.get('country') || undefined),
        city: String(form.get('city') || undefined),
        professionalRole: String(form.get('professionalRole')),
        experienceLevel: String(form.get('experienceLevel') || undefined),
        headline: String(form.get('headline') || undefined),
        bio: String(form.get('bio')),
        skills: String(form.get('skills')),
        serviceCategories: selected,
        portfolioUrls,
        preferredProjectType: String(form.get('preferredProjectType') || undefined),
        availabilityNote: String(form.get('availabilityNote') || undefined),
        openToProjects: form.get('openToProjects') === 'on',
        website: String(form.get('website') ?? ''),
      })
      setMessage(`Application received (${result.reference}). We will review your profile.`)
      e.currentTarget.reset()
      setSelected([])
    } catch {
      setError('Could not submit application. Check the form or try again later.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell
      title="Join the MUCO freelancer network"
      documentTitle="Freelancer network application | MUCO LABS"
      path="/freelancers/apply"
      description="Apply to join the MUCO Labs approved freelancer network for project fulfillment."
      noIndex
    >
      <p>
        MUCO Labs remains your customer-facing partner. Joining the network does not guarantee project
        assignments, income, or employment.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="stack" style={{ maxWidth: '40rem' }}>
        <label>
          Full name
          <input name="fullName" required maxLength={120} />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Phone
          <input name="phone" />
        </label>
        <label>
          Country
          <input name="country" />
        </label>
        <label>
          City
          <input name="city" />
        </label>
        <label>
          Professional role
          <input name="professionalRole" required />
        </label>
        <label>
          Experience level
          <input name="experienceLevel" />
        </label>
        <label>
          Headline
          <input name="headline" maxLength={200} />
        </label>
        <label>
          Bio
          <textarea name="bio" required minLength={20} rows={4} />
        </label>
        <label>
          Skills
          <textarea name="skills" required rows={3} />
        </label>
        <fieldset>
          <legend>Service categories</legend>
          {categories.map((c) => (
            <label key={c.id} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={(e) => {
                  setSelected((prev) =>
                    e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                  )
                }}
              />
              {c.label}
            </label>
          ))}
        </fieldset>
        <label>
          Portfolio URLs (one per line)
          <textarea name="portfolioUrls" rows={3} />
        </label>
        <label>
          Preferred project type
          <input name="preferredProjectType" />
        </label>
        <label>
          Availability notes
          <textarea name="availabilityNote" rows={2} />
        </label>
        <label>
          <input type="checkbox" name="openToProjects" defaultChecked /> Available for projects
        </label>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />
        <Button type="submit" disabled={busy || selected.length === 0}>
          {busy ? 'Submitting…' : 'Submit application'}
        </Button>
        <p role="status" aria-live="polite">
          {message}
        </p>
        {error ? <p role="alert">{error}</p> : null}
      </form>
      <p>
        <Link to={routePaths.home}>Back to home</Link>
      </p>
    </PageShell>
  )
}
