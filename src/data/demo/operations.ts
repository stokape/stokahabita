import type { TenantId } from "@/domain/models";

export type FinanceDemo = {
  currentPending: number;
  overdue: Array<{ band: string; amount: number; units: number }>;
  commitments: Array<{ concept: string; amount: number; due: string; scope: string }>;
};

export type AssetDemo = { code: string; name: string; location: string; frequency: string; next: string; state: "scheduled" | "attention" | "done" };
export type ReservationDemo = { unit: string; amenity: string; date: string; schedule: string; rental: number; deposit: number; state: "confirmed" | "payment" | "refund" };
export type IncidentDemo = { id: string; title: string; scope: string; opened: string; owner: string; severity: "normal" | "high"; state: "open" | "working" | "resolved" };

export const financeByTenant: Record<TenantId, FinanceDemo> = {
  "los-jardines": {
    currentPending: 4320,
    overdue: [
      { band: "1–30 días", amount: 3240, units: 11 },
      { band: "31–60 días", amount: 2400, units: 8 },
      { band: "61–90 días", amount: 1500, units: 5 },
      { band: "+90 días", amount: 1500, units: 4 },
    ],
    commitments: [
      { concept: "Vigilancia", amount: 7000, due: "25 sep.", scope: "Común" },
      { concept: "Limpieza", amount: 4000, due: "26 sep.", scope: "Común" },
      { concept: "Ascensores", amount: 3200, due: "28 sep.", scope: "Torres A, B y C" },
      { concept: "Reparación de bomba", amount: 2800, due: "30 sep.", scope: "Área común" },
    ],
  },
  "parque-del-sol": {
    currentPending: 360,
    overdue: [
      { band: "1–30 días", amount: 600, units: 2 },
      { band: "31–60 días", amount: 440, units: 2 },
      { band: "61–90 días", amount: 240, units: 1 },
      { band: "+90 días", amount: 200, units: 1 },
    ],
    commitments: [
      { concept: "Vigilancia", amount: 3800, due: "25 sep.", scope: "Común" },
      { concept: "Limpieza", amount: 2100, due: "27 sep.", scope: "Común" },
      { concept: "Bomba de agua", amount: 1000, due: "30 sep.", scope: "Edificio" },
    ],
  },
};

export const assetsByTenant: Record<TenantId, AssetDemo[]> = {
  "los-jardines": [
    { code: "ASC-A-01", name: "Ascensor Torre A", location: "Torre A", frequency: "Mensual", next: "15 sep.", state: "scheduled" },
    { code: "BOM-01", name: "Bomba principal", location: "Cuarto de bombas", frequency: "Trimestral", next: "18 sep.", state: "attention" },
    { code: "EXT-B-02", name: "Extintor nivel 2", location: "Torre B", frequency: "Anual", next: "25 sep.", state: "scheduled" },
    { code: "RAD-02", name: "Radio de portería", location: "Recepción", frequency: "Trimestral", next: "Revisado", state: "done" },
  ],
  "parque-del-sol": [
    { code: "BOM-01", name: "Bomba de agua", location: "Sótano", frequency: "Trimestral", next: "22 sep.", state: "scheduled" },
    { code: "EXT-01", name: "Extintor principal", location: "Recepción", frequency: "Anual", next: "30 oct.", state: "done" },
  ],
};

export const reservationsByTenant: Record<TenantId, ReservationDemo[]> = {
  "los-jardines": [
    { unit: "B-304", amenity: "Salón de eventos", date: "12 sep.", schedule: "16:00–22:00", rental: 250, deposit: 300, state: "confirmed" },
    { unit: "A-105", amenity: "Salón de eventos", date: "07 sep.", schedule: "Uso finalizado", rental: 250, deposit: 300, state: "refund" },
  ],
  "parque-del-sol": [
    { unit: "502", amenity: "Terraza", date: "19 sep.", schedule: "17:00–21:00", rental: 160, deposit: 200, state: "payment" },
  ],
};

export const incidentsByTenant: Record<TenantId, IncidentDemo[]> = {
  "los-jardines": [
    { id: "INC-104", title: "Filtración entre B-402 y B-302", scope: "Torre B", opened: "10 sep.", owner: "Mantenimiento", severity: "high", state: "working" },
    { id: "INC-103", title: "Luminaria intermitente", scope: "Torre A · piso 5", opened: "09 sep.", owner: "Gestión Urbana", severity: "normal", state: "open" },
    { id: "INC-098", title: "Puerta de acceso desalineada", scope: "Torre C", opened: "03 sep.", owner: "Proveedor", severity: "normal", state: "resolved" },
  ],
  "parque-del-sol": [
    { id: "INC-021", title: "Ruido en bomba de agua", scope: "Sótano", opened: "08 sep.", owner: "Mantenimiento", severity: "normal", state: "working" },
  ],
};

export const documentsByTenant: Record<TenantId, Array<{ name: string; category: string; version: string; access: string; date: string }>> = {
  "los-jardines": [
    { name: "Reglamento interno", category: "Institucional", version: "v2", access: "Propietarios", date: "02 sep. 2026" },
    { name: "Contrato Gestión Urbana", category: "Contratos", version: "v1", access: "Solo junta", date: "01 ene. 2026" },
    { name: "Informe ascensor Torre A", category: "Mantenimiento", version: "v3", access: "Junta y administradora", date: "15 ago. 2026" },
  ],
  "parque-del-sol": [
    { name: "Reglamento interno", category: "Institucional", version: "v1", access: "Propietarios", date: "14 jul. 2026" },
    { name: "Informe de bomba", category: "Mantenimiento", version: "v1", access: "Junta y administradora", date: "22 jun. 2026" },
  ],
};
