import ui from '@/components/portal/CustomerPortalUi.module.css'
import styles from './CrmStartProjectLeadPanel.module.css'

export type StartProjectIntakeView = {
  primaryServiceSlug: string | null
  additionalServiceSlugs: string[]
  additionalServices: string[]
  budgetPreference: string | null
  timelinePreference: string | null
  existingUrl: string | null
}

type CrmStartProjectLeadPanelProps = {
  lead: Record<string, unknown>
  intake: StartProjectIntakeView | null
}

function locationLine(lead: Record<string, unknown>): string | null {
  const parts = [lead.businessCity, lead.businessState, lead.businessCountry].filter(Boolean)
  return parts.length ? parts.map(String).join(', ') : null
}

export function CrmStartProjectLeadPanel({ lead, intake }: CrmStartProjectLeadPanelProps) {
  const location = locationLine(lead)

  return (
    <>
      <section className={styles.section} aria-labelledby="crm-customer">
        <h2 id="crm-customer" className="text-h3">
          Customer
        </h2>
        <dl className={styles.dl}>
          <div>
            <dt>Name</dt>
            <dd>{String(lead.name ?? '—')}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a className="link-underline" href={`mailto:${String(lead.email)}`}>
                {String(lead.email)}
              </a>
            </dd>
          </div>
          {lead.phone ? (
            <div>
              <dt>Phone</dt>
              <dd>{String(lead.phone)}</dd>
            </div>
          ) : null}
          {lead.company ? (
            <div>
              <dt>Company</dt>
              <dd>{String(lead.company)}</dd>
            </div>
          ) : null}
          {lead.website ? (
            <div>
              <dt>Website</dt>
              <dd>
                <a className="link-underline" href={String(lead.website)} rel="noopener noreferrer">
                  {String(lead.website)}
                </a>
              </dd>
            </div>
          ) : null}
          {location ? (
            <div>
              <dt>Location</dt>
              <dd>{location}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="crm-project">
        <h2 id="crm-project" className="text-h3">
          Project
        </h2>
        <dl className={styles.dl}>
          <div>
            <dt>Primary service</dt>
            <dd>{String(lead.serviceInterest ?? '—')}</dd>
          </div>
          {intake?.additionalServices?.length ? (
            <div>
              <dt>Additional services</dt>
              <dd>{intake.additionalServices.join(', ')}</dd>
            </div>
          ) : null}
          {lead.budget ? (
            <div>
              <dt>Budget</dt>
              <dd>{String(lead.budget)}</dd>
            </div>
          ) : null}
          {lead.timeline ? (
            <div>
              <dt>Timeline</dt>
              <dd>{String(lead.timeline)}</dd>
            </div>
          ) : null}
          {intake?.existingUrl ? (
            <div>
              <dt>Existing URL</dt>
              <dd>
                <a className="link-underline" href={intake.existingUrl} rel="noopener noreferrer">
                  {intake.existingUrl}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
        <h3 className={styles.subhead}>Requirement</h3>
        <p className={styles.requirement}>{String(lead.projectDescription ?? '')}</p>
      </section>

      <section className={styles.section} aria-labelledby="crm-source">
        <h2 id="crm-source" className="text-h3">
          Source
        </h2>
        <dl className={styles.dl}>
          <div>
            <dt>Lead source</dt>
            <dd>{String(lead.sourceLabel ?? lead.source ?? '—')}</dd>
          </div>
          <div>
            <dt>Page source</dt>
            <dd>{String(lead.pageSource ?? '—')}</dd>
          </div>
          {lead.customerRequestReference ? (
            <div>
              <dt>Customer reference</dt>
              <dd>{String(lead.customerRequestReference)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Submitted</dt>
            <dd>
              <time dateTime={String(lead.createdAt)}>
                {new Date(String(lead.createdAt)).toLocaleString()}
              </time>
            </dd>
          </div>
          {lead.updatedAt ? (
            <div>
              <dt>Last updated</dt>
              <dd>
                <time dateTime={String(lead.updatedAt)}>
                  {new Date(String(lead.updatedAt)).toLocaleString()}
                </time>
              </dd>
            </div>
          ) : null}
        </dl>
        {lead.customerId ? (
          <p className={ui.meta}>Linked customer account: yes (portal access)</p>
        ) : (
          <p className={ui.meta}>No customer portal account linked yet.</p>
        )}
      </section>
    </>
  )
}

export function CrmEntryChannelBadge({ label }: { label: string }) {
  return (
    <span className={styles.entryBadge} aria-label={`Entry channel: ${label}`}>
      {label}
    </span>
  )
}
