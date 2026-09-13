import type { AccessRequest, Amenity, PlateAuthorization, ResidentReservation } from "@/domain/community";
import type { TenantId } from "@/domain/models";

export const initialAccessRequests: AccessRequest[] = [
  { id: "ACC-201", tenantId: "los-jardines", unit: "A-203", requestedBy: "Ana Pérez", visitors: ["Valeria Soto", "Luis Soto"], date: "2026-09-15", window: "18:00–22:00", accessType: "Vehicular", plate: "BWA-482", note: "Reunión familiar", state: "authorized" },
  { id: "ACC-112", tenantId: "parque-del-sol", unit: "502", requestedBy: "Diego Salas", visitors: ["Marina López"], date: "2026-09-16", window: "10:00–13:00", accessType: "Peatonal", state: "authorized" },
];

export const initialPlateAuthorizations: PlateAuthorization[] = [
  { id: "VEH-101", tenantId: "los-jardines", unit: "A-203", parkingLevel: "Sótano 1", parkingNumber: "E-18", plate: "ABC-123", requestedBy: "Ana Pérez", state: "active", approvedBy: "María Torres" },
  { id: "VEH-102", tenantId: "los-jardines", unit: "A-203", parkingLevel: "Sótano 1", parkingNumber: "E-18", plate: "BGT-771", requestedBy: "Ana Pérez", state: "pending" },
  { id: "VEH-201", tenantId: "parque-del-sol", unit: "502", parkingLevel: "Semisótano", parkingNumber: "12", plate: "V8D-624", requestedBy: "Diego Salas", state: "active", approvedBy: "Lucía Ramos" },
];

export const amenitiesByTenant: Record<TenantId, Amenity[]> = {
  "los-jardines": [
    { id: "sum", tenantId: "los-jardines", name: "Sala de usos múltiples", rental: 250, maintenance: 50, deposit: 300 },
    { id: "cine", tenantId: "los-jardines", name: "Sala de cine", rental: 120, maintenance: 30, deposit: 150 },
    { id: "piscina", tenantId: "los-jardines", name: "Piscina", rental: 80, maintenance: 20, deposit: 100 },
  ],
  "parque-del-sol": [
    { id: "terraza", tenantId: "parque-del-sol", name: "Terraza", rental: 160, maintenance: 40, deposit: 200 },
    { id: "sum", tenantId: "parque-del-sol", name: "Sala de usos múltiples", rental: 180, maintenance: 40, deposit: 200 },
  ],
};

export const initialResidentReservations: ResidentReservation[] = [];
