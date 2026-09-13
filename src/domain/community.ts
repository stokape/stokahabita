import type { TenantId } from "@/domain/models";

export type AccessRequest = {
  id: string;
  tenantId: TenantId;
  unit: string;
  requestedBy: string;
  visitors: string[];
  date: string;
  window: string;
  accessType: "Peatonal" | "Vehicular";
  plate?: string;
  note?: string;
  state: "authorized" | "inside" | "completed" | "cancelled";
};

export type PlateAuthorization = {
  id: string;
  tenantId: TenantId;
  unit: string;
  parkingLevel: string;
  parkingNumber: string;
  plate: string;
  requestedBy: string;
  state: "pending" | "active" | "rejected" | "revoked";
  approvedBy?: string;
};

export type Amenity = {
  id: string;
  tenantId: TenantId;
  name: string;
  rental: number;
  maintenance: number;
  deposit: number;
};

export type ResidentReservation = {
  id: string;
  tenantId: TenantId;
  unit: string;
  requestedBy: string;
  amenityId: string;
  amenityName: string;
  date: string;
  rental: number;
  maintenance: number;
  deposit: number;
  state: "requested" | "cancelled" | "voided";
};
