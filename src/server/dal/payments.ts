import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { database } from "@/server/db/client";
import { auditLogs, bankMovements, paymentReports } from "@/server/db/schema";
import { requirePermission, type AuthorizationContext } from "@/server/auth/permissions";

export async function confirmPayment(input: {
  context: AuthorizationContext;
  tenantId: string;
  paymentId: string;
  movementId: string;
}) {
  requirePermission(input.context, input.tenantId, "payments:review");
  const db = database();

  return db.transaction(async (tx) => {
    await tx.execute(sql`set local role stoka_app`);
    await tx.execute(sql`select set_config('app.tenant_id', ${input.tenantId}, true)`);
    await tx.execute(sql`select set_config('app.person_id', ${input.context.personId}, true)`);
    const [payment] = await tx.select().from(paymentReports).where(and(
      eq(paymentReports.id, input.paymentId),
      eq(paymentReports.tenantId, input.tenantId),
      eq(paymentReports.status, "reported"),
    )).for("update");
    if (!payment) throw new Error("El pago ya fue procesado o no existe.");

    const [movement] = await tx.select().from(bankMovements).where(and(
      eq(bankMovements.id, input.movementId),
      eq(bankMovements.tenantId, input.tenantId),
      isNull(bankMovements.reconciledAt),
    )).for("update");
    if (!movement || movement.amountCents !== payment.amountCents) throw new Error("El movimiento no coincide o ya fue conciliado.");

    const now = new Date();
    await tx.update(bankMovements).set({ reconciledAt: now, updatedAt: now }).where(eq(bankMovements.id, movement.id));
    await tx.update(paymentReports).set({ status: "confirmed", bankMovementId: movement.id, reviewedBy: input.context.personId, reviewedAt: now, updatedAt: now }).where(eq(paymentReports.id, payment.id));
    await tx.insert(auditLogs).values({
      tenantId: input.tenantId,
      actorId: input.context.personId,
      action: "payment.confirmed",
      entityType: "payment_report",
      entityId: payment.id,
      before: { status: payment.status },
      after: { status: "confirmed", bankMovementId: movement.id },
    });
  });
}
