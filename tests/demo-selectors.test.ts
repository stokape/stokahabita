import { describe, expect, it } from "vitest";
import { demoTenants } from "../src/data/demo/tenants";
import { collectionRate, selectTenant, tenantTotals } from "../src/lib/demo-selectors";

describe("datos demo por tenant", () => {
  it("mantiene separados Los Jardines y Parque del Sol", () => {
    const jardines = selectTenant(demoTenants, "los-jardines");
    const parque = selectTenant(demoTenants, "parque-del-sol");
    expect(jardines?.towers).toHaveLength(3);
    expect(parque?.towers).toHaveLength(1);
    expect(jardines?.units).toHaveLength(96);
    expect(parque?.units).toHaveLength(24);
    expect(jardines?.units.every((unit) => unit.tenantId === "los-jardines")).toBe(true);
    expect(parque?.units.every((unit) => unit.tenantId === "parque-del-sol")).toBe(true);
    expect(jardines?.people.some((person) => person.name === "Diego Salas")).toBe(false);
  });

  it("calcula los totales aprobados de Los Jardines", () => {
    const tenant = selectTenant(demoTenants, "los-jardines");
    expect(tenant).toBeDefined();
    const totals = tenantTotals(tenant!);
    expect(totals).toEqual({ units: 96, issued: 28800, collected: 24480, incidents: 7 });
    expect(collectionRate(totals.collected, totals.issued)).toBe(85);
  });
});
