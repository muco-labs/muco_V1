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
  foreignKey,
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
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'blocked', 'done', 'cancelled'])
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
  'cancelled',
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

export const customerConversationStatusEnum = pgEnum('customer_conversation_status', [
  'open',
  'closed',
])

export const customerMessageSenderTypeEnum = pgEnum('customer_message_sender_type', [
  'customer',
  'team',
])

export const employeeEmploymentStateEnum = pgEnum('employee_employment_state', [
  'onboarding',
  'active',
  'on_leave',
  'offboarded',
])

export const wiAuditStatusEnum = pgEnum('wi_audit_status', [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
])
export const wiIssueSeverityEnum = pgEnum('wi_issue_severity', [
  'critical',
  'high',
  'medium',
  'low',
  'informational',
])
export const wiIssueStatusEnum = pgEnum('wi_issue_status', [
  'open',
  'reviewed',
  'resolved',
  'ignored',
])
export const wiOpportunityLevelEnum = pgEnum('wi_opportunity_level', ['low', 'medium', 'high'])
export const wiAuditConfidenceEnum = pgEnum('wi_audit_confidence', ['high', 'medium', 'low'])

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authUserId: uuid('auth_user_id'),
    email: text('email').notNull(),
    fullName: text('full_name'),
    /** Public MUCO login identifier (CUS-*, EMP-*, FLT-*, ADM-*). Auth passwords remain in Supabase only. */
    mucoLoginId: text('muco_login_id'),
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
    uniqueIndex('users_muco_login_id_idx').on(table.mucoLoginId),
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
    employmentState: employeeEmploymentStateEnum('employment_state').notNull().default('active'),
    managerEmployeeId: uuid('manager_employee_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('employee_profiles_user_id_idx').on(table.userId),
    index('employee_profiles_manager_employee_id_idx').on(table.managerEmployeeId),
    index('employee_profiles_department_idx').on(table.department),
    foreignKey({
      columns: [table.managerEmployeeId],
      foreignColumns: [table.id],
    }).onDelete('set null'),
  ],
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
    assignedFreelancerId: uuid('assigned_freelancer_id').references(() => freelancerProfiles.id, {
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
    index('tasks_assigned_freelancer_id_idx').on(table.assignedFreelancerId),
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
    businessCity: text('business_city'),
    businessState: text('business_state'),
    businessCountry: text('business_country'),
    contactTimezone: text('contact_timezone'),
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
    index('leads_business_city_idx').on(table.businessCity),
    index('leads_business_state_idx').on(table.businessState),
    index('leads_business_country_idx').on(table.businessCountry),
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
    currency: text('currency').notNull().default('INR'),
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
    invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'restrict' }),
    proposalId: uuid('proposal_id').references(() => proposals.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customerProfiles.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('INR'),
    provider: text('provider').notNull().default('razorpay'),
    status: paymentStatusEnum('status').notNull().default('pending'),
    gatewayReference: text('gateway_reference'),
    signatureVerified: boolean('signature_verified').notNull().default(false),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('payments_invoice_id_idx').on(table.invoiceId),
    index('payments_proposal_id_idx').on(table.proposalId),
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
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('files_customer_id_idx').on(table.customerId),
    index('files_project_id_idx').on(table.projectId),
    index('files_status_idx').on(table.status),
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

export const customerConversations = pgTable(
  'customer_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customerProfiles.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    proposalId: uuid('proposal_id').references(() => proposals.id, { onDelete: 'set null' }),
    subject: text('subject').notNull(),
    status: customerConversationStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customer_conversations_customer_id_idx').on(table.customerId),
    index('customer_conversations_updated_at_idx').on(table.updatedAt),
    index('customer_conversations_project_id_idx').on(table.projectId),
    index('customer_conversations_lead_id_idx').on(table.leadId),
    index('customer_conversations_proposal_id_idx').on(table.proposalId),
  ],
)

