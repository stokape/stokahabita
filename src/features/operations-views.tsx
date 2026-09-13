"use client";

import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileClock,
  FileText,
  Info,
  KeyRound,
  Landmark,
  Mail,
  Megaphone,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Vote,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Tenant } from "@/domain/models";
import type { ResidentReservation } from "@/domain/community";
import { assetsByTenant, documentsByTenant, financeByTenant, incidentsByTenant, reservationsByTenant } from "@/data/demo/operations";
import { useDemoState } from "@/lib/demo-storage";

const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 });

type Props = { tenant: Tenant; onNotice: (message: string) => void };

function ModuleHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="module-heading"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function DemoNotice() {
  return <p className="module-demo-note"><ShieldCheck />Flujo demostrativo: valida estados y cálculos, pero no envía mensajes, dinero ni archivos.</p>;
}

export function UnitsView({ tenant, onNotice }: Props) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [towerId, setTowerId] = useState(tenant.towers[0].id);
  const [added, setAdded] = useDemoState<Array<{ id: string; label: string; towerId: string }>>(`units:${tenant.id}`, []);
  const units = [...added.map((unit) => ({ ...unit, occupancy: "vacant" as const, annexIds: [] })), ...tenant.units].filter((unit) => unit.label.toLowerCase().includes(query.toLowerCase()));
  const occupied = tenant.units.filter((unit) => unit.occupancy !== "vacant").length;
  function createUnit(event: React.FormEvent) {
    event.preventDefault();
    const clean = label.trim().toUpperCase();
    if (!clean || units.some((unit) => unit.label.toLowerCase() === clean.toLowerCase())) { onNotice("Usa un código de unidad que todavía no exista."); return; }
    setAdded((current) => [{ id: `demo-${crypto.randomUUID()}`, label: clean, towerId }, ...current]);
    setLabel(""); setCreating(false); onNotice(`Unidad ${clean} creada con datos ficticios.`);
  }
  return <>
    <ModuleHeading title="Unidades" description="Departamentos y anexos organizados dentro del condominio." action={<button className="primary-button compact" aria-expanded={creating} onClick={() => setCreating((value) => !value)}><Plus />Nueva unidad</button>} />
    {creating && <form className="data-panel quick-create" onSubmit={createUnit}><div className="panel-title"><h2>Agregar unidad ficticia</h2><span>No afecta datos reales</span></div><div className="quick-create-fields"><label className="field"><span>Código</span><input required maxLength={12} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Ej. A-901" /></label><label className="field"><span>Torre o edificio</span><select value={towerId} onChange={(event) => setTowerId(event.target.value)}>{tenant.towers.map((tower) => <option value={tower.id} key={tower.id}>{tower.name}</option>)}</select></label></div><div className="form-actions"><button type="button" className="secondary-button compact" onClick={() => setCreating(false)}>Cancelar</button><button className="primary-button compact">Crear en demo</button></div></form>}
    <div className="inline-stats"><span><strong>{tenant.units.length + added.length}</strong> departamentos</span><span><strong>{occupied}</strong> ocupados</span><span><strong>{tenant.units.filter((unit) => unit.annexIds.length > 0).length}</strong> con anexos</span></div>
    <section className="data-panel">
      <label className="search-field"><Search /><span className="sr-only">Buscar unidad</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por código" /></label>
      <div className="responsive-table">
        <table><thead><tr><th>Unidad</th><th>Ubicación</th><th>Ocupación</th><th>Anexos</th><th>Estado</th></tr></thead><tbody>
          {units.slice(0, 18).map((unit) => <tr key={unit.id}><td><strong>{unit.label}</strong></td><td>{tenant.towers.find((tower) => tower.id === unit.towerId)?.name}</td><td>{unit.occupancy === "tenant" ? "Inquilino" : "Propietario"}</td><td>{unit.annexIds.length ? `${unit.annexIds.length} vinculado` : "—"}</td><td><span className="status success">Activa</span></td></tr>)}
        </tbody></table>
      </div>
      {units.length > 18 && <p className="table-foot">Mostrando 18 de {units.length} unidades. Usa la búsqueda para encontrar una unidad específica.</p>}
    </section>
  </>;
}

