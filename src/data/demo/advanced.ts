import type { TenantId } from "@/domain/models";

export type ArrearsCase = {
  id: string;
  unit: string;
  balance: number;
  age: string;
  contact: string;
  nextAction: string;
  state: "followup" | "proposal" | "agreement";
};

export type ProviderDemo = {
  id: string;
  name: string;
  service: string;
  monthly: number;
  contractEnd: string;
  state: "current" | "review" | "candidate";
};

export type ConciergeEntry = {
  id: string;
  kind: "Visita" | "Paquete" | "Trabajo";
  detail: string;
  unit: string;
  time: string;
  state: "inside" | "waiting" | "closed";
};

export type PaymentReminderRecipient = {
  id: string;
  unit: string;
  name: string;
  email: string;
  balance: number;
  dueDate: string;
};

export type PaymentReminder = {
  id: string;
  tenantId: TenantId;
  units: string[];
  sender: string;
  message: string;
  channels: Array<"app" | "email">;
  sentAt: string;
};

export const arrearsByTenant: Record<TenantId, ArrearsCase[]> = {
  "los-jardines": [
    { id: "COB-041", unit: "A-402", balance: 1200, age: "61–90 días", contact: "08 sep.", nextAction: "Revisar propuesta", state: "proposal" },
    { id: "COB-038", unit: "B-704", balance: 900, age: "+90 días", contact: "05 sep.", nextAction: "Contactar responsable", state: "followup" },
    { id: "COB-029", unit: "C-201", balance: 600, age: "31–60 días", contact: "02 sep.", nextAction: "Cuota 2 de 3 · 18 sep.", state: "agreement" },
  ],
  "parque-del-sol": [
    { id: "COB-012", unit: "604", balance: 440, age: "31–60 días", contact: "07 sep.", nextAction: "Contactar responsable", state: "followup" },
    { id: "COB-009", unit: "203", balance: 240, age: "61–90 días", contact: "01 sep.", nextAction: "Revisar propuesta", state: "proposal" },
  ],
};

export const paymentReminderRecipientsByTenant: Record<TenantId, PaymentReminderRecipient[]> = {
  "los-jardines": [
    { id: "REC-203", unit: "A-203", name: "Ana Pérez", email: "ana.perez@correo.demo", balance: 300, dueDate: "15 sep. 2026" },
    { id: "REC-402", unit: "A-402", name: "Rosa Medina", email: "rosa.medina@correo.demo", balance: 1200, dueDate: "31 ago. 2026" },
    { id: "REC-704", unit: "B-704", name: "Jorge Salas", email: "jorge.salas@correo.demo", balance: 900, dueDate: "31 ago. 2026" },
    { id: "REC-201", unit: "C-201", name: "Lucía Campos", email: "lucia.campos@correo.demo", balance: 600, dueDate: "31 ago. 2026" },
  ],
  "parque-del-sol": [
    { id: "REC-604", unit: "604", name: "Diego Salas", email: "diego.salas@correo.demo", balance: 440, dueDate: "31 ago. 2026" },
    { id: "REC-203-P", unit: "203", name: "Elena Vargas", email: "elena.vargas@correo.demo", balance: 240, dueDate: "31 ago. 2026" },
  ],
};

export const providersByTenant: Record<TenantId, ProviderDemo[]> = {
  "los-jardines": [
    { id: "PRV-01", name: "SegurPerú SAC", service: "Vigilancia", monthly: 7000, contractEnd: "31 dic. 2026", state: "current" },
    { id: "PRV-02", name: "Elevatek", service: "Ascensores", monthly: 3200, contractEnd: "30 nov. 2026", state: "review" },
    { id: "PRV-03", name: "Limpio Sur", service: "Limpieza", monthly: 4000, contractEnd: "31 mar. 2027", state: "current" },
    { id: "PRV-04", name: "Vertical Pro", service: "Ascensores · cotización", monthly: 2950, contractEnd: "Oferta hasta 25 sep.", state: "candidate" },
  ],
  "parque-del-sol": [
    { id: "PRV-11", name: "Control Uno", service: "Vigilancia", monthly: 3800, contractEnd: "31 ene. 2027", state: "current" },
    { id: "PRV-12", name: "Limpieza Clara", service: "Limpieza", monthly: 2100, contractEnd: "30 sep. 2026", state: "review" },
  ],
};

export const conciergeByTenant: Record<TenantId, ConciergeEntry[]> = {
  "los-jardines": [
    { id: "VIS-184", kind: "Visita", detail: "Carla Ríos", unit: "B-304", time: "10:42", state: "inside" },
    { id: "PAQ-091", kind: "Paquete", detail: "Mercado Libre", unit: "A-105", time: "09:18", state: "waiting" },
    { id: "TRA-024", kind: "Trabajo", detail: "Técnico de ascensor", unit: "Torre A", time: "08:05", state: "inside" },
    { id: "VIS-179", kind: "Visita", detail: "Diego Ponce", unit: "C-602", time: "Ayer · 19:34", state: "closed" },
  ],
  "parque-del-sol": [
    { id: "PAQ-032", kind: "Paquete", detail: "Olva Courier", unit: "502", time: "11:06", state: "waiting" },
    { id: "VIS-061", kind: "Visita", detail: "Rosa Medina", unit: "203", time: "09:55", state: "inside" },
  ],
};
