import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { customerPortalPaths } from '@/config/customer-portal'
import { customerApi } from '@/services/customer-portal'
import { ApiError } from '@/services/api'
import ui from '@/components/portal/CustomerPortalUi.module.css'

type Props = {
  heading: string
  projectId?: string
  leadId?: string
  proposalId?: string
}

export function CustomerMessageMucoButton({ heading, projectId, leadId, proposalId }: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openConversation() {
    setError(null)
    setLoading(true)
    try {
      const conversation = await customerApi.conversations.create({
        projectId,
        leadId,
        proposalId,
      })
      navigate(customerPortalPaths.conversationDetail(conversation.id))
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not open conversation. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-labelledby="message-muco-heading">
      <h2 id="message-muco-heading" className="text-h3">
        {heading}
      </h2>
      <p className={ui.meta} style={{ marginTop: 'var(--space-2)' }}>
        Send a message to the MUCO team. We will reply in your Messages inbox.
      </p>
      {error ? (
        <p role="alert" className={ui.meta} style={{ color: 'var(--color-danger, #b42318)' }}>
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        style={{ marginTop: 'var(--space-4)' }}
        disabled={loading}
        aria-busy={loading}
        onClick={() => void openConversation()}
      >
        {loading ? 'Opening…' : 'Message MUCO'}
      </Button>
    </section>
  )
}
