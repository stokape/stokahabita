import type { PersonAccess, Tenant, TenantId } from "@/domain/models";

/** Contratos para la futura capa PostgreSQL. No tienen implementación en esta demo. */
export interface TenantRepository {
  findById(tenantId: TenantId): Promise<Tenant | null>;
}

export interface PeopleRepository {
  listByTenant(tenantId: TenantId): Promise<PersonAccess[]>;
}

export interface PaymentReviewRepository {
  confirm(input: { tenantId: TenantId; paymentId: string; movementId: string; reviewerId: string }): Promise<void>;
}
