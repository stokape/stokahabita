import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { z } from "zod";
import { runtimeConfig } from "@/server/config";

const payloadSchema = z.object({
  personId: z.uuid(),
  activeTenantId: z.uuid(),
  issuedAt: z.number().int().positive(),
  authVersion: z.literal(1),
});

export type SessionPayload = z.infer<typeof payloadSchema>;

function options(): SessionOptions {
  const config = runtimeConfig();
  if (!config.SESSION_PASSWORD) throw new Error("SESSION_PASSWORD no está configurado.");
  return {
    cookieName: "stoka_habita_session",
    password: config.SESSION_PASSWORD,
    ttl: 60 * 60 * 8,
    cookieOptions: {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    onUnsealError: (reason) => {
      if (reason !== "expired") console.warn("Sesión rechazada", { reason });
    },
  };
}

export async function readSession(): Promise<SessionPayload | null> {
  const session = await getIronSession<SessionPayload>(await cookies(), options());
  const parsed = payloadSchema.safeParse(session);
  if (!parsed.success) return null;
  return parsed.data;
}

export async function createSession(payload: Omit<SessionPayload, "issuedAt" | "authVersion">) {
  const session = await getIronSession<SessionPayload>(await cookies(), options());
  session.personId = payload.personId;
  session.activeTenantId = payload.activeTenantId;
  session.issuedAt = Date.now();
  session.authVersion = 1;
  await session.save();
}

export async function destroySession() {
  const session = await getIronSession<SessionPayload>(await cookies(), options());
  session.destroy();
}