export function FinanceView({ tenant, onNotice, onReviewPayment }: Props & { onReviewPayment: () => void }) {
  const finance = financeByTenant[tenant.id];
  const [simulation, setSimulation] = useState(0);
  const [creating, setCreating] = useState(false);
  const [period, setPeriod] = useState("Octubre 2026");
  const [amount, setAmount] = useState(300);
  const [issues, setIssues] = useDemoState<Array<{ period: string; amount: number; count: number }>>(`issues:${tenant.id}`, []);
  const gap = tenant.commitments - tenant.operationalBalance - simulation;
  function createIssue(event: React.FormEvent) { event.preventDefault(); setIssues((current) => [{ period: period.trim(), amount, count: tenant.units.length }, ...current]); setCreating(false); onNotice(`Emisión ficticia de ${period} preparada para ${tenant.units.length} unidades.`); }
  return <>
    <ModuleHeading title="Finanzas" description="Cobranza, compromisos y deuda sin mezclar periodos ni fondos." action={<button className="primary-button compact" aria-expanded={creating} onClick={() => setCreating((value) => !value)}><Plus />Preparar emisión</button>} />
    {creating && <form className="data-panel quick-create" onSubmit={createIssue}><div className="panel-title"><h2>Nueva emisión ficticia</h2><span>{tenant.units.length} unidades</span></div><div className="quick-create-fields"><label className="field"><span>Periodo</span><input required maxLength={30} value={period} onChange={(event) => setPeriod(event.target.value)} /></label><label className="field"><span>Cuota regular por unidad</span><input required type="number" min="0" max="10000" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label></div><div className="form-actions"><button type="button" className="secondary-button compact" onClick={() => setCreating(false)}>Cancelar</button><button className="primary-button compact">Preparar en demo</button></div></form>}
    {issues.length > 0 && <section className="session-records" aria-label="Emisiones preparadas en la demo">{issues.map((item, index) => <span key={`${item.period}-${index}`}><Check />{item.period}: {item.count} recibos de {money.format(item.amount)}</span>)}</section>}
    <div className="finance-layout">
      <section className="data-panel wide"><div className="panel-title"><h2>Compromisos de los próximos 30 días</h2><span>{money.format(tenant.commitments)}</span></div>
        <div className="responsive-table"><table><thead><tr><th>Concepto</th><th>Alcance</th><th>Vence</th><th>Importe</th></tr></thead><tbody>{finance.commitments.map((item) => <tr key={item.concept}><td><strong>{item.concept}</strong></td><td>{item.scope}</td><td>{item.due}</td><td className="number-cell">{money.format(item.amount)}</td></tr>)}</tbody></table></div>
      </section>
      <section className="projection-panel"><span>Brecha proyectada</span><strong className={gap > 0 ? "negative" : "positive"}>{money.format(Math.abs(gap))}</strong><p>{gap > 0 ? "Falta cubrir" : "Excedente simulado"}</p><label>Prueba cobros esperados<input type="range" min="0" max="9000" step="100" value={simulation} onChange={(event) => setSimulation(Number(event.target.value))} /></label><small>{money.format(simulation)} en cobros simulados. No modifica el presupuesto.</small></section>
    </div>
    <div className="finance-layout lower">
      <section className="data-panel"><div className="panel-title"><h2>Antigüedad de deuda</h2><span>{money.format(tenant.overdueDebt)}</span></div>{finance.overdue.map((band) => <div className="aging-row" key={band.band}><span>{band.band}<small>{band.units} unidades</small></span><strong>{money.format(band.amount)}</strong></div>)}</section>
      <section className="data-panel"><div className="panel-title"><h2>Conciliación</h2><span className="status warning">1 pendiente</span></div><button className="featured-task" onClick={onReviewPayment}><span className="task-icon"><CircleDollarSign /></span><span><strong>Pago A-203</strong><small>S/ 300 · operación DEMO-0909</small></span><ArrowRight /></button><div className="quiet-row"><span>Movimiento sin identificar</span><strong>0</strong></div><div className="quiet-row"><span>Duplicados detectados</span><strong>0</strong></div></section>
    </div>
  </>;
}

