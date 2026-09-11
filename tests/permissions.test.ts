import { describe, expect, it } from "vitest";
import { AuthorizationError, requirePermission } from "../src/server/auth/permissions";

const base = { personId: "person-1", tenantId: "tenant-a", permissions: ["payments:review"] as const };

describe("autorización multi-tenant", () => {
  it("permite la acción dentro del tenant y permiso concedido", () => {
    expect(() => requirePermission(base, "tenant-a", "payments:review")).not.toThrow();
  });

  it("rechaza el cruce de tenant aunque el permiso exista", () => {
    expect(() => requirePermission(base, "tenant-b", "payments:review")).toThrow(AuthorizationError);
  });

  it("rechaza accesos vencidos o revocados", () => {
    expect(() => requirePermission({ ...base, expiresAt: new Date("2020-01-01") }, "tenant-a", "payments:review")).toThrow("venció");
    expect(() => requirePermission({ ...base, revokedAt: new Date() }, "tenant-a", "payments:review")).toThrow("revocado");
  });
});
