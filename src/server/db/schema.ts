import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  timezone: text("timezone").default("America/Lima").notNull(),
  currency: text("currency").default("PEN").notNull(),
  status: text("status").default("active").notNull(),
  ...timestamps,
});

export const sections = pgTable("sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  kind: text("kind").default("tower").notNull(),
  position: integer("position").default(0).notNull(),
  ...timestamps,
}, (table) => [index("sections_tenant_idx").on(table.tenantId)]);

export const units = pgTable("units", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }),
  code: text("code").notNull(),
  kind: text("kind").default("apartment").notNull(),
  floor: integer("floor"),
  status: text("status").default("active").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("units_tenant_code_uidx").on(table.tenantId, table.code),
  index("units_tenant_section_idx").on(table.tenantId, table.sectionId),
]);

export const unitLinks = pgTable("unit_links", {
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  parentUnitId: uuid("parent_unit_id").references(() => units.id, { onDelete: "cascade" }).notNull(),
  annexUnitId: uuid("annex_unit_id").references(() => units.id, { onDelete: "cascade" }).notNull(),
  relation: text("relation").default("annex").notNull(),
}, (table) => [primaryKey({ columns: [table.tenantId, table.parentUnitId, table.annexUnitId] })]);

export const people = pgTable("people", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  status: text("status").default("active").notNull(),
  ...timestamps,
});

export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  personId: uuid("person_id").references(() => people.id, { onDelete: "cascade" }).notNull(),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
  role: text("role").notNull(),
  permissions: jsonb("permissions").$type<string[]>().default([]).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow().notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("memberships_tenant_person_idx").on(table.tenantId, table.personId),
  index("memberships_tenant_unit_idx").on(table.tenantId, table.unitId),
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id").references(() => people.id, { onDelete: "cascade" }).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const financialEntries = pgTable("financial_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  concept: text("concept").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: text("currency").default("PEN").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  reversedEntryId: uuid("reversed_entry_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => [index("financial_entries_tenant_due_idx").on(table.tenantId, table.dueAt)]);

export const bankMovements = pgTable("bank_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  bankAccountRef: text("bank_account_ref").notNull(),
  operationRef: text("operation_ref").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex("bank_movement_unique_operation_uidx").on(table.tenantId, table.bankAccountRef, table.operationRef)]);

export const paymentReports = pgTable("payment_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "restrict" }).notNull(),
  reportedBy: uuid("reported_by").references(() => people.id, { onDelete: "restrict" }).notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  operationRef: text("operation_ref").notNull(),
  status: text("status").default("reported").notNull(),
  bankMovementId: uuid("bank_movement_id").references(() => bankMovements.id, { onDelete: "restrict" }),
  reviewedBy: uuid("reviewed_by").references(() => people.id, { onDelete: "restrict" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  note: text("note"),
  ...timestamps,
}, (table) => [index("payment_reports_tenant_status_idx").on(table.tenantId, table.status)]);

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  ownership: text("ownership").default("tenant").notNull(),
  state: text("state").default("operational").notNull(),
  warrantyEndsAt: timestamp("warranty_ends_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("assets_tenant_code_uidx").on(table.tenantId, table.code)]);

export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: text("status").default("scheduled").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  evidence: jsonb("evidence").$type<Array<{ name: string; url: string }>>().default([]).notNull(),
  ...timestamps,
}, (table) => [index("maintenance_tenant_schedule_idx").on(table.tenantId, table.scheduledAt)]);

export const amenities = pgTable("amenities", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  priceCents: bigint("price_cents", { mode: "number" }).default(0).notNull(),
  depositCents: bigint("deposit_cents", { mode: "number" }).default(0).notNull(),
  rules: jsonb("rules").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
});

export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  amenityId: uuid("amenity_id").references(() => amenities.id, { onDelete: "restrict" }).notNull(),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "restrict" }).notNull(),
  requestedBy: uuid("requested_by").references(() => people.id, { onDelete: "restrict" }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: text("status").default("requested").notNull(),
  rentalCents: bigint("rental_cents", { mode: "number" }).notNull(),
  depositCents: bigint("deposit_cents", { mode: "number" }).notNull(),
  depositState: text("deposit_state").default("pending").notNull(),
  ...timestamps,
}, (table) => [index("reservations_tenant_window_idx").on(table.tenantId, table.startsAt, table.endsAt)]);

export const assemblies = pgTable("assemblies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  modality: text("modality").notNull(),
  status: text("status").default("draft").notNull(),
  votingRules: jsonb("voting_rules").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
});

export const votes = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  assemblyId: uuid("assembly_id").references(() => assemblies.id, { onDelete: "cascade" }).notNull(),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "restrict" }).notNull(),
  representedBy: uuid("represented_by").references(() => people.id, { onDelete: "restrict" }).notNull(),
  choice: text("choice"),
  castAt: timestamp("cast_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex("votes_assembly_unit_uidx").on(table.tenantId, table.assemblyId, table.unitId)]);

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  storageKey: text("storage_key").notNull(),
  version: integer("version").default(1).notNull(),
  visibility: text("visibility").default("board").notNull(),
  checksum: text("checksum").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => people.id, { onDelete: "restrict" }).notNull(),
  ...timestamps,
}, (table) => [index("documents_tenant_category_idx").on(table.tenantId, table.category)]);

export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
  sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").default("normal").notNull(),
  status: text("status").default("open").notNull(),
  assignedTo: uuid("assigned_to").references(() => people.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => [index("incidents_tenant_status_idx").on(table.tenantId, table.status)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  personId: uuid("person_id").references(() => people.id, { onDelete: "cascade" }).notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  channel: text("channel").default("in_app").notNull(),
  state: text("state").default("pending").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [index("notifications_tenant_person_idx").on(table.tenantId, table.personId)]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "restrict" }).notNull().unique(),
  plan: text("plan").notNull(),
  state: text("state").default("trial").notNull(),
  billingCycle: text("billing_cycle").default("monthly").notNull(),
  billableUnits: integer("billable_units").notNull(),
  renewsAt: timestamp("renews_at", { withTimezone: true }),
  providerRef: text("provider_ref"),
  ...timestamps,
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "restrict" }).notNull(),
  actorId: uuid("actor_id").references(() => people.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  before: jsonb("before").$type<Record<string, unknown>>(),
  after: jsonb("after").$type<Record<string, unknown>>(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("audit_logs_tenant_time_idx").on(table.tenantId, table.occurredAt)]);
