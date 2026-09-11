import type { Permission } from "@/domain/models";

export type AuthorizationContext = {
  personId: string;
  tenantId: string;
  permissions: readonly Permission[];
  expiresAt?: Date | null;
  revokedAt?: Date | null;
};

export class AuthorizationError extends Error {
  constructor(message = "No tienes autorización para realizar esta acción.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requirePermission(context: AuthorizationContext, tenantId: string, permission: Permission, now = new Date()) {
  if (context.tenantId !== tenantId) throw new AuthorizationError("El recurso pertenece a otro condominio.");
  if (context.revokedAt) throw new AuthorizationError("Este acceso fue revocado.");
  if (context.expiresAt && context.expiresAt <= now) throw new AuthorizationError("Este acceso venció.");
  if (!context.permissions.includes(permission)) throw new AuthorizationError();
}
