import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  EmptyState,
  ListSkeleton,
  PageIntro,
  PortalError,
  StatusPill,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import layout from '@/layouts/EmployeeAppLayout.module.css'
import { adminPortalPaths, CRM_PIPELINE_STATUSES } from '@/config/admin-portal'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api'
import styles from './Crm.module.css'

export function CrmHomePage() {
  const { data: metrics, error: metricsError, loading: metricsLoading, reload: reloadMetrics } =
    useFetch(() => adminApi.crm.metrics(), [])
  const { data: pipeline, error: pipeError, loading: pipeLoading, reload: reloadPipe } = useFetch(
    () => adminApi.crm.pipeline(),
    [],
  )

  if (metricsLoading || pipeLoading) return <ListSkeleton rows={8} />
  if (metricsError) return <PortalError message={metricsError} onRetry={reloadMetrics} />
  if (pipeError) return <PortalError message={pipeError} onRetry={reloadPipe} />

  const byStatus = (metrics?.byStatus as Array<{ status: string; c: number }>) ?? []
  const byService = (metrics?.byService as Array<{ service: string; count: number }>) ?? []
  const bySource =
    (metrics?.bySource as Array<{ source: string; sourceLabel: string; count: number }>) ?? []
  const columns = (pipeline?.columns as Record<string, Array<Record<string, unknown>>>) ?? {}

  return (
    <>
      <PageIntro
        label="CRM"
        title="Sales pipeline"
        description="Real enquiries from your website and manual entry. No fabricated pipeline data."
      />

      <div className={ui.cardGrid}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">New leads</h2>
          <p className="text-h2">{byStatus.find((r) => r.status === 'new')?.c ?? 0}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Qualified</h2>
          <p className="text-h2">{byStatus.find((r) => r.status === 'qualified')?.c ?? 0}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Overdue follow-ups</h2>
          <p className="text-h2">{Number(metrics?.overdueFollowUps ?? 0)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Conversion</h2>
          <p className="text-h2">
            {metrics?.conversionRate != null
              ? `${Math.round(Number(metrics.conversionRate) * 100)}%`
              : '—'}
          </p>
          <p className={ui.meta}>Shown when at least 3 closed leads exist.</p>
        </article>
      </div>

      {byService.length ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
          <h2 className="text-h3">Inquiries by service</h2>
          <ul className={ui.stack}>
            {byService.map((row) => (
              <li key={row.service} className={`surface ${ui.dataCard}`}>
                {row.service} — {row.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bySource.length ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="text-h3">Inquiries by source</h2>
          <ul className={ui.stack}>
            {bySource.map((row) => (
              <li key={row.source} className={`surface ${ui.dataCard}`}>
                {row.sourceLabel} ({row.source}) — {row.count}
              </li>
            ))}
          </ul>
          <p className={ui.meta}>Unknown attribution is not inferred—only stored form data is shown.</p>
        </section>
      ) : null}

      <section className={styles.pipeline} aria-label="Pipeline board">
        {CRM_PIPELINE_STATUSES.map((status) => {
          const cards = columns[status] ?? []
          return (
            <div key={status} className={styles.column}>
              <h2 className={styles.columnTitle}>
                {status.replace('_', ' ')} <span>({cards.length})</span>
              </h2>
              {cards.length === 0 ? (
                <p className={ui.meta}>No leads in this stage.</p>
              ) : (
                <ul className={styles.cardList}>
                  {cards.map((lead) => (
                    <li key={String(lead.id)} className={`surface ${styles.card}`}>
                      <Link
                        className="link-underline"
                        to={adminPortalPaths.crmLeadDetail(String(lead.id))}
                      >
                        {String(lead.name)}
                      </Link>
                      <span className={ui.meta}>{String(lead.serviceInterest ?? 'Service TBD')}</span>
                      <StatusPill status={String(lead.priority)} />
                      {lead.followUpAt ? (
                        <time className={ui.meta} dateTime={String(lead.followUpAt)}>
                          Follow-up {new Date(String(lead.followUpAt)).toLocaleDateString()}
                        </time>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </section>
    </>
  )
}

export function CrmLeadDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useFetch(() => adminApi.leads.get(id), [id])
  const [note, setNote] = useState('')
  const [interactionSummary, setInteractionSummary] = useState('')

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const lead = data.lead as Record<string, unknown>
  const notes = (data.notes as Array<Record<string, unknown>>) ?? []
  const activities = (data.activities as Array<Record<string, unknown>>) ?? []
  const proposals = (data.proposals as Array<Record<string, unknown>>) ?? []
  const duplicateHints = data.duplicateHints as Record<string, unknown> | undefined

  async function addNote(e: FormEvent) {
    e.preventDefault()
    try {
      await adminApi.leads.addNote(id, note)
      setNote('')
      reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to save note')
    }
  }

  async function logCall() {
    try {
      await adminApi.leads.logInteraction(id, {
        interactionType: 'call',
        summary: interactionSummary,
      })
      setInteractionSummary('')
      reload()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to log interaction')
    }
  }

  return (
    <>
      <PageIntro
        title={String(lead.name)}
        description={`${String(lead.company ?? lead.email)} · Source: ${String(lead.sourceLabel ?? lead.source)}`}
      />
      <StatusPill status={String(lead.status)} />
      <StatusPill status={String(lead.priority)} />

      {duplicateHints?.leadMatchId || duplicateHints?.customerMatchId ? (
        <p className={styles.duplicateBanner}>Possible duplicate — review before converting.</p>
      ) : null}

      <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="text-h3">Message</h2>
        <p>{String(lead.projectDescription)}</p>
      </section>

      {lead.landingPath ||
      lead.pageSource ||
      lead.utmSource ||
      lead.referrerHost ||
      lead.businessCity ||
      lead.businessState ||
      lead.businessCountry ||
      lead.contactTimezone ? (
        <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="text-h3">Attribution</h2>
          <ul className={ui.stack}>
            {lead.pageSource ? <li className={ui.meta}>Page context: {String(lead.pageSource)}</li> : null}
            {lead.landingPath ? <li className={ui.meta}>Landing: {String(lead.landingPath)}</li> : null}
            {lead.utmSource ? (
              <li className={ui.meta}>
                UTM: {String(lead.utmSource)}
                {lead.utmMedium ? ` / ${String(lead.utmMedium)}` : ''}
                {lead.utmCampaign ? ` / ${String(lead.utmCampaign)}` : ''}
              </li>
            ) : null}
            {lead.referrerHost ? <li className={ui.meta}>Referrer: {String(lead.referrerHost)}</li> : null}
            {lead.businessCity ? (
              <li className={ui.meta}>Business city (provided): {String(lead.businessCity)}</li>
            ) : null}
            {lead.businessState ? (
              <li className={ui.meta}>State / region (provided): {String(lead.businessState)}</li>
            ) : null}
            {lead.businessCountry ? (
              <li className={ui.meta}>Country (provided): {String(lead.businessCountry)}</li>
            ) : null}
            {lead.contactTimezone ? (
              <li className={ui.meta}>Time zone (provided): {String(lead.contactTimezone)}</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Activity</h2>
        {activities.length === 0 ? (
          <p className={ui.meta}>No activity logged yet.</p>
        ) : (
          <ul className={ui.stack}>
            {activities.map((a) => (
              <li key={String(a.id)} className={`surface ${ui.dataCard}`}>
                <span className={ui.meta}>{String(a.action)}</span>
                <time className={ui.meta} dateTime={String(a.createdAt)}>
                  {new Date(String(a.createdAt)).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Internal notes</h2>
        <form className={ui.form} onSubmit={(e) => void addNote(e)}>
          <div className={ui.field}>
            <label htmlFor="crm-note">Add note</label>
            <textarea id="crm-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit">Save note</Button>
        </form>
        {notes.length === 0 ? (
          <EmptyState title="No notes yet" description="Internal notes are not visible to customers." />
        ) : (
          <ul className={ui.stack}>
            {notes.map((n) => (
              <li key={String(n.id)} className={`surface ${ui.dataCard}`}>
                <p>{String(n.content)}</p>
                <span className={ui.meta}>
                  {String(n.authorName)} · {new Date(String(n.createdAt)).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Contact history</h2>
        <div className={layout.filterRow}>
          <input
            placeholder="Log call/meeting summary"
            value={interactionSummary}
            onChange={(e) => setInteractionSummary(e.target.value)}
            aria-label="Interaction summary"
          />
          <Button type="button" onClick={() => void logCall()}>
            Log interaction
          </Button>
        </div>
      </section>

      <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Proposals</h2>
        {proposals.length === 0 ? (
          <EmptyState title="No proposals" description="No proposals have been created for this lead." />
        ) : (
          <ul className={ui.stack}>
            {proposals.map((p) => (
              <li key={String(p.id)}>
                {String(p.title)} <StatusPill status={String(p.status)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Activity</h2>
        {activities.length === 0 ? (
          <p className={ui.meta}>No activity recorded.</p>
        ) : (
          <ul className={ui.stack}>
            {activities.map((a) => (
              <li key={String(a.id)} className={ui.meta}>
                {new Date(String(a.createdAt)).toLocaleString()} — {String(a.action)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p style={{ marginTop: 'var(--space-6)' }}>
        <Link className="link-underline" to={adminPortalPaths.crm}>
          Back to pipeline
        </Link>
      </p>
    </>
  )
}
