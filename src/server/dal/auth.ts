import "server-only";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { database } from "@/server/db/client";
import { memberships, people, tenants, units } from "@/server/db/schema";
import type { SessionPayload } from "@/server/auth/session";
import type { AuthorizationContext } from "@/server/auth/permissions";
import type { Permission } from "@/domain/models";

const knownPermissions = new Set<Permission>([
  "finances:view", "payments:review", "people:manage", "unit:pay", "unit:incidents", "assemblies:vote",
]);

export type AuthenticatedTenant = AuthorizationContext & {
  tenantName: string;
  tenantSlug: string;
  personName: string;
  role: string;
  unitCount: number;
};

export async function resolveMembership(session: SessionPayload): Promise<AuthenticatedTenant | null> {
  const db = database();
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local role stoka_app`);
    await tx.execute(sql`select set_config('app.tenant_id', ${session.activeTenantId}, true)`);
    await tx.execute(sql`select set_config('app.person_id', ${session.personId}, true)`);
    const now = new Date();
    const [row] = await tx.select({
      membership: memberships,
      personName: people.displayName,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
    }).from(memberships)
      .innerJoin(people, eq(people.id, memberships.personId))
      .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
      .where(and(
        eq(memberships.tenantId, session.activeTenantId),
        eq(memberships.personId, session.personId),
        isNull(memberships.revokedAt),
        or(isNull(memberships.endsAt), gt(memberships.endsAt, now)),
      )).limit(1);
    if (!row) return null;
    const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(units);
    const permissions = row.membership.permissions.filter((value): value is Permission => knownPermissions.has(value as Permission));
    return {
      personId: session.personId,
      tenantId: session.activeTenantId,
      permissions,
      expiresAt: row.membership.endsAt,
      revokedAt: row.membership.revokedAt,
      tenantName: row.tenantName,
      tenantSlug: row.tenantSlug,
      personName: row.personName,
      role: row.membership.role,
      unitCount: count,
    };
  });
}
