import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  integer,
  numeric,
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const userStatusEnum = pgEnum('user_status', [
  'pending',
  'invited',
  'active',
  'inactive',
  'suspended',
  'disabled',
])
export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'qualified',
  'discovery',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'archived',
])
export const leadFollowUpStatusEnum = pgEnum('lead_follow_up_status', [
  'pending',
  'due',
  'completed',
  'missed',
  'cancelled',
])
export const leadLostReasonEnum = pgEnum('lead_lost_reason', [
  'price',
  'timing',
  'no_response',
  'competitor',
  'not_a_fit',
  'cancelled',
  'other',
])
export const projectStatusEnum = pgEnum('project_status', [
  'draft',
  'active',
  'on_hold',
  'completed',
  'cancelled',
])
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'blocked', 'done'])
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent'])
export const milestoneStatusEnum = pgEnum('milestone_status', [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
])
export const proposalStatusEnum = pgEnum('proposal_status', [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'declined',
  'changes_requested',
  'expired',
])
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'paid',
  'partial',
  'overdue',
  'void',
])
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
])
export const supportTicketStatusEnum = pgEnum('support_ticket_status', [
  'open',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
])
export const supportTicketPriorityEnum = pgEnum('support_ticket_priority', [
  'low',
  'medium',
  'high',
  'urgent',
])

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authUserId: uuid('auth_user_id'),
    email: text('email').notNull(),
    fullName: text('full_name'),
    /** Deprecated: credentials live in Supabase Auth only. */
    passwordHash: text('password_hash'),
    authProvider: text('auth_provider'),
    status: userStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
    uniqueIndex('users_auth_user_id_idx').on(table.authUserId),
  ],
)

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('roles_name_idx').on(table.name)],
)

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('permissions_name_idx').on(table.name)],
)

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
)

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index('user_roles_user_id_idx').on(table.userId),
  ],
)

export const customerProfiles = pgTable(
  'customer_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyName: text('company_name'),
    phone: text('phone'),
    jobTitle: text('job_title'),
    billingAddress: text('billing_address'),
    avatarStorageKey: text('avatar_storage_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('customer_profiles_user_id_idx').on(table.userId)],
)

export const employeeProfiles = pgTable(
  'employee_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    department: text('department'),
    jobTitle: text('job_title'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('employee_profiles_user_id_idx').on(table.userId)],
)

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customerProfiles.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description'),
    status: projectStatusEnum('status').notNull().default('draft'),
    service: text('service'),
    operationalPhase: text('operational_phase').notNull().default('discovery'),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    proposalId: uuid('proposal_id'),
    startDate: timestamp('start_date', { withTimezone: true }),
    expectedCompletion: timestamp('expected_completion', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('projects_customer_id_idx').on(table.customerId),
    index('projects_status_idx').on(table.status),
  ],
)

export const projectMembers = pgTable(
  'project_members',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employeeProfiles.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.employeeId] })],
)

export const milestones = pgTable(
  'milestones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    status: milestoneStatusEnum('status').notNull().default('planned'),
    sortOrder: integer('sort_order').notNull().default(0),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('milestones_project_id_idx').on(table.projectId)],
)

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    milestoneId: uuid('milestone_id').references(() => milestones.id, { onDelete: 'set null' }),
    assignedEmployeeId: uuid('assigned_employee_id').references(() => employeeProfiles.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    status: taskStatusEnum('status').notNull().default('todo'),
    priority: taskPriorityEnum('priority').notNull().default('medium'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('tasks_project_id_idx').on(table.projectId),
    index('tasks_assigned_employee_id_idx').on(table.assignedEmployeeId),
    index('tasks_status_idx').on(table.status),
  ],
)

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    company: text('company'),
    source: text('source').notNull().default('website'),
    serviceInterest: text('service_interest'),
    projectDescription: text('project_description').notNull(),
    website: text('website'),
    budget: text('budget'),
    timeline: text('timeline'),
    status: leadStatusEnum('status').notNull().default('new'),
    priority: taskPriorityEnum('priority').notNull().default('medium'),
    assignedEmployeeId: uuid('assigned_employee_id').references(() => employeeProfiles.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    followUpAt: timestamp('follow_up_at', { withTimezone: true }),
    followUpStatus: leadFollowUpStatusEnum('follow_up_status').default('pending'),
    lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
    lostReason: leadLostReasonEnum('lost_reason'),
    customerId: uuid('customer_id').references(() => customerProfiles.id, { onDelete: 'set null' }),
    possibleDuplicateOf: uuid('possible_duplicate_of'),
    landingPath: text('landing_path'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    referrerHost: text('referrer_host'),
    pageSource: text('page_source'),
    estimatedValue: numeric('estimated_value', { precision: 12, scale: 2 }),
    expectedCloseAt: timestamp('expected_close_at', { withTimezone: true }),
    salesNextAction: text('sales_next_action'),
    referralSource: text('referral_source'),
    qualificationBusinessType: text('qualification_business_type'),
    qualificationProjectSize: text('qualification_project_size'),
    qualificationUrgency: text('qualification_urgency'),
    qualificationDecisionMaker: text('qualification_decision_maker'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('leads_email_idx').on(table.email),
    index('leads_status_idx').on(table.status),
    index('leads_source_idx').on(table.source),
    index('leads_assigned_employee_id_idx').on(table.assignedEmployeeId),
    index('leads_follow_up_at_idx').on(table.followUpAt),
    index('leads_priority_idx').on(table.priority),
    index('leads_customer_id_idx').on(table.customerId),
    index('leads_page_source_idx').on(table.pageSource),
    index('leads_service_interest_idx').on(table.serviceInterest),
  ],
)

export const leadNotes = pgTable(
  'lead_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('lead_notes_lead_id_idx').on(table.leadId)],
)

export const leadActivities = pgTable(
  'lead_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    metadata: text('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('lead_activities_lead_id_idx').on(table.leadId)],
)

