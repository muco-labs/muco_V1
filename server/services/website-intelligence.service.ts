import { and, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  wiAuditEvents,
  wiAuditIssues,
  wiAuditMetrics,
  wiAuditPages,
  wiAudits,
  wiWebsites,
} from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { validatePublicHttpUrl } from '../lib/website-intelligence/url-security.js'
import type { CreateWebsiteAuditInput } from '../lib/validation/website-intelligence.js'
import { scheduleWebsiteAuditJob } from './website-intelligence.runner.js'

export async function getWebsiteIntelligenceDashboard() {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [websites] = await db.select({ c: count() }).from(wiWebsites)
  const [completed] = await db
    .select({ c: count() })
    .from(wiAudits)
    .where(eq(wiAudits.status, 'completed'))
  const [running] = await db
    .select({ c: count() })
    .from(wiAudits)
    .where(inArray(wiAudits.status, ['queued', 'running']))
  const [failed] = await db.select({ c: count() }).from(wiAudits).where(eq(wiAudits.status, 'failed'))
  const [highOpp] = await db
    .select({ c: count() })
    .from(wiAudits)
    .where(eq(wiAudits.opportunityLevel, 'high'))

  const [avgScore] = await db
    .select({ avg: sql<number>`coalesce(avg(${wiAudits.overallScore}), 0)` })
    .from(wiAudits)
    .where(eq(wiAudits.status, 'completed'))

  const recent = await db
    .select({
      audit: wiAudits,
      website: wiWebsites,
    })
    .from(wiAudits)
    .innerJoin(wiWebsites, eq(wiAudits.websiteId, wiWebsites.id))
    .orderBy(desc(wiAudits.createdAt))
    .limit(20)

  return {
    websitesAudited: websites?.c ?? 0,
    auditsCompleted: completed?.c ?? 0,
    auditsRunning: running?.c ?? 0,
    auditsFailed: failed?.c ?? 0,
    highOpportunityAudits: highOpp?.c ?? 0,
    averageHealthScore: Math.round(Number(avgScore?.avg ?? 0)),
    recentAudits: recent.map((row) => ({
      id: row.audit.id,
      targetUrl: row.audit.targetUrl,
      status: row.audit.status,
      overallScore: row.audit.overallScore,
      opportunityLevel: row.audit.opportunityLevel,
      progressPhase: row.audit.progressPhase,
      companyName: row.website.companyName,
      normalizedHost: row.website.normalizedHost,
      createdAt: row.audit.createdAt.toISOString(),
    })),
  }
}

