"use client";

import { CalendarDays, Car, Check, Clock3, DoorOpen, MapPin, Pencil, Plus, ShieldCheck, Trash2, UserRoundCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { amenitiesByTenant } from "@/data/demo/community";
import type { AccessRequest, PlateAuthorization, ResidentReservation } from "@/domain/community";
import type { Tenant } from "@/domain/models";

const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 });

const accessState = {
  authorized: { label: "Autorizado", tone: "success" },
  inside: { label: "En interior", tone: "neutral" },
  completed: { label: "Finalizado", tone: "success" },
  cancelled: { label: "Anulado", tone: "soft" },
} as const;

const plateState = {
  pending: { label: "Por aprobar", tone: "warning" },
  active: { label: "Autorizada", tone: "success" },
  rejected: { label: "Rechazada", tone: "soft" },
  revoked: { label: "Revocada", tone: "soft" },
} as const;

type OwnerAccessProps = {
  tenant: Tenant;
  requests: AccessRequest[];
  plates: PlateAuthorization[];
  onSaveRequest: (request: AccessRequest) => void;
  onCancelRequest: (id: string) => void;
  onRequestPlate: (plate: PlateAuthorization) => void;
  onNotice: (message: string) => void;
};

export function OwnerAccessView({ tenant, requests, plates, onSaveRequest, onCancelRequest, onRequestPlate, onNotice }: OwnerAccessProps) {
  const owner = tenant.owner;
  const [visitors, setVisitors] = useState("");
  const [date, setDate] = useState("2026-09-15");
  const [window, setWindow] = useState("18:00–22:00");
  const [accessType, setAccessType] = useState<"Peatonal" | "Vehicular">("Peatonal");
  const [visitorPlate, setVisitorPlate] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlate, setNewPlate] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setVisitors(""); setDate("2026-09-15"); setWindow("18:00–22:00"); setAccessType("Peatonal"); setVisitorPlate(""); setNote(""); setEditingId(null); setError("");
  }

  function submitAccess(event: React.FormEvent) {
    event.preventDefault();
    const names = visitors.split(/[,\n]/).map((name) => name.trim()).filter(Boolean);
    if (!names.length) { setError("Escribe al menos una persona para autorizar."); return; }
    if (accessType === "Vehicular" && !visitorPlate.trim()) { setError("Añade la placa del vehículo visitante."); return; }
    onSaveRequest({ id: editingId ?? `ACC-APP-${requests.length + 1}`, tenantId: tenant.id, unit: owner.unit, requestedBy: owner.personName, visitors: names, date, window, accessType, plate: accessType === "Vehicular" ? visitorPlate.trim().toUpperCase() : undefined, note: note.trim() || undefined, state: "authorized" });
    onNotice(editingId ? "Acceso actualizado en esta sesión demo." : "Acceso autorizado y compartido con portería y la junta en esta sesión demo.");
    resetForm();
  }

  function editRequest(request: AccessRequest) {
    setVisitors(request.visitors.join(", ")); setDate(request.date); setWindow(request.window); setAccessType(request.accessType); setVisitorPlate(request.plate ?? ""); setNote(request.note ?? ""); setEditingId(request.id); setError("");
  }

  function submitPlate(event: React.FormEvent) {
    event.preventDefault();
    const normalized = newPlate.trim().toUpperCase();
    if (!normalized) return;
    if (plates.some((item) => item.plate === normalized && item.state !== "revoked" && item.state !== "rejected")) { onNotice("Esa placa ya está registrada o pendiente de aprobación."); return; }
    onRequestPlate({ id: `VEH-APP-${plates.length + 1}`, tenantId: tenant.id, unit: owner.unit, parkingLevel: owner.parking.level, parkingNumber: owner.parking.number, plate: normalized, requestedBy: owner.personName, state: "pending" });
    setNewPlate("");
    onNotice("Nueva placa enviada a la junta para aprobación. Aún no está autorizada para ingresar.");
  }

  return <div className="owner-community">
    <section className="owner-parking-summary"><span className="row-icon"><Car /></span><div><small>Estacionamiento asignado</small><strong>{owner.parking.level} · {owner.parking.number}</strong><span>Unidad {owner.unit}</span></div></section>
    <section className="owner-section"><div className="section-heading"><h2>Personas autorizadas</h2><span>{requests.filter((item) => item.state === "authorized" || item.state === "inside").length} vigentes</span></div>
      <form className="owner-compact-form" onSubmit={submitAccess}>
        <label className="field"><span>Una o más personas</span><textarea required rows={2} value={visitors} onChange={(event) => setVisitors(event.target.value)} placeholder="Separa los nombres con comas" /></label>
        <div className="owner-form-pair"><label className="field"><span>Fecha</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="field"><span>Horario</span><input value={window} onChange={(event) => setWindow(event.target.value)} required /></label></div>
        <label className="field"><span>Tipo de acceso</span><select value={accessType} onChange={(event) => setAccessType(event.target.value as typeof accessType)}><option>Peatonal</option><option>Vehicular</option></select></label>
        {accessType === "Vehicular" && <label className="field"><span>Placa visitante</span><input value={visitorPlate} onChange={(event) => setVisitorPlate(event.target.value)} placeholder="ABC-123" maxLength={10} /></label>}
        <label className="field"><span>Indicación para portería · opcional</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej. llamar al llegar" /></label>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <div className="owner-form-actions">{editingId && <button type="button" className="text-button" onClick={resetForm}>Cancelar edición</button>}<button className="primary-button compact"><UserRoundCheck />{editingId ? "Guardar cambios" : "Autorizar acceso"}</button></div>
      </form>
      <div className="owner-request-list">{requests.map((request) => { const status = accessState[request.state]; return <article key={request.id}><div><strong>{request.visitors.join(", ")}</strong><small>{request.date} · {request.window} · {request.accessType}{request.plate ? ` · ${request.plate}` : ""}</small></div><span className={`status ${status.tone}`}>{status.label}</span>{request.state === "authorized" && <div className="owner-row-actions"><button aria-label={`Editar acceso de ${request.visitors.join(", ")}`} onClick={() => editRequest(request)}><Pencil /></button><button onClick={() => { onCancelRequest(request.id); onNotice("Acceso cancelado; el historial se conserva para la junta."); }}>Cancelar</button></div>}</article>; })}</div>
    </section>
    <section className="owner-section"><div className="section-heading"><h2>Placas de mi cochera</h2><span>Aprobación de junta</span></div>
      <div className="owner-plate-list">{plates.map((item) => { const status = plateState[item.state]; return <div key={item.id}><span><Car /><strong>{item.plate}</strong></span><span className={`status ${status.tone}`}>{status.label}</span></div>; })}</div>
      <form className="owner-inline-form" onSubmit={submitPlate}><label className="field"><span>Nueva placa</span><input required value={newPlate} onChange={(event) => setNewPlate(event.target.value)} placeholder="ABC-123" maxLength={10} /></label><button className="secondary-button compact"><Plus />Solicitar aprobación</button></form>
    </section>
  </div>;
}

