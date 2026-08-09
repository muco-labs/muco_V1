import { useState, type FormEvent } from 'react'
import { ListSkeleton, PortalError } from '@/components/portal/CustomerPortalUi'
import { useFetch } from '@/hooks/useFetch'
import { freelancerApi } from '@/services/freelancer-portal'
import { Button } from '@/components/ui/Button'

export function FreelancerDashboardPage() {
  const { data, error, loading } = useFetch(() => freelancerApi.dashboard(), [])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} />

  const profile = data?.profile as Record<string, unknown> | undefined

  return (
    <>
      <h1 className="text-h2">Freelancer dashboard</h1>
      {profile ? (
        <p>
          {String(profile.fullName)} · Verification {String(profile.verificationStatus)} · Approval{' '}
          {String(profile.approvalStatus)}
        </p>
      ) : null}
      <section aria-labelledby="assignments-heading">
        <h2 id="assignments-heading" className="text-h3">
          Assignments
        </h2>
        <p>{data?.assignmentsMessage}</p>
      </section>
    </>
  )
}

export function FreelancerProfilePage() {
  const { data, error, loading, reload } = useFetch(() => freelancerApi.profile(), [])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    const form = new FormData(e.currentTarget)
    try {
      await freelancerApi.updateProfile({
        headline: String(form.get('headline') || ''),
        bio: String(form.get('bio') || ''),
        skills: String(form.get('skills') || ''),
      })
      setStatus('Profile saved.')
      reload()
    } catch {
      setStatus('Could not save profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="text-h2">Profile</h1>
      <form onSubmit={(e) => void save(e)} className="stack" style={{ maxWidth: '36rem' }}>
        <label>
          Headline
          <input name="headline" defaultValue={String(data.headline ?? '')} maxLength={200} />
        </label>
        <label>
          Bio
          <textarea name="bio" defaultValue={String(data.bio ?? '')} required minLength={20} rows={5} />
        </label>
        <label>
          Skills
          <textarea name="skills" defaultValue={String(data.skills ?? '')} required rows={3} />
        </label>
        <Button type="submit" disabled={busy}>
          Save
        </Button>
        <p role="status" aria-live="polite">
          {status}
        </p>
      </form>
    </>
  )
}

export function FreelancerAvailabilityPage() {
  const { data, error, loading, reload } = useFetch(() => freelancerApi.profile(), [])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const canManage = Boolean(data.canManageAvailability)

  async function setAvailability(status: 'available' | 'unavailable') {
    setBusy(true)
    setMessage(null)
    try {
      await freelancerApi.updateAvailability({ availabilityStatus: status })
      setMessage('Availability updated.')
      reload()
    } catch {
      setMessage('Availability cannot be changed until you are verified and approved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="text-h2">Availability</h1>
      <p>Current: {String(data.availabilityStatus)}</p>
      {!canManage ? (
        <p>Availability can be updated after MUCO verifies and approves your profile.</p>
      ) : (
        <div className="actions-row">
          <Button type="button" disabled={busy} onClick={() => void setAvailability('available')}>
            Mark available
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void setAvailability('unavailable')}>
            Mark unavailable
          </Button>
        </div>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </>
  )
}
