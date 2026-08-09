import type { FormEvent } from 'react'
import { useState } from 'react'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import layout from '@/layouts/EmployeeAppLayout.module.css'
import { CRM_INTERACTION_TYPES } from '@/lib/crm/activity-labels'
import { leadStatusOptions } from '@/config/admin-portal'
import { Button } from '@/components/ui/Button'
import { adminApi } from '@/services/admin-portal'
import { ApiError } from '@/services/api'
import styles from './CrmSalesActionPanel.module.css'

type EmployeeOption = { id: string; label: string }

type CrmSalesActionPanelProps = {
  leadId: string
  lead: Record<string, unknown>
  canAssign: boolean
  employees: EmployeeOption[]
  onUpdated: () => void
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function CrmSalesActionPanel({
  leadId,
  lead,
  canAssign,
  employees,
  onUpdated,
}: CrmSalesActionPanelProps) {
  const [statusDraft, setStatusDraft] = useState(String(lead.status ?? 'new'))
  const [followUpAt, setFollowUpAt] = useState(toDatetimeLocalValue(String(lead.followUpAt ?? '')))
  const [nextAction, setNextAction] = useState(String(lead.salesNextAction ?? ''))
  const [assigneeId, setAssigneeId] = useState(String(lead.assignedEmployeeId ?? ''))
  const [interactionType, setInteractionType] = useState<string>('call')
  const [interactionSummary, setInteractionSummary] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function run(action: () => Promise<unknown>) {
    setSaving(true)
    try {
      await action()
      onUpdated()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`surface ${styles.panel}`} aria-labelledby="crm-sales-action">
      <h2 id="crm-sales-action" className="text-h3">
        Sales action
      </h2>
      <dl className={styles.summary}>
        <div>
          <dt>Current status</dt>
          <dd>{String(lead.status ?? '—').replace(/_/g, ' ')}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{lead.assignedName ? String(lead.assignedName) : 'Unassigned'}</dd>
        </div>
        <div>
          <dt>Last activity</dt>
          <dd>
            {lead.lastActivityAt
              ? new Date(String(lead.lastActivityAt)).toLocaleString()
              : lead.lastContactedAt
                ? new Date(String(lead.lastContactedAt)).toLocaleString()
                : '—'}
          </dd>
        </div>
        <div>
          <dt>Next follow-up</dt>
          <dd>{lead.followUpLabel ? String(lead.followUpLabel) : 'No follow-up scheduled'}</dd>
        </div>
        <div>
          <dt>Next action</dt>
          <dd>{lead.salesNextAction ? String(lead.salesNextAction) : '—'}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <div className={layout.filterRow}>
          <label className={ui.field} htmlFor="crm-status-update">
            <span className={ui.meta}>Update status</span>
            <select
              id="crm-status-update"
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value)}
            >
              {leadStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" disabled={saving} onClick={() => void run(() => adminApi.leads.update(leadId, { status: statusDraft }))}>
            Save status
          </Button>
        </div>

        <div className={layout.filterRow}>
          <label className={ui.field} htmlFor="crm-follow-up-at">
            <span className={ui.meta}>Schedule follow-up</span>
            <input
              id="crm-follow-up-at"
              type="datetime-local"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
            />
          </label>
          <Button
            type="button"
            disabled={saving || !followUpAt}
            onClick={() =>
              void run(() =>
                adminApi.leads.scheduleFollowUp(leadId, {
                  followUpAt: new Date(followUpAt).toISOString(),
                }),
              )
            }
          >
            Schedule
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() =>
              void run(() => adminApi.leads.update(leadId, { followUpAt: null }))
            }
          >
            Clear
          </Button>
        </div>

        <div className={layout.filterRow}>
          <label className={ui.field} htmlFor="crm-next-action">
            <span className={ui.meta}>Next action (internal)</span>
            <input
              id="crm-next-action"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              maxLength={500}
            />
          </label>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void run(() => adminApi.leads.update(leadId, { salesNextAction: nextAction }))}
          >
            Save next action
          </Button>
        </div>

        {canAssign && employees.length > 0 ? (
          <div className={layout.filterRow}>
            <label className={ui.field} htmlFor="crm-assignee">
              <span className={ui.meta}>Assign owner</span>
              <select
                id="crm-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.label}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              disabled={saving}
              onClick={() =>
                void run(async () => {
                  if (assigneeId) {
                    await adminApi.leads.assign(leadId, assigneeId)
                  } else {
                    await adminApi.leads.update(leadId, { assignedEmployeeId: null })
                  }
                })
              }
            >
              Update owner
            </Button>
          </div>
        ) : null}

        <form
          className={ui.form}
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await adminApi.leads.logInteraction(leadId, {
                interactionType,
                summary: interactionSummary,
              })
              setInteractionSummary('')
            })
          }}
        >
          <div className={layout.filterRow}>
            <label className={ui.field} htmlFor="crm-interaction-type">
              <span className={ui.meta}>Record interaction</span>
              <select
                id="crm-interaction-type"
                value={interactionType}
                onChange={(e) => setInteractionType(e.target.value)}
              >
                {CRM_INTERACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <input
              placeholder="Summary"
              aria-label="Interaction summary"
              value={interactionSummary}
              onChange={(e) => setInteractionSummary(e.target.value)}
              required
            />
            <Button type="submit" disabled={saving || !interactionSummary.trim()}>
              Log
            </Button>
          </div>
        </form>

        <form
          className={ui.form}
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            void run(async () => {
              await adminApi.leads.addNote(leadId, note)
              setNote('')
            })
          }}
        >
          <div className={ui.field}>
            <label htmlFor="crm-internal-note">Add internal note</label>
            <textarea id="crm-internal-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving || !note.trim()}>
            Save note
          </Button>
        </form>
      </div>
    </section>
  )
}