type OwnerReservationsProps = {
  tenant: Tenant;
  reservations: ResidentReservation[];
  onSave: (reservation: ResidentReservation) => void;
  onCancel: (id: string) => void;
  onNotice: (message: string) => void;
};

export function OwnerReservationsView({ tenant, reservations, onSave, onCancel, onNotice }: OwnerReservationsProps) {
  const amenities = amenitiesByTenant[tenant.id];
  const [amenityId, setAmenityId] = useState(amenities[0].id);
  const [date, setDate] = useState("2026-09-20");
  const [editingId, setEditingId] = useState<string | null>(null);
  const amenity = amenities.find((item) => item.id === amenityId) ?? amenities[0];
  const total = amenity.rental + amenity.maintenance + amenity.deposit;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSave({ id: editingId ?? `RES-APP-${reservations.length + 1}`, tenantId: tenant.id, unit: tenant.owner.unit, requestedBy: tenant.owner.personName, amenityId: amenity.id, amenityName: amenity.name, date, rental: amenity.rental, maintenance: amenity.maintenance, deposit: amenity.deposit, state: "requested" });
    onNotice(editingId ? "Reserva actualizada en esta sesión demo." : "Solicitud de reserva compartida con la administración y la junta.");
    setEditingId(null);
  }

  function edit(reservation: ResidentReservation) {
    setAmenityId(reservation.amenityId); setDate(reservation.date); setEditingId(reservation.id);
  }

  return <div className="owner-community">
    <section className="owner-section"><div className="section-heading"><h2>Reservar un área</h2><span>Costos separados</span></div>
      <form className="owner-compact-form" onSubmit={submit}><label className="field"><span>Área común</span><select value={amenityId} onChange={(event) => setAmenityId(event.target.value)}>{amenities.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="field"><span>Fecha</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <dl className="owner-costs"><div><dt>Alquiler</dt><dd>{money.format(amenity.rental)}</dd></div><div><dt>Mantenimiento</dt><dd>{money.format(amenity.maintenance)}</dd></div><div><dt>Garantía reembolsable</dt><dd>{money.format(amenity.deposit)}</dd></div><div><dt>Total a reportar</dt><dd>{money.format(total)}</dd></div></dl>
        <p className="owner-form-note"><ShieldCheck />La garantía no se registra como ingreso mientras corresponda devolverla.</p>
        <div className="owner-form-actions">{editingId && <button type="button" className="text-button" onClick={() => setEditingId(null)}>Cancelar edición</button>}<button className="primary-button compact"><CalendarDays />{editingId ? "Guardar cambios" : "Solicitar reserva"}</button></div>
      </form>
      <div className="owner-request-list">{reservations.length === 0 ? <p className="owner-empty">Aún no tienes solicitudes de reserva.</p> : reservations.map((item) => <article key={item.id}><div><strong>{item.amenityName}</strong><small>{item.date} · total {money.format(item.rental + item.maintenance + item.deposit)}</small></div><span className={`status ${item.state === "requested" ? "warning" : "soft"}`}>{item.state === "requested" ? "Solicitada" : item.state === "cancelled" ? "Cancelada" : "Anulada"}</span>{item.state === "requested" && <div className="owner-row-actions"><button aria-label={`Editar reserva de ${item.amenityName}`} onClick={() => edit(item)}><Pencil /></button><button onClick={() => { onCancel(item.id); onNotice("Reserva cancelada; el registro permanece visible para la junta."); }}>Cancelar</button></div>}</article>)}</div>
    </section>
  </div>;
}