export const leadInteractions = pgTable(
  'lead_interactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    loggedByUserId: uuid('logged_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    interactionType: text('interaction_type').notNull(),
    summary: text('summary').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    nextAction: text('next_action'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('lead_interactions_lead_id_idx').on(table.leadId)],
)

export const proposals = pgTable(
  'proposals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id').references(() => customerProfiles.id, { onDelete: 'set null' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    title: text('title'),
    scope: text('scope'),
    deliverables: text('deliverables'),
    timeline: text('timeline'),
    terms: text('terms'),
    status: proposalStatusEnum('status').notNull().default('draft'),
    amount: numeric('amount', { precision: 12, scale: 2 }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    customerDecidedAt: timestamp('customer_decided_at', { withTimezone: true }),
    customerDecisionNote: text('customer_decision_note'),
    version: integer('version').notNull().default(1),
    revisedFromId: uuid('revised_from_id'),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }),
    discountNote: text('discount_note'),
    approvedForSendAt: timestamp('approved_for_send_at', { withTimezone: true }),
    approvedForSendBy: uuid('approved_for_send_by'),
    paymentSchedule: text('payment_schedule'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('proposals_status_idx').on(table.status)],
)

export const proposalLineItems = pgTable(
  'proposal_line_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
    unitAmount: numeric('unit_amount', { precision: 12, scale: 2 }).notNull(),
    itemType: text('item_type').notNull().default('service'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('proposal_line_items_proposal_id_idx').on(table.proposalId)],
)

export const recurringAgreements = pgTable(
  'recurring_agreements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customerProfiles.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    serviceCategory: text('service_category'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    billingInterval: text('billing_interval').notNull().default('monthly'),
    status: text('status').notNull().default('active'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    renewsAt: timestamp('renews_at', { withTimezone: true }),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('recurring_agreements_customer_id_idx').on(table.customerId),
    index('recurring_agreements_renews_at_idx').on(table.renewsAt),
  ],
)

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customerProfiles.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    proposalId: uuid('proposal_id').references(() => proposals.id, { onDelete: 'set null' }),
    invoiceNumber: text('invoice_number').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('invoices_number_idx').on(table.invoiceNumber),
    index('invoices_customer_id_idx').on(table.customerId),
    index('invoices_status_idx').on(table.status),
  ],
)

export const invoiceLineItems = pgTable(
  'invoice_line_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
    unitAmount: numeric('unit_amount', { precision: 12, scale: 2 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('invoice_line_items_invoice_id_idx').on(table.invoiceId)],
)

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customerProfiles.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    gatewayReference: text('gateway_reference'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('payments_invoice_id_idx').on(table.invoiceId),
    index('payments_customer_id_idx').on(table.customerId),
    index('payments_gateway_reference_idx').on(table.gatewayReference),
  ],
)

export const files = pgTable(
  'files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id').references(() => customerProfiles.id, { onDelete: 'set null' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    storageKey: text('storage_key').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    category: text('category').default('other'),
    visibility: text('visibility').notNull().default('internal'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('files_customer_id_idx').on(table.customerId),
    index('files_project_id_idx').on(table.projectId),
  ],
)

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    senderUserId: uuid('sender_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientUserId: uuid('recipient_user_id').references(() => users.id, { onDelete: 'set null' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('messages_project_id_idx').on(table.projectId)],
)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('notifications_user_id_idx').on(table.userId)],
)

export const supportTickets = pgTable(
  'support_tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customerProfiles.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    priority: supportTicketPriorityEnum('priority').notNull().default('medium'),
    status: supportTicketStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('support_tickets_customer_id_idx').on(table.customerId),
    index('support_tickets_status_idx').on(table.status),
  ],
)

export const supportTicketReplies = pgTable(
  'support_ticket_replies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => supportTickets.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    isStaff: boolean('is_staff').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('support_ticket_replies_ticket_id_idx').on(table.ticketId)],
)

export const proposalApprovals = pgTable(
  'proposal_approvals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customerProfiles.id, { onDelete: 'cascade' }),
    decision: text('decision').notNull(),
    note: text('note'),
    proposalStatusAtDecision: text('proposal_status_at_decision').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('proposal_approvals_proposal_id_idx').on(table.proposalId)],
)

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: uuid('entity_id'),
    metadata: text('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_entity_idx').on(table.entity, table.entityId),
    index('audit_logs_actor_user_id_idx').on(table.actorUserId),
  ],
)

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}))

export const leadsRelations = relations(leads, ({ one }) => ({
  assignedEmployee: one(employeeProfiles, {
    fields: [leads.assignedEmployeeId],
    references: [employeeProfiles.id],
  }),
}))
