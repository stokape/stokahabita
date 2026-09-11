export type TenantId = "los-jardines" | "parque-del-sol";

export type Permission =
  | "finances:view"
  | "payments:review"
  | "people:manage"
  | "unit:pay"
  | "unit:incidents"
  | "assemblies:vote";

export type Tower = {
  id: string;
  name: string;
  units: number;
  issued: number;
  collected: number;
  incidents: number;
  nextMaintenance: string;
  status: "on-track" | "attention";
};

export type Unit = {
  id: string;
  tenantId: TenantId;
  towerId: string;
  label: string;
  kind: "apartment" | "house" | "commercial" | "parking" | "storage";
  floor: number | null;
  annexIds: string[];
  occupancy: "owner" | "tenant" | "vacant";
};

export type PersonAccess = {
  id: string;
  name: string;
  initials: string;
  role: string;
  scope: string;
  period: string;
  permissions: Permission[];
  state: "active" | "expiring";
};

export type OwnerSnapshot = {
  personName: string;
  unit: string;
  balance: number;
  dueDate: string;
  pendingReceipt: string;
  announcements: Array<{ title: string; meta: string }>;
};

export type Tenant = {
  id: TenantId;
  name: string;
  city: string;
  towers: Tower[];
  units: Unit[];
  operationalBalance: number;
  commitments: number;
  overdueDebt: number;
  people: PersonAccess[];
  owner: OwnerSnapshot;
};