export const customerConversationMessages = pgTable(
  'customer_conversation_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => customerConversations.id, { onDelete: 'cascade' }),
    senderType: customerMessageSenderTypeEnum('sender_type').notNull(),
    senderUserId: uuid('sender_user_id').references(() => users.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    customerVisible: boolean('customer_visible').notNull().default(true),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customer_conversation_messages_conversation_id_idx').on(table.conversationId),
    index('customer_conversation_messages_created_at_idx').on(table.createdAt),
  ],
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

export const productOrgStatusEnum = pgEnum('product_org_status', ['active', 'suspended'])
export const productOrgMemberRoleEnum = pgEnum('product_org_member_role', [
  'owner',
  'admin',
  'member',
])

export const productWaitlist = pgTable(
  'product_waitlist',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productSlug: text('product_slug').notNull(),
    email: text('email').notNull(),
    fullName: text('full_name'),
    company: text('company'),
    useCase: text('use_case'),
    marketingConsent: boolean('marketing_consent').notNull().default(false),
    sourcePath: text('source_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('product_waitlist_product_email_idx').on(table.productSlug, table.email),
    index('product_waitlist_product_slug_idx').on(table.productSlug),
    index('product_waitlist_created_at_idx').on(table.createdAt),
  ],
)

export const productOrganizations = pgTable(
  'product_organizations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    status: productOrgStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('product_organizations_slug_idx').on(table.slug)],
)

export const productOrganizationMembers = pgTable(
  'product_organization_members',
  {
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => productOrganizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: productOrgMemberRoleEnum('role').notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId] }),
    index('product_organization_members_user_id_idx').on(table.userId),
  ],
)

export const wiWebsites = pgTable(
  'wi_websites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    normalizedHost: text('normalized_host').notNull(),
    companyName: text('company_name'),
    country: text('country'),
    city: text('city'),
    notes: text('notes'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('wi_websites_normalized_host_idx').on(table.normalizedHost)],
)

export const wiAudits = pgTable(
  'wi_audits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    websiteId: uuid('website_id')
      .notNull()
      .references(() => wiWebsites.id, { onDelete: 'cascade' }),
    targetUrl: text('target_url').notNull(),
    normalizedUrl: text('normalized_url').notNull(),
    status: wiAuditStatusEnum('status').notNull().default('queued'),
    progressPhase: text('progress_phase'),
    errorMessage: text('error_message'),
    overallScore: integer('overall_score'),
    categoryScores: text('category_scores'),
    opportunityLevel: wiOpportunityLevelEnum('opportunity_level'),
    opportunityScore: integer('opportunity_score'),
    pagesDiscovered: integer('pages_discovered'),
    pagesCrawled: integer('pages_crawled'),
    auditConfidence: wiAuditConfidenceEnum('audit_confidence'),
    coverageNote: text('coverage_note'),
    crawlLimitations: text('crawl_limitations'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('wi_audits_website_id_idx').on(table.websiteId),
    index('wi_audits_status_idx').on(table.status),
    index('wi_audits_created_at_idx').on(table.createdAt),
  ],
)