type BoardProps = {
  tenant: Tenant;
  requests: AccessRequest[];
  plates: PlateAuthorization[];
  reservations: ResidentReservation[];
  approver: string;
  onAccessState: (id: string, state: AccessRequest["state"]) => void;
  onPlateState: (id: string, state: PlateAuthorization["state"], approvedBy?: string) => void;
  onReservationState: (id: string, state: ResidentReservation["state"]) => void;
  onNotice: (message: string) => void;
};

export function BoardAccessPanel({ tenant, requests, plates, reservations, approver, onAccessState, onPlateState, onReservationState, onNotice }: BoardProps) {
  const activePlates = plates.filter((item) => item.state === "active").length;
  return <section className="access-control-section"><div className="access-control-heading"><div><h2>Solicitudes, cocheras y áreas comunes</h2><p>La junta aprueba placas nuevas, consulta los accesos y conserva la facultad exclusiva de anular registros.</p></div><span className="status neutral">Historial conservado</span></div>
    <div className="access-summary"><span><DoorOpen /><strong>{requests.filter((item) => item.state === "authorized" || item.state === "inside").length}</strong><small>accesos vigentes</small></span><span><Car /><strong>{activePlates}</strong><small>placas activas</small></span><span><CalendarDays /><strong>{reservations.filter((item) => item.state === "requested").length}</strong><small>reservas solicitadas</small></span></div>
    <div className="access-control-grid">
      <section className="data-panel"><div className="panel-title"><h2>Accesos de residentes</h2><span>Visible también en portería</span></div><div className="access-review-list">{requests.map((request) => { const status = accessState[request.state]; return <article key={request.id}><span className="task-icon"><Users /></span><div><strong>{request.visitors.join(", ")}</strong><small>Unidad {request.unit} · {request.date} · {request.window}</small>{request.plate && <small>Vehículo · {request.plate}</small>}</div><span className={`status ${status.tone}`}>{status.label}</span>{request.state !== "cancelled" && request.state !== "completed" && <button className="text-button danger-action" onClick={() => { onAccessState(request.id, "cancelled"); onNotice("Acceso anulado por la junta. El registro permanece en el historial."); }}><Trash2 />Anular</button>}</article>; })}</div></section>
      <section className="data-panel"><div className="panel-title"><h2>Cocheras y placas</h2><span>{tenant.owner.parking.level} · {tenant.owner.parking.number}</span></div><div className="plate-review-list">{plates.map((item) => { const status = plateState[item.state]; return <article key={item.id}><span className="task-icon"><Car /></span><div><strong>{item.plate}</strong><small>Unidad {item.unit} · cochera {item.parkingNumber}</small>{item.approvedBy && <small>Aprobó: {item.approvedBy}</small>}</div><span className={`status ${status.tone}`}>{status.label}</span><div>{item.state === "pending" && <button className="secondary-button compact" onClick={() => { onPlateState(item.id, "active", approver); onNotice(`Placa ${item.plate} aprobada por ${approver}.`); }}><Check />Aprobar</button>}{item.state !== "revoked" && <button className="text-button danger-action" onClick={() => { onPlateState(item.id, "revoked"); onNotice(`Registro de la placa ${item.plate} anulado por la junta.`); }}><Trash2 />Anular</button>}</div></article>; })}</div></section>
    </div>
    {reservations.length > 0 && <section className="data-panel access-reservations"><div className="panel-title"><h2>Solicitudes de áreas comunes</h2><span>Alquiler, mantenimiento y garantía separados</span></div>{reservations.map((item) => <article key={item.id}><span className="task-icon"><CalendarDays /></span><div><strong>{item.amenityName} · unidad {item.unit}</strong><small>{item.date} · alquiler {money.format(item.rental)} · mantenimiento {money.format(item.maintenance)} · garantía {money.format(item.deposit)}</small></div><span className={`status ${item.state === "requested" ? "warning" : "soft"}`}>{item.state === "requested" ? "Solicitada" : item.state === "cancelled" ? "Cancelada" : "Anulada"}</span>{item.state === "requested" && <button className="text-button danger-action" onClick={() => { onReservationState(item.id, "voided"); onNotice("Reserva anulada por la junta; se conservó el historial."); }}><Trash2 />Anular</button>}</article>)}</section>}
  </section>;
}

