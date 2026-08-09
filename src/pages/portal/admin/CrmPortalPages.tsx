import { useMemo } from 'react'
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
import { CrmEntryChannelBadge, CrmStartProjectLeadPanel, type StartProjectIntakeView } from '@/components/portal/crm/CrmStartProjectLeadPanel'
import { CrmSalesActionPanel } from '@/components/portal/crm/CrmSalesActionPanel'
import { CrmProjectFulfillmentPanel } from '@/components/portal/crm/CrmProjectFulfillmentPanel'
import { CrmProposalFulfillmentPanel } from '@/components/portal/crm/CrmProposalFulfillmentPanel'
import { CrmActivityTimeline } from '@/components/portal/crm/CrmActivityTimeline'
import { adminPortalPaths, CRM_PIPELINE_STATUSES } from '@/config/admin-portal'
import { useAuth } from '@/contexts/AuthProvider'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
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
          <h2 className="text-h3">Follow up today</h2>
          <p className="text-h2">{Number(metrics?.todayFollowUps ?? 0)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Overdue follow-ups</h2>
          <p className="text-h2">{Number(metrics?.overdueFollowUps ?? 0)}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Unassigned (open)</h2>
          <p className="text-h2">{Number(metrics?.unassignedOpenLeads ?? 0)}</p>
        </article>
      </div>

      <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }} aria-labelledby="crm-followup-queue">
        <h2 id="crm-followup-queue" className="text-h3">
          Follow-up queue
        </h2>
        <ul className={layout.filterRow} style={{ listStyle: 'none', padding: 0, flexWrap: 'wrap' }}>
          <li>
            <Link className="link-underline" to={`${adminPortalPaths.crmLeadsList}?followUp=today`}>
              Due today ({Number(metrics?.todayFollowUps ?? 0)})
            </Link>
          </li>
          <li>
            <Link className="link-underline" to={`${adminPortalPaths.crmLeadsList}?followUp=overdue`}>
              Overdue ({Number(metrics?.overdueFollowUps ?? 0)})
            </Link>
          </li>
          <li>
            <Link className="link-underline" to={`${adminPortalPaths.crmLeadsList}?followUp=upcoming`}>
              Upcoming ({Number(metrics?.upcomingFollowUps ?? 0)})
            </Link>
          </li>
          <li>
            <Link className="link-underline" to={`${adminPortalPaths.crmLeadsList}?followUp=none`}>
              No follow-up ({Number(metrics?.leadsWithoutFollowUp ?? 0)})
            </Link>
          </li>
        </ul>
      </section>

      <div className={ui.cardGrid} style={{ marginTop: 'var(--space-4)' }}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Qualified</h2>
          <p className="text-h2">{byStatus.find((r) => r.status === 'qualified')?.c ?? 0}</p>
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
                      {lead.entryChannelLabel ? (
                        <CrmEntryChannelBadge label={String(lead.entryChannelLabel)} />
                      ) : null}
                      {lead.customerRequestReference ? (
                        <span className={ui.meta}>Ref. {String(lead.customerRequestReference)}</span>
                      ) : null}
                      <StatusPill status={String(lead.priority)} />
                      {lead.followUpLabel ? (
                        <span className={ui.meta}>{String(lead.followUpLabel)}</span>
                      ) : null}
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
  const { profile } = useAuth()
  const canAssign = Boolean(profile?.permissions.includes('leads.assign'))
  const canCreateProject = Boolean(profile?.permissions.includes('projects.create'))
  const canCreateProposal = Boolean(profile?.permissions.includes('proposals.create'))
  const { data, error, loading, reload } = useFetch(() => adminApi.leads.get(id), [id])
  const employeesQuery = useFetch(
    () => (canAssign ? adminApi.employees.list() : Promise.resolve({ items: [] })),
    [canAssign],
  )

  const lead = data?.lead as Record<string, unknown> | undefined

  const employees = useMemo(() => {
    const rows = (employeesQuery.data?.items as Array<Record<string, unknown>>) ?? []
    return rows
      .map((row) => {
        const emp = row.profile as Record<string, unknown>
        const user = row.user as Record<string, unknown>
        return {
          id: String(emp.id),
          label: String(user.fullName ?? user.email),
        }
      })
      .filter((e) => e.id)
  }, [employeesQuery.data])

  if (loading) return <ListSkeleton />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data || !lead) return null

  const notes = (data.notes as Array<Record<string, unknown>>) ?? []
  const activities = (data.activities as Array<Record<string, unknown>>) ?? []
  const interactions = (data.interactions as Array<Record<string, unknown>>) ?? []
  const proposals = (data.proposals as Array<Record<string, unknown>>) ?? []
  const duplicateHints = data.duplicateHints as Record<string, unknown> | undefined
  const linkedProject = data.linkedProject as Record<string, unknown> | null | undefined
  const isStartProject = lead.entryChannel === 'start_project'
  const intake = (lead.startProjectIntake as StartProjectIntakeView | null) ?? null
  const channelLabel = lead.entryChannelLabel ? String(lead.entryChannelLabel) : ''
  const introDesc = `${String(lead.company ?? lead.email)}${channelLabel ? ` · ${channelLabel}` : ''}`

  return (
    <>
      <PageIntro title={String(lead.name)} description={introDesc} />
      <div className={styles.statusRow}>
        <StatusPill status={String(lead.status)} />
        <StatusPill status={String(lead.priority)} />
        {channelLabel ? <CrmEntryChannelBadge label={channelLabel} /> : null}
      </div>

      {duplicateHints?.leadMatchId || duplicateHints?.customerMatchId ? (
        <p className={styles.duplicateBanner}>Possible duplicate — review before converting.</p>
      ) : null}

      <CrmSalesActionPanel
        key={String(lead.updatedAt ?? lead.id)}
        leadId={id}
        lead={lead}
        canAssign={canAssign}
        employees={employees}
        onUpdated={reload}
      />

      <CrmProjectFulfillmentPanel
        leadId={id}
        lead={lead}
        linkedProject={linkedProject}
        canCreate={canCreateProject}
        onUpdated={reload}
      />

      <CrmProposalFulfillmentPanel
        leadId={id}
        lead={lead}
        proposals={proposals}
        canCreate={canCreateProposal}
        onUpdated={reload}
      />

      {isStartProject ? (
        <CrmStartProjectLeadPanel lead={lead} intake={intake} />
      ) : (
        <>
          <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
            <h2 className="text-h3">Customer</h2>
            <p className={ui.meta}>
              {String(lead.email)}
              {lead.phone ? ` · ${String(lead.phone)}` : ''}
            </p>
            {lead.company ? <p className={ui.meta}>{String(lead.company)}</p> : null}
          </section>
          <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
            <h2 className="text-h3">Message</h2>
            <p>{String(lead.projectDescription)}</p>
          </section>
        </>
      )}

      {!isStartProject &&
      (lead.landingPath ||
        lead.pageSource ||
        lead.utmSource ||
        lead.referrerHost ||
        lead.businessCity ||
        lead.businessState ||
        lead.businessCountry ||
        lead.contactTimezone) ? (
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
        <h2 className="text-h3">Activity timeline</h2>
        <CrmActivityTimeline activities={activities} interactions={interactions} />
      </section>

      <section className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="text-h3">Internal notes history</h2>
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

      <p style={{ marginTop: 'var(--space-6)' }}>
        <Link className="link-underline" to={adminPortalPaths.crm}>
          Back to pipeline
        </Link>
      </p>
    </>
  )
}