export function MaintenanceView({ tenant, onNotice }: Props) {
  const initial = assetsByTenant[tenant.id];
  const [completed, setCompleted] = useDemoState<string[]>(`maintenance-completed:${tenant.id}`, initial.filter((asset) => asset.state === "done").map((asset) => asset.code));
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [added, setAdded] = useDemoState<Array<{ code: string; name: string; location: string; frequency: string; next: string; state: "scheduled" }>>(`assets:${tenant.id}`, []);
  const [detail, setDetail] = useState<"inventory" | "supplies" | "warranty" | null>(null);
  const assets = [...added, ...initial];
  function addAsset(event: React.FormEvent) { event.preventDefault(); const code = `ACT-${String(assets.length + 1).padStart(3, "0")}`; setAdded((current) => [{ code, name: name.trim(), location: location.trim(), frequency: "Mensual", next: "15 oct. 2026", state: "scheduled" }, ...current]); setName(""); setLocation(""); setCreating(false); onNotice(`${code} añadido al plan ficticio.`); }
  return <>
    <ModuleHeading title="Mantenimiento e inventario" description="Equipos identificados, tareas programadas y evidencia de ejecución." action={<button className="primary-button compact" aria-expanded={creating} onClick={() => setCreating((value) => !value)}><Plus />Nuevo activo</button>} />
    <DemoNotice />
    {creating && <form className="data-panel quick-create" onSubmit={addAsset}><div className="panel-title"><h2>Registrar activo ficticio</h2><span>Próxima revisión mensual</span></div><div className="quick-create-fields"><label className="field"><span>Nombre</span><input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Bomba secundaria" /></label><label className="field"><span>Ubicación</span><input required maxLength={80} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ej. Cuarto de bombas" /></label></div><div className="form-actions"><button type="button" className="secondary-button compact" onClick={() => setCreating(false)}>Cancelar</button><button className="primary-button compact">Registrar en demo</button></div></form>}
    <section className="data-panel"><div className="panel-title"><h2>Plan preventivo</h2><span>{assets.length} activos controlados</span></div><div className="asset-list">{assets.map((asset) => {
      const done = completed.includes(asset.code);
      return <article className="asset-row" key={asset.code}><span className="asset-icon"><Wrench /></span><span><strong>{asset.name}</strong><small>{asset.code} · {asset.location}</small></span><span><small>Frecuencia</small><strong>{asset.frequency}</strong></span><span><small>Próxima revisión</small><strong>{done ? "Completada" : asset.next}</strong></span><span className={`status ${done ? "success" : asset.state === "attention" ? "warning" : "neutral"}`}>{done ? "Realizado" : asset.state === "attention" ? "Revisar garantía" : "Programado"}</span>{!done && <button className="secondary-button compact" onClick={() => { setCompleted((current) => [...current, asset.code]); onNotice(`Ejecución de ${asset.code} registrada solo en la demo.`); }}><Check />Registrar</button>}</article>;
    })}</div></section>
    <div className="module-cards"><article><ClipboardCheck /><div><strong>Revisión de inventario</strong><span>2 de 3 elementos verificados</span></div><button onClick={() => setDetail("inventory")}>Continuar</button></article><article><PackageCheck /><div><strong>Consumibles</strong><span>4 existencias bajo mínimo</span></div><button onClick={() => setDetail("supplies")}>Revisar</button></article><article><FileClock /><div><strong>Garantías</strong><span>Bomba principal · vence dic. 2026</span></div><button onClick={() => setDetail("warranty")}>Ver cobertura</button></article></div>
    {detail && <section className="data-panel detail-panel"><div className="panel-title"><h2>{detail === "inventory" ? "Revisión de inventario" : detail === "supplies" ? "Lista de reposición" : "Cobertura de garantía"}</h2><button className="text-button" onClick={() => setDetail(null)}>Cerrar</button></div>{detail === "inventory" && <div className="checklist"><label><input type="checkbox" defaultChecked />Herramientas del cuarto técnico</label><label><input type="checkbox" defaultChecked />Llaves y controles</label><label><input type="checkbox" />Repuestos del ascensor</label></div>}{detail === "supplies" && <div className="simple-list"><span>Desinfectante · 2 unidades</span><span>Bolsas industriales · 1 paquete</span><span>Focos LED · 3 unidades</span><span>Guantes · 1 caja</span></div>}{detail === "warranty" && <div className="simple-list"><strong>Bomba principal</strong><span>Proveedor: Hidroservicios Demo</span><span>Vigencia hasta diciembre de 2026</span><span>Cobertura: piezas y mano de obra</span></div>}</section>}
  </>;
}

