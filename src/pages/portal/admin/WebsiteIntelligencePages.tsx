import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ListSkeleton,
  PageIntro,
  PortalError,
  StatusPill,
} from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { adminPortalPaths } from '@/config/admin-portal'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { Button } from '@/components/ui/Button'

type Dashboard = {
  websitesAudited: number
  auditsCompleted: number
  auditsRunning: number
  auditsFailed: number
  highOpportunityAudits: number
  averageHealthScore: number
  recentAudits: Array<{
    id: string
    targetUrl: string
    status: string
    overallScore: number | null
    opportunityLevel: string | null
    progressPhase: string | null
    companyName: string | null
    createdAt: string
  }>
}

export function WebsiteIntelligenceDashboardPage() {
  const [q, setQ] = useState('')
  const { data, error, loading, reload } = useFetch(
    () => adminApi.websiteIntelligence.dashboard(),
    [],
  )
  const {
    data: listData,
    loading: listLoading,
    reload: reloadList,
  } = useFetch(() => adminApi.websiteIntelligence.listAudits(q ? { q } : undefined), [q])

  if (loading) return <ListSkeleton rows={8} />
  if (error) return <PortalError message={error} onRetry={reload} />

  const dash = data as Dashboard
  const audits = (listData as { items?: Dashboard['recentAudits'] })?.items ?? dash?.recentAudits ?? []

  return (
    <>
      <PageIntro
        label="Internal R&D"
        title="Website Intelligence"
        description="Audit public websites for SEO, content, accessibility, and opportunity signals. Metrics are heuristic — not guaranteed rankings."
      />
      <div className={ui.cardGrid}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Websites</h2>
          <p className="text-h2">{dash.websitesAudited}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Completed</h2>
          <p className="text-h2">{dash.auditsCompleted}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Running / queued</h2>
          <p className="text-h2">{dash.auditsRunning}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Avg health score</h2>
          <p className="text-h2">{dash.averageHealthScore || '—'}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">High opportunity</h2>
          <p className="text-h2">{dash.highOpportunityAudits}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Failed</h2>
          <p className="text-h2">{dash.auditsFailed}</p>
        </article>
      </div>

      <div style={layoutRow}>
        <Link to={adminPortalPaths.websiteIntelligenceNew}>
          <Button type="button">Start new audit</Button>
        </Link>
        <input
          type="search"
          placeholder="Search host or URL"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search audits"
        />
        <Button type="button" variant="ghost" onClick={() => { reload(); reloadList() }}>
          Refresh
        </Button>
      </div>

      <ul className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
        {(listLoading ? [] : audits).map((audit) => (
          <li key={audit.id} className={`surface ${ui.dataCard}`}>
            <Link className="link-underline" to={adminPortalPaths.websiteIntelligenceAudit(audit.id)}>
              <strong>{audit.targetUrl}</strong>
            </Link>
            <span className={ui.meta}>
              {audit.companyName ? `${audit.companyName} · ` : ''}
              {new Date(audit.createdAt).toLocaleString()}
              {audit.progressPhase ? ` · ${audit.progressPhase}` : ''}
            </span>
            <div style={layoutRow}>
              <StatusPill status={audit.status} />
              {audit.overallScore != null ? (
                <span className={ui.meta}>Score: {audit.overallScore}</span>
              ) : null}
              {audit.opportunityLevel ? (
                <span className={ui.meta}>Opportunity: {audit.opportunityLevel}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

const layoutRow = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 'var(--space-3)',
  alignItems: 'center',
  marginTop: 'var(--space-6)',
}

export function WebsiteIntelligenceNewAuditPage() {
  const navigate = useNavigate()
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const result = (await adminApi.websiteIntelligence.createAudit({
        websiteUrl,
        companyName: companyName || undefined,
        country: country || undefined,
        city: city || undefined,
        notes: notes || undefined,
      })) as { auditId: string }
      navigate(adminPortalPaths.websiteIntelligenceAudit(result.auditId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start audit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageIntro title="New website audit" description="Enter a public HTTPS URL. Internal networks are blocked." />
      <form className={`surface ${ui.dataCard}`} onSubmit={(e) => void onSubmit(e)}>
        <div className={ui.form}>
          <div className={ui.field}>
            <label htmlFor="wi-url">Website URL</label>
            <input id="wi-url" required type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
          </div>
          <div className={ui.field}>
            <label htmlFor="wi-company">Company name (optional)</label>
            <input id="wi-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className={ui.field}>
            <label htmlFor="wi-country">Country (optional)</label>
            <input id="wi-country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className={ui.field}>
            <label htmlFor="wi-city">City (optional)</label>
            <input id="wi-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className={ui.field}>
            <label htmlFor="wi-notes">Notes (optional)</label>
            <textarea id="wi-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Starting…' : 'Start audit'}
          </Button>
        </div>
      </form>
    </>
  )
}

type AuditReport = {
  audit: {
    id: string
    targetUrl: string
    status: string
    progressPhase: string | null
    errorMessage: string | null
    overallScore: number | null
    categoryScores: Record<string, number | null>
    opportunityLevel: string | null
    opportunityScore: number | null
    createdAt: string
    completedAt: string | null
  }
  website: { companyName: string | null; normalizedHost: string }
  issues: Array<{
    id: string
    category: string
    severity: string
    title: string
    description: string
    recommendation: string
    affectedUrls: string[]
    evidence: Record<string, unknown>
  }>
  pages: Array<{ url: string; statusCode: number | null; title: string | null }>
  metrics: Array<{ category: string; metricKey: string; metricValue: string | null; measured: boolean }>
}

export function WebsiteIntelligenceReportPage() {
  const { id } = useParams()
  const { data, error, loading, reload } = useFetch(
    () => (id ? adminApi.websiteIntelligence.getAudit(id) : Promise.reject(new Error('Missing id'))),
    [id],
  )

  const status = (data as AuditReport | null)?.audit?.status
  useEffect(() => {
    if (!id || (status !== 'queued' && status !== 'running')) return
    const timer = window.setInterval(() => reload(), 4000)
    return () => window.clearInterval(timer)
  }, [id, status, reload])

  if (!id) return null
  if (loading && !data) return <ListSkeleton rows={10} />
  if (error) return <PortalError message={error} onRetry={reload} />
  if (!data) return null

  const report = data as AuditReport
  const { audit, issues, pages, metrics } = report
  const running = audit.status === 'queued' || audit.status === 'running'

  const bySeverity = ['critical', 'high', 'medium', 'low', 'informational'] as const

  return (
    <>
      <PageIntro
        title="Audit report"
        description={audit.targetUrl}
        label={report.website.companyName ?? report.website.normalizedHost}
      />
      <p className={ui.meta}>
        <StatusPill status={audit.status} />
        {audit.progressPhase ? ` · ${audit.progressPhase}` : ''}
        {running ? ' · Auto-refreshing…' : ''}
      </p>

      {audit.status === 'failed' && audit.errorMessage ? (
        <p role="alert">{audit.errorMessage}</p>
      ) : null}

      <div className={ui.cardGrid}>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Overall health</h2>
          <p className="text-h2">{audit.overallScore ?? '—'}</p>
        </article>
        <article className={`surface ${ui.dataCard}`}>
          <h2 className="text-h3">Opportunity</h2>
          <p className="text-h2">{audit.opportunityLevel ?? '—'}</p>
        </article>
      </div>

      <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="text-h2">Category scores</h2>
        <ul className={ui.stack}>
          {Object.entries(audit.categoryScores ?? {}).map(([key, value]) => (
            <li key={key} className={ui.meta}>
              {key}: {value === null ? 'Not measured' : `${value}/100`}
            </li>
          ))}
        </ul>
        {metrics
          .filter((m) => !m.measured)
          .map((m) => (
            <p key={`${m.category}-${m.metricKey}`} className={ui.meta}>
              {m.metricValue}
            </p>
          ))}
      </section>

      {bySeverity.map((severity) => {
        const group = issues.filter((i) => i.severity === severity)
        if (!group.length) return null
        return (
          <section key={severity} style={{ marginTop: 'var(--space-6)' }}>
            <h2 className="text-h2">{severity} issues ({group.length})</h2>
            <ul className={ui.stack}>
              {group.map((issue) => (
                <li key={issue.id} className={`surface ${ui.dataCard}`}>
                  <strong>{issue.title}</strong>
                  <p className={ui.meta}>{issue.description}</p>
                  <p className={ui.meta}>
                    <em>Recommendation:</em> {issue.recommendation}
                  </p>
                  {issue.affectedUrls?.length ? (
                    <details>
                      <summary className={ui.meta}>Affected URLs</summary>
                      <ul>
                        {issue.affectedUrls.map((u) => (
                          <li key={u}>{u}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 className="text-h2">Pages crawled ({pages.length})</h2>
        <ul className={ui.stack}>
          {pages.map((p) => (
            <li key={p.url} className={ui.meta}>
              {p.statusCode ?? '—'} · {p.title ?? 'Untitled'} · {p.url}
            </li>
          ))}
        </ul>
      </section>

      <p className={ui.meta} style={{ marginTop: 'var(--space-6)' }}>
        <Link to={adminPortalPaths.websiteIntelligence}>Back to dashboard</Link>
      </p>
    </>
  )
}
