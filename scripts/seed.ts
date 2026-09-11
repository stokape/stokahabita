import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import { demoTenants } from "../src/data/demo/tenants";
import { bankMovements, memberships, paymentReports, people, sections, subscriptions, tenants, units } from "../src/server/db/schema";
import { stableUuid as uuid } from "../src/lib/stable-id";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL es obligatorio para sembrar datos.");

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

async function main() {
  try {
    for (const demo of demoTenants) {
      const tenantId = uuid(`tenant:${demo.id}`);
      const personId = uuid(`person:${demo.id}:board`);
      await db.transaction(async (tx) => {
        await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
        await tx.execute(sql`select set_config('app.person_id', ${personId}, true)`);
        await tx.insert(tenants).values({ id: tenantId, slug: demo.id, name: demo.name }).onConflictDoNothing();
        await tx.insert(people).values({ id: personId, email: `junta+${demo.id}@demo.stokahabita.local`, displayName: demo.people[0].name }).onConflictDoNothing();

        const sectionRows = demo.towers.map((tower, position) => ({ id: uuid(`section:${demo.id}:${tower.id}`), tenantId, name: tower.name, position }));
        await tx.insert(sections).values(sectionRows).onConflictDoNothing();
        const sectionIds = new Map(demo.towers.map((tower) => [tower.id, uuid(`section:${demo.id}:${tower.id}`)]));
        await tx.insert(units).values(demo.units.map((unit) => ({ id: uuid(`unit:${unit.id}`), tenantId, sectionId: sectionIds.get(unit.towerId), code: unit.label, kind: unit.kind, floor: unit.floor }))).onConflictDoNothing();
        await tx.insert(memberships).values({ id: uuid(`membership:${demo.id}:board`), tenantId, personId, role: "board-president", permissions: demo.people[0].permissions, acceptedAt: new Date("2026-01-01T00:00:00-05:00") }).onConflictDoNothing();
        await tx.insert(subscriptions).values({ id: uuid(`subscription:${demo.id}`), tenantId, plan: demo.units.length > 50 ? "gestion-51-100" : "gestion-hasta-50", state: "trial", billableUnits: demo.units.length }).onConflictDoNothing();
        if (demo.id === "los-jardines") {
          const movementId = uuid("movement:los-jardines:demo-0909");
          await tx.insert(bankMovements).values({ id: movementId, tenantId, bankAccountRef: "DEMO-LOCAL", operationRef: "DEMO-0909", amountCents: 30_000, occurredAt: new Date("2026-09-09T10:00:00-05:00") }).onConflictDoNothing();
          await tx.insert(paymentReports).values({ id: uuid("payment:los-jardines:a-203:2026-09"), tenantId, unitId: uuid("unit:los-jardines-A-203"), reportedBy: personId, amountCents: 30_000, operationRef: "DEMO-0909" }).onConflictDoNothing();
        }
      });
    }
    console.log("Datos demo sembrados en PostgreSQL.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
