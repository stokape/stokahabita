import type { Tenant, TenantId } from "@/domain/models";

export function selectTenant(tenants: Tenant[], tenantId: TenantId): Tenant | undefined {
  return tenants.find((tenant) => tenant.id === tenantId);
}

export function tenantTotals(tenant: Tenant) {
  return tenant.towers.reduce(
    (totals, tower) => ({
      units: totals.units + tower.units,
      issued: totals.issued + tower.issued,
      collected: totals.collected + tower.collected,
      incidents: totals.incidents + tower.incidents,
    }),
    { units: 0, issued: 0, collected: 0, incidents: 0 },
  );
}

export function collectionRate(collected: number, issued: number) {
  return issued === 0 ? 0 : Math.round((collected / issued) * 100);
}
