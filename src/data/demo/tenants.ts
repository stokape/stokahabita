import type { Tenant, TenantId, Unit } from "@/domain/models";

function apartmentUnits(tenantId: TenantId, towerIds: string[], floors: number, perFloor: number): Unit[] {
  return towerIds.flatMap((towerId) =>
    Array.from({ length: floors * perFloor }, (_, index) => {
      const floor = Math.floor(index / perFloor) + 1;
      const door = (index % perFloor) + 1;
      const label = `${towerId === "principal" ? "" : `${towerId.toUpperCase()}-`}${floor}0${door}`;
      return {
        id: `${tenantId}-${label}`,
        tenantId,
        towerId,
        label,
        kind: "apartment" as const,
        floor,
        annexIds: index < 2 ? [`${tenantId}-parking-${index + 1}`] : [],
        occupancy: index % 9 === 0 ? "tenant" as const : "owner" as const,
      };
    }),
  );
}

export const demoTenants: Tenant[] = [
  {
    id: "los-jardines",
    name: "Los Jardines",
    city: "Lima",
    operationalBalance: 12000,
    commitments: 17000,
    overdueDebt: 8640,
    units: apartmentUnits("los-jardines", ["a", "b", "c"], 8, 4),
    towers: [
      { id: "a", name: "Torre A", units: 32, issued: 9600, collected: 8640, incidents: 2, nextMaintenance: "Ascensor · 15 sep.", status: "on-track" },
      { id: "b", name: "Torre B", units: 32, issued: 9600, collected: 7680, incidents: 4, nextMaintenance: "Ascensor · 17 sep.", status: "attention" },
      { id: "c", name: "Torre C", units: 32, issued: 9600, collected: 8160, incidents: 1, nextMaintenance: "Ascensor · 19 sep.", status: "on-track" },
    ],
    people: [
      { id: "p1", name: "María Torres", initials: "MT", role: "Presidenta", scope: "Todo el condominio", period: "Ene. 2026 – Dic. 2027", permissions: ["finances:view", "payments:review", "people:manage", "assemblies:vote"], state: "active" },
      { id: "p2", name: "Carlos Vega", initials: "CV", role: "Tesorero", scope: "Todo el condominio", period: "Ene. 2026 – Dic. 2027", permissions: ["finances:view", "payments:review", "assemblies:vote"], state: "active" },
      { id: "p3", name: "Ana Pérez", initials: "AP", role: "Propietaria", scope: "Unidad A-203", period: "Desde mar. 2022", permissions: ["unit:pay", "unit:incidents", "assemblies:vote"], state: "active" },
      { id: "p4", name: "Gestión Urbana SAC", initials: "GU", role: "Administradora", scope: "Operación delegada", period: "Hasta 31 dic. 2027", permissions: ["finances:view", "payments:review", "unit:incidents"], state: "expiring" },
    ],
    owner: {
      personName: "Ana Pérez",
      unit: "A-203",
      parking: { level: "Sótano 1", number: "E-18" },
      balance: 300,
      dueDate: "15 sep. 2026",
      pendingReceipt: "Mantenimiento de septiembre",
      announcements: [
        { title: "Mantenimiento del ascensor", meta: "Torre A · 15 sep." },
        { title: "Asamblea de propietarios", meta: "20 sep. · 19:00" },
      ],
    },
  },
  {
    id: "parque-del-sol",
    name: "Parque del Sol",
    city: "Arequipa",
    operationalBalance: 7800,
    commitments: 6900,
    overdueDebt: 1480,
    units: apartmentUnits("parque-del-sol", ["principal"], 6, 4),
    towers: [
      { id: "principal", name: "Edificio principal", units: 24, issued: 7200, collected: 6840, incidents: 1, nextMaintenance: "Bomba · 22 sep.", status: "on-track" },
    ],
    people: [
      { id: "s1", name: "Lucía Ramos", initials: "LR", role: "Presidenta", scope: "Todo el condominio", period: "Jul. 2026 – Jun. 2028", permissions: ["finances:view", "payments:review", "people:manage", "assemblies:vote"], state: "active" },
      { id: "s2", name: "Diego Salas", initials: "DS", role: "Propietario", scope: "Unidad 502", period: "Desde feb. 2024", permissions: ["unit:pay", "unit:incidents", "assemblies:vote"], state: "active" },
    ],
    owner: {
      personName: "Diego Salas",
      unit: "502",
      parking: { level: "Semisótano", number: "12" },
      balance: 0,
      dueDate: "Sin pagos pendientes",
      pendingReceipt: "Mantenimiento de septiembre",
      announcements: [
        { title: "Limpieza de cisterna", meta: "Todo el edificio · 22 sep." },
        { title: "Nuevo horario de recepción", meta: "Desde el 14 sep." },
      ],
    },
  },
];