export const wiAuditPages = pgTable(
  'wi_audit_pages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    auditId: uuid('audit_id')
      .notNull()
      .references(() => wiAudits.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    statusCode: integer('status_code'),
    title: text('title'),
    metaDescription: text('meta_description'),
    canonical: text('canonical'),
    h1Texts: text('h1_texts'),
    headings: text('headings'),
    wordCount: integer('word_count'),
    internalLinks: text('internal_links'),
    externalLinks: text('external_links'),
    imageCount: integer('image_count'),
    imagesMissingAlt: integer('images_missing_alt'),
    robotsNoindex: boolean('robots_noindex').notNull().default(false),
    htmlLang: text('html_lang'),
    viewportMeta: boolean('viewport_meta').notNull().default(false),
    ogPresent: boolean('og_present').notNull().default(false),
    twitterCardPresent: boolean('twitter_card_present').notNull().default(false),
    structuredDataTypes: text('structured_data_types'),
    contentType: text('content_type'),
    responseTimeMs: integer('response_time_ms'),
    crawledAt: timestamp('crawled_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('wi_audit_pages_audit_id_idx').on(table.auditId),
    uniqueIndex('wi_audit_pages_audit_url_idx').on(table.auditId, table.url),
  ],
)

export const wiAuditIssues = pgTable(
  'wi_audit_issues',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    auditId: uuid('audit_id')
      .notNull()
      .references(() => wiAudits.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    severity: wiIssueSeverityEnum('severity').notNull(),
    status: wiIssueStatusEnum('status').notNull().default('open'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    affectedUrls: text('affected_urls'),
    evidence: text('evidence'),
    recommendation: text('recommendation'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('wi_audit_issues_audit_id_idx').on(table.auditId),
    index('wi_audit_issues_severity_idx').on(table.severity),
  ],
)

export const wiAuditMetrics = pgTable(
  'wi_audit_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    auditId: uuid('audit_id')
      .notNull()
      .references(() => wiAudits.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    metricKey: text('metric_key').notNull(),
    metricValue: text('metric_value'),
    measured: boolean('measured').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('wi_audit_metrics_audit_id_idx').on(table.auditId)],
)

export const wiAuditEvents = pgTable(
  'wi_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    auditId: uuid('audit_id')
      .notNull()
      .references(() => wiAudits.id, { onDelete: 'cascade' }),
    event: text('event').notNull(),
    detail: text('detail'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('wi_audit_events_audit_id_idx').on(table.auditId)],
)

export const careerJobStatusEnum = pgEnum('career_job_status', ['draft', 'published', 'closed'])
export const careerEmploymentTypeEnum = pgEnum('career_employment_type', [
  'full_time',
  'part_time',
  'internship',
  'contract',
])
export const careerApplicationTypeEnum = pgEnum('career_application_type', [
  'full_time',
  'part_time',
  'internship',
  'contract',
  'general',
])
export const careerApplicationStatusEnum = pgEnum('career_application_status', [
  'new',
  'reviewing',
  'shortlisted',
  'interview',
  'selected',
  'rejected',
  'archived',
])

export const careerJobOpenings = pgTable(
  'career_job_openings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    department: text('department').notNull(),
    employmentType: careerEmploymentTypeEnum('employment_type').notNull(),
    experienceLevel: text('experience_level'),
    locationLabel: text('location_label'),
    remoteStatus: text('remote_status'),
    shortDescription: text('short_description').notNull(),
    responsibilities: text('responsibilities').notNull(),
    requiredSkills: text('required_skills').notNull(),
    preferredSkills: text('preferred_skills'),
    status: careerJobStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    closesAt: timestamp('closes_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('career_job_openings_slug_idx').on(table.slug),
    index('career_job_openings_status_idx').on(table.status),
  ],
)

export const careerApplications = pgTable(
  'career_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobOpeningId: uuid('job_opening_id').references(() => careerJobOpenings.id, {
      onDelete: 'set null',
    }),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    city: text('city'),
    country: text('country'),
    roleInterest: text('role_interest').notNull(),
    applicationType: careerApplicationTypeEnum('application_type').notNull(),
    experienceLevel: text('experience_level'),
    skills: text('skills').notNull(),
    portfolioUrl: text('portfolio_url'),
    linkedinUrl: text('linkedin_url'),
    githubUrl: text('github_url'),
    introduction: text('introduction').notNull(),
    availability: text('availability').notNull(),
    preferredEngagement: text('preferred_engagement'),
    additionalInfo: text('additional_info'),
    resumeStorageKey: text('resume_storage_key'),
    resumeFileName: text('resume_file_name'),
    resumeMimeType: text('resume_mime_type'),
    resumeFileSizeBytes: integer('resume_file_size_bytes'),
    status: careerApplicationStatusEnum('status').notNull().default('new'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('career_applications_status_idx').on(table.status),
    index('career_applications_email_idx').on(table.email),
    index('career_applications_created_at_idx').on(table.createdAt),
    index('career_applications_job_opening_id_idx').on(table.jobOpeningId),
  ],
)

export const careerApplicationNotes = pgTable(
  'career_application_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => careerApplications.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('career_application_notes_application_id_idx').on(table.applicationId)],
)

export const freelancerVerificationStatusEnum = pgEnum('freelancer_verification_status', [
  'pending',
  'verified',
  'failed',
])

export const freelancerApprovalStatusEnum = pgEnum('freelancer_approval_status', [
  'under_review',
  'approved',
  'rejected',
  'suspended',
])

export const freelancerAvailabilityStatusEnum = pgEnum('freelancer_availability_status', [
  'available',
  'limited',
  'unavailable',
])

export const freelancerPricingTypeEnum = pgEnum('freelancer_pricing_type', [
  'fixed',
  'starting_from',
  'hourly',
  'per_project',
  'custom_quote',
])

export const freelancerProfiles = pgTable(
  'freelancer_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    country: text('country'),
    city: text('city'),
    professionalRole: text('professional_role').notNull(),
    experienceLevel: text('experience_level'),
    headline: text('headline'),
    bio: text('bio'),
    skills: text('skills').notNull(),
    serviceCategories: text('service_categories').notNull(),
    portfolioUrls: text('portfolio_urls'),
    preferredProjectType: text('preferred_project_type'),
    availabilityNote: text('availability_note'),
    openToProjects: boolean('open_to_projects').notNull().default(true),
    verificationStatus: freelancerVerificationStatusEnum('verification_status')
      .notNull()
      .default('pending'),
    approvalStatus: freelancerApprovalStatusEnum('approval_status')
      .notNull()
      .default('under_review'),
    availabilityStatus: freelancerAvailabilityStatusEnum('availability_status')
      .notNull()
      .default('unavailable'),
    availabilityUpdatedAt: timestamp('availability_updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('freelancer_profiles_approval_status_idx').on(table.approvalStatus),
    index('freelancer_profiles_verification_status_idx').on(table.verificationStatus),
  ],
)

export const freelancerInternalNotes = pgTable(
  'freelancer_internal_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    freelancerId: uuid('freelancer_id')
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('freelancer_internal_notes_freelancer_id_idx').on(table.freelancerId)],
)

