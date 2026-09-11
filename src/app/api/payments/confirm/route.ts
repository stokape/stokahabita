import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/server/auth/session";
import { AuthorizationError } from "@/server/auth/permissions";
import { resolveMembership } from "@/server/dal/auth";
import { confirmPayment } from "@/server/dal/payments";
import { runtimeConfig } from "@/server/config";

const inputSchema = z.object({ tenantId: z.uuid(), paymentId: z.uuid(), movementId: z.uuid() });

export async function POST(request: Request) {
  if (runtimeConfig().APP_MODE !== "database") return NextResponse.json({ error: "Persistencia desactivada." }, { status: 409 });
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  const context = await resolveMembership(session);
  if (!context) return NextResponse.json({ error: "Membresía inválida o vencida." }, { status: 403 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  try {
    await confirmPayment({ context, ...parsed.data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "No se pudo confirmar el pago.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