export async function listWebsiteAudits(filters?: { q?: string; status?: string }) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const conditions = []
  if (filters?.status) {
    conditions.push(eq(wiAudits.status, filters.status as typeof wiAudits.$inferSelect.status))
  }
  if (filters?.q?.trim()) {
    const q = `%${filters.q.trim()}%`
    conditions.push(
      or(ilike(wiWebsites.normalizedHost, q), ilike(wiAudits.targetUrl, q), ilike(wiWebsites.companyName, q)),
    )
  }

  const rows = await db
    .select({
      audit: wiAudits,
      website: wiWebsites,
      issueCount: count(wiAuditIssues.id),
    })
    .from(wiAudits)
    .innerJoin(wiWebsites, eq(wiAudits.websiteId, wiWebsites.id))
    .leftJoin(wiAuditIssues, eq(wiAuditIssues.auditId, wiAudits.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(wiAudits.id, wiWebsites.id)
    .orderBy(desc(wiAudits.createdAt))
    .limit(100)

  return rows.map((row) => ({
    id: row.audit.id,
    targetUrl: row.audit.targetUrl,
    normalizedHost: row.website.normalizedHost,
    companyName: row.website.companyName,
    status: row.audit.status,
    overallScore: row.audit.overallScore,
    opportunityLevel: row.audit.opportunityLevel,
    issueCount: Number(row.issueCount),
    createdAt: row.audit.createdAt.toISOString(),
    completedAt: row.audit.completedAt?.toISOString() ?? null,
  }))
}

export async function createWebsiteAudit(
  userId: string,
  input: CreateWebsiteAuditInput,
): Promise<{ auditId: string }> {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const validated = validatePublicHttpUrl(input.websiteUrl)
  if (!validated.ok) {
    throw new AppError('VALIDATION_ERROR', validated.error, 400)
  }

  const normalizedUrl = validated.url.toString()
  const host = validated.url.hostname.toLowerCase()

  const existing = await db
    .select()
    .from(wiWebsites)
    .where(eq(wiWebsites.normalizedHost, host))
    .limit(1)

  let siteId: string
  if (existing[0]) {
    siteId = existing[0].id
    await db
      .update(wiWebsites)
      .set({
        companyName: input.companyName?.trim() || existing[0].companyName,
        country: input.country?.trim() || existing[0].country,
        city: input.city?.trim() || existing[0].city,
        notes: input.notes?.trim() || existing[0].notes,
      })
      .where(eq(wiWebsites.id, existing[0].id))
  } else {
    const [inserted] = await db
      .insert(wiWebsites)
      .values({
        normalizedHost: host,
        companyName: input.companyName?.trim() || null,
        country: input.country?.trim() || null,
        city: input.city?.trim() || null,
        notes: input.notes?.trim() || null,
        createdByUserId: userId,
      })
      .returning({ id: wiWebsites.id })
    siteId = inserted.id
  }

  const [audit] = await db
    .insert(wiAudits)
    .values({
      websiteId: siteId,
      targetUrl: input.websiteUrl.trim(),
      normalizedUrl,
      status: 'queued',
      progressPhase: 'Queued',
      createdByUserId: userId,
    })
    .returning({ id: wiAudits.id })

  scheduleWebsiteAuditJob(audit.id)
  return { auditId: audit.id }
}

export async function getWebsiteAuditReport(auditId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [row] = await db
    .select({ audit: wiAudits, website: wiWebsites })
    .from(wiAudits)
    .innerJoin(wiWebsites, eq(wiAudits.websiteId, wiWebsites.id))
    .where(eq(wiAudits.id, auditId))
    .limit(1)

  if (!row) throw new AppError('NOT_FOUND', 'Audit not found.', 404)

  const pages = await db.select().from(wiAuditPages).where(eq(wiAuditPages.auditId, auditId))
  const issues = await db
    .select()
    .from(wiAuditIssues)
    .where(eq(wiAuditIssues.auditId, auditId))
    .orderBy(desc(wiAuditIssues.createdAt))
  const metrics = await db.select().from(wiAuditMetrics).where(eq(wiAuditMetrics.auditId, auditId))
  const events = await db
    .select()
    .from(wiAuditEvents)
    .where(eq(wiAuditEvents.auditId, auditId))
    .orderBy(desc(wiAuditEvents.createdAt))
    .limit(50)

  let categoryScores: Record<string, number | null> = {}
  try {
    categoryScores = row.audit.categoryScores
      ? (JSON.parse(row.audit.categoryScores) as Record<string, number | null>)
      : {}
  } catch {
    categoryScores = {}
  }

  return {
    audit: {
      id: row.audit.id,
      targetUrl: row.audit.targetUrl,
      normalizedUrl: row.audit.normalizedUrl,
      status: row.audit.status,
      progressPhase: row.audit.progressPhase,
      errorMessage: row.audit.errorMessage,
      overallScore: row.audit.overallScore,
      categoryScores,
      opportunityLevel: row.audit.opportunityLevel,
      opportunityScore: row.audit.opportunityScore,
      createdAt: row.audit.createdAt.toISOString(),
      startedAt: row.audit.startedAt?.toISOString() ?? null,
      completedAt: row.audit.completedAt?.toISOString() ?? null,
    },
    website: {
      normalizedHost: row.website.normalizedHost,
      companyName: row.website.companyName,
      country: row.website.country,
      city: row.website.city,
      notes: row.website.notes,
    },
    pages: pages.map((p) => ({
      id: p.id,
      url: p.url,
      statusCode: p.statusCode,
      title: p.title,
      metaDescription: p.metaDescription,
      wordCount: p.wordCount,
      imagesMissingAlt: p.imagesMissingAlt,
      responseTimeMs: p.responseTimeMs,
    })),
    issues: issues.map((i) => ({
      id: i.id,
      category: i.category,
      severity: i.severity,
      status: i.status,
      title: i.title,
      description: i.description,
      affectedUrls: i.affectedUrls ? JSON.parse(i.affectedUrls) : [],
      evidence: i.evidence ? JSON.parse(i.evidence) : {},
      recommendation: i.recommendation,
    })),
    metrics,
    events: events.map((e) => ({
      event: e.event,
      detail: e.detail,
      createdAt: e.createdAt.toISOString(),
    })),
  }
}

export async function cancelWebsiteAudit(auditId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [updated] = await db
    .update(wiAudits)
    .set({ status: 'cancelled', progressPhase: 'Cancelled', completedAt: new Date() })
    .where(and(eq(wiAudits.id, auditId), inArray(wiAudits.status, ['queued', 'running'])))
    .returning({ id: wiAudits.id })

  if (!updated) throw new AppError('VALIDATION_ERROR', 'Audit cannot be cancelled.', 400)
}