export const freelancerServices = pgTable(
  'freelancer_services',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    freelancerId: uuid('freelancer_id')
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: 'cascade' }),
    serviceSlug: text('service_slug').notNull(),
    subServiceSlug: text('sub_service_slug'),
    description: text('description'),
    experienceLevel: text('experience_level'),
    pricingType: freelancerPricingTypeEnum('pricing_type').notNull().default('custom_quote'),
    basePrice: numeric('base_price', { precision: 12, scale: 2 }),
    minimumPrice: numeric('minimum_price', { precision: 12, scale: 2 }),
    currency: text('currency').notNull().default('INR'),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('freelancer_services_freelancer_id_idx').on(table.freelancerId),
    index('freelancer_services_service_slug_idx').on(table.serviceSlug),
  ],
)

export const freelancerSkills = pgTable(
  'freelancer_skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    freelancerId: uuid('freelancer_id')
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: 'cascade' }),
    serviceSlug: text('service_slug').notNull(),
    skillSlug: text('skill_slug').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('freelancer_skills_freelancer_id_idx').on(table.freelancerId)],
)

export const projectFreelancers = pgTable(
  'project_freelancers',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    freelancerId: uuid('freelancer_id')
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.freelancerId] }),
    index('project_freelancers_freelancer_id_idx').on(table.freelancerId),
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