export function ReservationsView({ tenant, onNotice, residentReservations, canVoid, onVoid }: Props & { residentReservations: ResidentReservation[]; canVoid: boolean; onVoid: (id: string) => void }) {
  const original = reservationsByTenant[tenant.id];
  const [date, setDate] = useState("2026-09-14");
  const [projector, setProjector] = useState(false);
  const [tables, setTables] = useState(0);
  const [created, setCreated] = useDemoState<string[]>(`admin-reservations:${tenant.id}`, []);
  const [error, setError] = useState("");
  const base = tenant.id === "los-jardines" ? 250 : 160;
  const deposit = tenant.id === "los-jardines" ? 300 : 200;
  const total = base + deposit + (projector ? 40 : 0) + tables * 10;
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (date === "2026-09-12" || created.includes(date)) { setError("Ese bloque ya está reservado. Elige otra fecha."); return; }
    setCreated((current) => [...current, date]); setError(""); onNotice("Solicitud creada en la demo: pendiente de validación de pago.");
  }
  return <>
    <ModuleHeading title="Reservas y garantías" description="Disponibilidad, desglose y devolución de garantías sin confundirlas con ingresos." />
    <div className="reservation-layout"><form className="data-panel reservation-form" onSubmit={submit}><div className="panel-title"><h2>Nueva solicitud</h2><span className="status neutral">Salón de eventos</span></div>
      <label className="field"><span>Unidad</span><select><option>{tenant.owner.unit}</option></select></label><label className="field"><span>Fecha</span><input type="date" min="2026-09-10" max="2026-09-30" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
      <fieldset><legend>Servicios opcionales</legend><label className="check-field compact-check"><input type="checkbox" checked={projector} onChange={(event) => setProjector(event.target.checked)} /><span>Proyector · S/ 40</span></label><label className="field"><span>Mesas adicionales · S/ 10 c/u</span><select value={tables} onChange={(event) => setTables(Number(event.target.value))}>{[0,1,2,3,4].map((value) => <option key={value}>{value}</option>)}</select></label></fieldset>
      {error && <p className="inline-error" role="alert">{error}</p>}<button className="primary-button">Crear solicitud</button><small>Confirmación sujeta a disponibilidad y verificación del pago.</small>
    </form><aside className="cost-breakdown"><h2>Desglose visible</h2><div><span>Alquiler y limpieza</span><strong>{money.format(base)}</strong></div><div><span>Servicios opcionales</span><strong>{money.format((projector ? 40 : 0) + tables * 10)}</strong></div><div><span>Garantía reembolsable</span><strong>{money.format(deposit)}</strong></div><div className="cost-total"><span>Total a reportar</span><strong>{money.format(total)}</strong></div><p>La garantía permanece separada del ingreso hasta su devolución o deducción aprobada.</p></aside></div>
    {residentReservations.length > 0 && <section className="data-panel resident-reservation-review"><div className="panel-title"><h2>Solicitudes desde la app</h2><span>{residentReservations.filter((item) => item.state === "requested").length} por atender</span></div>{residentReservations.map((item) => <article key={item.id}><span className="date-tile"><CalendarCheck />{item.date}</span><div><strong>{item.amenityName} · unidad {item.unit}</strong><small>{item.requestedBy}</small><small>Alquiler {money.format(item.rental)} · mantenimiento {money.format(item.maintenance)} · garantía {money.format(item.deposit)}</small></div><span className={`status ${item.state === "requested" ? "warning" : "soft"}`}>{item.state === "requested" ? "Solicitada" : item.state === "cancelled" ? "Cancelada" : "Anulada"}</span>{canVoid && item.state === "requested" && <button className="text-button danger-action" onClick={() => { onVoid(item.id); onNotice("Reserva anulada por un integrante de la junta; el historial se conserva."); }}>Anular registro</button>}</article>)}</section>}
    <section className="data-panel reservation-history"><div className="panel-title"><h2>Reservas y devoluciones</h2><span>{original.length + created.length + residentReservations.length} registros</span></div>{original.map((item) => <div className="reservation-row" key={`${item.unit}-${item.date}`}><span className="date-tile"><CalendarCheck />{item.date}</span><span><strong>{item.amenity} · {item.unit}</strong><small>{item.schedule}</small></span><span><small>Alquiler</small><strong>{money.format(item.rental)}</strong></span><span><small>Garantía</small><strong>{money.format(item.deposit)}</strong></span><span className={`status ${item.state === "confirmed" ? "success" : item.state === "refund" ? "warning" : "neutral"}`}>{item.state === "confirmed" ? "Confirmada" : item.state === "refund" ? "Por devolver" : "Pago pendiente"}</span></div>)}</section>
  </>;
}