export function ConciergeAuthorizedAccess({ requests, plates, onState, onNotice }: { requests: AccessRequest[]; plates: PlateAuthorization[]; onState: (id: string, state: AccessRequest["state"]) => void; onNotice: (message: string) => void }) {
  const visible = useMemo(() => requests.filter((item) => item.state === "authorized" || item.state === "inside"), [requests]);
  return <section className="data-panel authorized-access"><div className="panel-title"><div><h2>Autorizaciones de residentes</h2><span>Solo datos necesarios para el turno</span></div><span className="status neutral">{visible.length} vigentes</span></div>{visible.length === 0 ? <p className="owner-empty">No hay accesos autorizados pendientes.</p> : visible.map((request) => <article key={request.id}><span className="task-icon"><DoorOpen /></span><div><strong>{request.visitors.join(", ")}</strong><small>Unidad {request.unit} · {request.date} · {request.window}</small><small>{request.accessType}{request.plate ? ` · placa ${request.plate}` : ""}{request.note ? ` · ${request.note}` : ""}</small></div><span className={`status ${request.state === "inside" ? "neutral" : "success"}`}>{request.state === "inside" ? "En interior" : "Autorizado"}</span><button className="secondary-button compact" onClick={() => { const next = request.state === "inside" ? "completed" : "inside"; onState(request.id, next); onNotice(next === "inside" ? "Ingreso registrado y visible para la junta." : "Salida registrada; el acceso pasó al historial."); }}>{request.state === "inside" ? <><Clock3 />Registrar salida</> : <><UserRoundCheck />Registrar ingreso</>}</button></article>)}<p className="authorized-plates"><MapPin />Placas permanentes activas: {plates.filter((item) => item.state === "active").map((item) => `${item.plate} · ${item.parkingLevel} ${item.parkingNumber}`).join("; ") || "ninguna"}</p></section>;
}
