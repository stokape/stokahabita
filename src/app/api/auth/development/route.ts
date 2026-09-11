import { NextResponse } from "next/server";
import { z } from "zod";
import { runtimeConfig } from "@/server/config";
import { createSession } from "@/server/auth/session";
import { resolveMembership } from "@/server/dal/auth";
import { stableUuid } from "@/lib/stable-id";

const inputSchema = z.object({ tenantSlug: z.enum(["los-jardines", "parque-del-sol"]) });

export async function POST(request: Request) {
  const config = runtimeConfig();
  if (config.NODE_ENV === "production" || config.APP_MODE !== "database") {
    return NextResponse.json({ error: "El acceso de desarrollo está desactivado." }, { status: 404 });
  }
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Condominio inválido." }, { status: 400 });
  const tenantId = stableUuid(`tenant:${parsed.data.tenantSlug}`);
  const personId = stableUuid(`person:${parsed.data.tenantSlug}:board`);
  const session = { personId, activeTenantId: tenantId, issuedAt: Date.now(), authVersion: 1 as const };
  const membership = await resolveMembership(session);
  if (!membership) return NextResponse.json({ error: "La membresía demo no está disponible." }, { status: 403 });
  await createSession({ personId, activeTenantId: tenantId });
  return NextResponse.json({ ok: true, tenant: membership.tenantName });
}