export function AssembliesView({ tenant, onNotice }: Props) {
  const [attendance, setAttendance] = useDemoState<boolean[]>(`attendance:${tenant.id}`, [true, false, false]);
  const [link, setLink] = useDemoState(`meeting-link:${tenant.id}`, "");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-10-15");
  const [assemblies, setAssemblies] = useDemoState<Array<{ title: string; date: string }>>(`assemblies:${tenant.id}`, []);
  const representatives = tenant.people.slice(0, 3);
  function createAssembly(event: React.FormEvent) { event.preventDefault(); setAssemblies((current) => [{ title: title.trim(), date }, ...current]); setTitle(""); setCreating(false); onNotice("Convocatoria ficticia creada y añadida a la agenda."); }
  return <>
    <ModuleHeading title="Asambleas y acuerdos" description="Convocatoria, asistencia y representación separadas del derecho a voto." action={<button className="primary-button compact" aria-expanded={creating} onClick={() => setCreating((value) => !value)}><Plus />Nueva convocatoria</button>} />
    <DemoNotice />
    {creating && <form className="data-panel quick-create" onSubmit={createAssembly}><div className="panel-title"><h2>Nueva convocatoria ficticia</h2><span>Borrador</span></div><div className="quick-create-fields"><label className="field"><span>Asunto</span><input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Presupuesto anual" /></label><label className="field"><span>Fecha</span><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div><div className="form-actions"><button type="button" className="secondary-button compact" onClick={() => setCreating(false)}>Cancelar</button><button className="primary-button compact">Crear convocatoria</button></div></form>}
    {assemblies.length > 0 && <section className="session-records">{assemblies.map((item, index) => <span key={`${item.title}-${index}`}><CalendarDays />{item.title} · {item.date} · borrador</span>)}</section>}
    <section className="assembly-hero"><div><span className="status success">Convocada</span><h2>Pintura de áreas comunes</h2><p>20 sep. 2026 · 19:00 · modalidad mixta</p></div><div className="assembly-facts"><span><CalendarDays />Agenda fijada</span><span><FileText />3 documentos</span><span><Vote />Votación en preparación</span></div></section>
    <div className="finance-layout lower"><section className="data-panel"><div className="panel-title"><h2>Acceso a la reunión</h2><span>{link ? "Enlace guardado" : "Configuración manual"}</span></div><label className="field"><span>Enlace HTTPS de Meet, Zoom o Teams</span><input type="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://…" /></label><button className="primary-button compact" disabled={!link.startsWith("https://")} onClick={() => onNotice("Enlace ficticio guardado en este navegador; no se creó una reunión externa.")}>Guardar enlace</button></section>
      <section className="data-panel"><div className="panel-title"><h2>Asistencia revisada</h2><span>{attendance.filter(Boolean).length} de {representatives.length}</span></div>{representatives.map((person, index) => <label className="attendance-row" key={person.id}><input type="checkbox" checked={attendance[index] ?? false} onChange={(event) => setAttendance((current) => current.map((value, currentIndex) => currentIndex === index ? event.target.checked : value))} /><span><strong>{person.name}</strong><small>{person.scope}</small></span></label>)}<p className="legal-note"><AlertTriangle />Registrar asistencia no concede voto ni genera multas automáticamente.</p></section></div>
  </>;
}

export function DocumentsView({ tenant, onNotice }: Props) {
  const [query, setQuery] = useState("");
  const [added, setAdded] = useDemoState<string[]>(`documents:${tenant.id}`, []);
  const [preview, setPreview] = useState<{ name: string; category: string; access: string; version: string } | null>(null);
  const docs = [...documentsByTenant[tenant.id], ...added.map((name) => ({ name, category: "Carga demo", version: "v1", access: "Solo junta", date: "Hoy" }))].filter((doc) => doc.name.toLowerCase().includes(query.toLowerCase()));
  function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAdded((current) => [...current, file.name]); onNotice("Archivo añadido a la lista local. No se subió a ningún servidor."); event.target.value = "";
  }
  return <>
    <ModuleHeading title="Archivo del condominio" description="Documentos privados, versiones y acceso por audiencia." action={<label className="primary-button compact file-button"><Plus />Añadir a la demo<input type="file" accept=".pdf,.docx,.xlsx,.jpg,.png" onChange={upload} /></label>} />
    <DemoNotice />
    <section className="data-panel"><label className="search-field"><Search /><span className="sr-only">Buscar documentos</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar documento" /></label><div className="document-list">{docs.map((doc) => <article key={`${doc.name}-${doc.version}`}><span className="document-icon"><FileText /></span><span><strong>{doc.name}</strong><small>{doc.category} · actualizado {doc.date}</small></span><span><small>Versión</small><strong>{doc.version}</strong></span><span className="status neutral"><KeyRound />{doc.access}</span><button aria-label={`Abrir ${doc.name}`} onClick={() => setPreview(doc)}><ArrowRight /></button></article>)}</div>{docs.length === 0 && <p className="owner-empty">No encontramos documentos con ese nombre.</p>}</section>
    {preview && <section className="data-panel document-preview"><div className="panel-title"><div><h2>{preview.name}</h2><span>Vista previa ficticia</span></div><button className="text-button" onClick={() => setPreview(null)}>Cerrar</button></div><div className="document-sheet"><FileText /><strong>{preview.category}</strong><p>Este panel representa la visualización protegida del documento. El archivo y su contenido son ficticios y no se descargan.</p><span>{preview.version} · acceso: {preview.access}</span></div></section>}
  </>;
}

export function CommunicationsView({ tenant, onNotice }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("Todo el condominio");
  const [drafts, setDrafts] = useDemoState<Array<{ title: string; audience: string }>>(`communications:${tenant.id}`, []);
  function save(event: React.FormEvent) { event.preventDefault(); setDrafts((current) => [{ title, audience }, ...current]); setTitle(""); setMessage(""); onNotice("Borrador guardado en memoria; no se enviaron notificaciones."); }
  return <>
    <ModuleHeading title="Comunicados" description="Mensajes segmentados con estado de preparación y entrega." />
    <div className="finance-layout lower"><form className="data-panel" onSubmit={save}><div className="panel-title"><h2>Nuevo borrador</h2><Megaphone /></div><label className="field"><span>Título</span><input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Corte programado de agua" /></label><label className="field"><span>Destinatarios</span><select value={audience} onChange={(event) => setAudience(event.target.value)}><option>Todo el condominio</option>{tenant.towers.map((tower) => <option key={tower.id}>{tower.name}</option>)}<option>Solo propietarios</option></select></label><label className="field"><span>Mensaje</span><textarea required rows={4} value={message} onChange={(event) => setMessage(event.target.value)} /></label><button className="primary-button">Guardar borrador</button><small>No se enviará correo, push ni WhatsApp.</small></form>
      <section className="data-panel"><div className="panel-title"><h2>Centro de notificaciones</h2><span>{drafts.length + 2} elementos</span></div>{drafts.map((draft) => <div className="message-row" key={draft.title}><span className="task-icon"><Archive /></span><span><strong>{draft.title}</strong><small>{draft.audience}</small></span><span className="status neutral">Borrador</span></div>)}<div className="message-row"><span className="task-icon"><Mail /></span><span><strong>Mantenimiento del ascensor</strong><small>{tenant.towers[0].name} · centro de notificaciones</small></span><span className="status success">Publicado</span></div><div className="message-row"><span className="task-icon"><CalendarDays /></span><span><strong>Asamblea de propietarios</strong><small>Todo el condominio</small></span><span className="status neutral">Programado</span></div></section></div>
  </>;
}

export function IncidentsView({ tenant, onNotice }: Props) {
  const initial = incidentsByTenant[tenant.id];
  const [resolved, setResolved] = useDemoState<string[]>(`incidents-resolved:${tenant.id}`, initial.filter((incident) => incident.state === "resolved").map((incident) => incident.id));
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState(tenant.towers[0].name);
  const [added, setAdded] = useDemoState<Array<{ id: string; title: string; scope: string; opened: string; owner: string; severity: "medium"; state: "open" }>>(`incidents:${tenant.id}`, []);
  const incidents = [...added, ...initial];
  function createIncident(event: React.FormEvent) { event.preventDefault(); const id = `INC-${String(incidents.length + 1).padStart(3, "0")}`; setAdded((current) => [{ id, title: title.trim(), scope, opened: "hoy", owner: "Administración", severity: "medium", state: "open" }, ...current]); setTitle(""); setCreating(false); onNotice(`${id} creado y visible en el tablero ficticio.`); }
  return <>
    <ModuleHeading title="Incidencias" description="Seguimiento, responsables y acceso limitado a las unidades involucradas." action={<button className="primary-button compact" aria-expanded={creating} onClick={() => setCreating((value) => !value)}><Plus />Nueva incidencia</button>} />
    {creating && <form className="data-panel quick-create" onSubmit={createIncident}><div className="panel-title"><h2>Registrar incidencia ficticia</h2><span>Sin cargar fotografías reales</span></div><div className="quick-create-fields"><label className="field"><span>Descripción</span><input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Luz averiada en escalera" /></label><label className="field"><span>Ubicación</span><select value={scope} onChange={(event) => setScope(event.target.value)}>{tenant.towers.map((tower) => <option key={tower.id}>{tower.name}</option>)}<option>Área común</option></select></label></div><div className="form-actions"><button type="button" className="secondary-button compact" onClick={() => setCreating(false)}>Cancelar</button><button className="primary-button compact">Registrar incidencia</button></div></form>}
    <section className="data-panel"><div className="panel-title"><h2>Casos del condominio</h2><span>{incidents.filter((item) => !resolved.includes(item.id)).length} abiertos</span></div><div className="incident-board">{incidents.map((incident) => {
      const done = resolved.includes(incident.id);
      return <article key={incident.id}><span className={`severity-mark ${incident.severity}`} /><span><strong>{incident.title}</strong><small>{incident.id} · {incident.scope} · desde {incident.opened}</small></span><span><small>Responsable</small><strong>{incident.owner}</strong></span><span className={`status ${done ? "success" : incident.severity === "high" ? "warning" : "neutral"}`}>{done ? "Resuelta" : incident.state === "working" ? "En atención" : "Abierta"}</span>{!done && <button className="secondary-button compact" onClick={() => { setResolved((current) => [...current, incident.id]); onNotice(`${incident.id} marcado como resuelto en la demo.`); }}><CheckCircle2 />Resolver</button>}</article>;
    })}</div></section>
    <p className="legal-note standalone"><ShieldCheck />Los casos que vinculan varias unidades deben exponer información solo a involucrados y personal autorizado.</p>
  </>;
}

export function OperatorView({ onNotice }: Props) {
  const [support, setSupport] = useDemoState<"none" | "requested" | "approved">("operator-support", "none");
  const totalUnits = useMemo(() => 120, []);
  return <>
    <ModuleHeading title="Operación de Stoka Habita" description="Clientes, membresías y soporte excepcional separado de la información privada." />
    <section className="operator-warning"><ShieldCheck /><div><strong>Modo operador demostrativo</strong><span>No concede acceso a datos privados. El soporte real necesitará autorización temporal del tenant y auditoría.</span></div></section>
    <div className="metric-grid compact-metrics"><article className="metric-card"><span className="metric-icon"><Building2 /></span><div><span>Clientes demo</span><strong>2</strong><small>Ambos activos</small></div></article><article className="metric-card"><span className="metric-icon"><Users /></span><div><span>Unidades facturables</span><strong>{totalUnits}</strong><small>No incluye anexos vinculados</small></div></article><article className="metric-card"><span className="metric-icon"><Landmark /></span><div><span>Integraciones</span><strong>0</strong><small>Sin proveedores contratados</small></div></article></div>
    <section className="data-panel"><div className="responsive-table"><table><thead><tr><th>Cliente</th><th>Plan demo</th><th>Unidades</th><th>Membresía</th><th>Soporte</th></tr></thead><tbody><tr><td><strong>Los Jardines</strong></td><td>Gestión 51–100</td><td>96</td><td><span className="status success">Activa</span></td><td>Sin acceso</td></tr><tr><td><strong>Parque del Sol</strong></td><td>Gestión hasta 50</td><td>24</td><td><span className="status success">Activa</span></td><td>Sin acceso</td></tr></tbody></table></div></section>
    <section className="support-card"><span className="task-icon"><UserCheck /></span><div><h2>Solicitud de soporte temporal</h2><p>{support === "none" ? "Simula una autorización de 30 minutos sin abrir ningún dato del condominio." : support === "requested" ? "Solicitud pendiente de aprobación ficticia por la junta." : "Acceso ficticio aprobado por 30 minutos; el evento queda señalado para auditoría."}</p></div><div className="support-actions">{support === "none" && <button className="primary-button compact" onClick={() => { setSupport("requested"); onNotice("Solicitud ficticia creada; ahora puedes simular la aprobación de la junta."); }}>Solicitar autorización</button>}{support === "requested" && <><button className="secondary-button compact" onClick={() => setSupport("none")}>Cancelar</button><button className="primary-button compact" onClick={() => { setSupport("approved"); onNotice("La junta aprobó el acceso temporal ficticio por 30 minutos."); }}>Simular aprobación</button></>}{support === "approved" && <button className="secondary-button compact" onClick={() => { setSupport("none"); onNotice("Acceso temporal ficticio cerrado."); }}>Cerrar soporte</button>}</div></section>
  </>;
}

export function ContinuityView({ tenant, onNotice }: Props) {
  type HandoverKind = "board" | "administration";
  const handovers: Record<HandoverKind, {
    title: string;
    description: string;
    purpose: string;
    action: string;
    objective: string;
    parties: string;
    items: string[];
  }> = {
    board: {
      title: "Transferencia de junta de propietarios",
      description: "Para el relevo entre la junta saliente y la junta entrante.",
      purpose: "Ordena el cambio de autoridades sin perder decisiones ni documentos institucionales.",
      action: "Reúne actas, padrón, poderes, cierre financiero, contratos y pendientes para revisión conjunta.",
      objective: "Dejar constancia verificable de lo recibido, lo observado y la fecha efectiva del nuevo mandato.",
      parties: "Junta saliente → Junta entrante",
      items: ["Actas, acuerdos y libro de actas", "Padrón, poderes y representación vigente", "Cierre financiero y firmantes bancarios", "Contratos y asuntos legales pendientes", "Credenciales y canales institucionales", "Compromisos y plan de continuidad"],
    },
    administration: {
      title: "Transferencia de administración",
      description: "Para el cambio de empresa o persona administradora del condominio.",
      purpose: "Organiza el relevo del proveedor que ejecuta la operación diaria del condominio.",
      action: "Entrega conciliaciones, cobranza, proveedores, inventario, mantenimiento, casos abiertos y accesos operativos.",
      objective: "Asegurar un corte operativo claro, continuidad del servicio y revocación controlada de accesos anteriores.",
      parties: "Administración saliente → Administración entrante · supervisa la junta",
      items: ["Contabilidad y conciliación de corte", "Cobranza y pagos pendientes de validar", "Proveedores y contratos operativos", "Inventario, equipos, llaves y activos", "Mantenimiento, reservas e incidencias abiertas", "Accesos operativos y continuidad de servicios"],
    },
  };
  const [selected, setSelected] = useState<HandoverKind | null>(null);
  const [openHelp, setOpenHelp] = useState<HandoverKind | null>(null);
  const [checked, setChecked] = useState<Record<HandoverKind, boolean[]>>({
    board: [false, false, false, false, false, false],
    administration: [false, false, false, false, false, false],
  });
  const active = selected ? handovers[selected] : null;
  const activeChecks = selected ? checked[selected] : [];

  function choose(kind: HandoverKind) {
    setSelected(kind);
    setOpenHelp(null);
  }

  function toggleItem(index: number) {
    if (!selected) return;
    setChecked((current) => ({
      ...current,
      [selected]: current[selected].map((value, currentIndex) => currentIndex === index ? !value : value),
    }));
  }

  return <>
    <ModuleHeading title="Transferencias de gestión" description="Elige el tipo de relevo para revisar responsables, evidencias y pendientes sin mezclar la gestión institucional con la operativa." />
    <section className="handover-choice" aria-labelledby="handover-choice-title">
      <div className="handover-choice-heading"><div><h2 id="handover-choice-title">¿Qué gestión va a cambiar?</h2><p>Selecciona una opción para abrir su lista de entrega.</p></div><span className="status neutral">2 procesos distintos</span></div>
      <div className="handover-options">
        {(Object.entries(handovers) as Array<[HandoverKind, typeof handovers[HandoverKind]]>).map(([kind, option]) => {
          const tooltipId = `handover-help-${kind}`;
          const isSelected = selected === kind;
          const isHelpOpen = openHelp === kind;
          return <article className={`handover-option ${isSelected ? "selected" : ""} ${isHelpOpen ? "is-help-open" : ""}`} key={kind}>
            <div className="handover-option-top"><span className="handover-option-icon">{kind === "board" ? <Users /> : <Building2 />}</span><span><strong>{option.title}</strong><small>{option.parties}</small></span><button type="button" className="handover-help" aria-label={`Más información sobre ${option.title}`} aria-describedby={tooltipId} aria-expanded={isHelpOpen} onClick={() => setOpenHelp(isHelpOpen ? null : kind)}><Info /></button>
              <div className="handover-tooltip" id={tooltipId} role="tooltip"><p><strong>Para qué sirve</strong>{option.purpose}</p><p><strong>Qué hace</strong>{option.action}</p><p><strong>Objetivo</strong>{option.objective}</p></div>
            </div>
            <button type="button" className="handover-select" aria-pressed={isSelected} aria-describedby={tooltipId} onClick={() => choose(kind)}><span>{option.description}</span><strong>{isSelected ? "Opción seleccionada" : "Elegir esta transferencia"}<ArrowRight /></strong></button>
          </article>;
        })}
      </div>
    </section>
    {!active && <section className="handover-empty"><ClipboardCheck /><div><h2>Selecciona el tipo de transferencia</h2><p>Así podremos mostrar solo los responsables y bloques que corresponden al relevo.</p></div></section>}
    {selected && active && <section className="handover-panel" aria-live="polite"><div className="handover-panel-heading"><div><span className="status neutral">Expediente demo</span><h2>{active.title}</h2><p>{active.parties}</p></div><button type="button" className="text-button" onClick={() => setSelected(null)}>Cambiar tipo</button></div><div className="handover-progress"><span>{activeChecks.filter(Boolean).length} de {active.items.length} bloques verificados</span><div className="progress"><span style={{ width: `${activeChecks.filter(Boolean).length / active.items.length * 100}%` }} /></div></div>{active.items.map((item, index) => <label className="handover-row" key={item}><input type="checkbox" checked={activeChecks[index]} onChange={() => toggleItem(index)} /><span><strong>{item}</strong><small>{activeChecks[index] ? "Entregado y revisado" : "Pendiente de revisión"}</small></span><span className={`status ${activeChecks[index] ? "success" : "warning"}`}>{activeChecks[index] ? "Conforme" : "Pendiente"}</span></label>)}<button className="primary-button" disabled={!activeChecks.every(Boolean)} onClick={() => onNotice(`${active.title} de ${tenant.name} marcada como aceptada solo en la demo. No se firmó un acta real.`)}>Aceptar transferencia demo</button></section>}
  </>;
}
