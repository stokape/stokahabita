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
import { assetsByTenant, documentsByTenant, financeByTenant, incidentsByTenant, reservationsByTenant } from "@/data/demo/operations";

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
  const units = tenant.units.filter((unit) => unit.label.toLowerCase().includes(query.toLowerCase()));
  const occupied = tenant.units.filter((unit) => unit.occupancy !== "vacant").length;
  return <>
    <ModuleHeading title="Unidades" description="Departamentos y anexos organizados dentro del condominio." action={<button className="primary-button compact" onClick={() => onNotice("Formulario de unidad preparado en la demo; no se guardó en el servidor.")}><Plus />Nueva unidad</button>} />
    <div className="inline-stats"><span><strong>{tenant.units.length}</strong> departamentos</span><span><strong>{occupied}</strong> ocupados</span><span><strong>{tenant.units.filter((unit) => unit.annexIds.length > 0).length}</strong> con anexos</span></div>
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
  const gap = tenant.commitments - tenant.operationalBalance - simulation;
  return <>
    <ModuleHeading title="Finanzas" description="Cobranza, compromisos y deuda sin mezclar periodos ni fondos." action={<button className="primary-button compact" onClick={() => onNotice("Emisión demo preparada. No se generaron recibos reales.")}><Plus />Preparar emisión</button>} />
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
  const [completed, setCompleted] = useState<string[]>(initial.filter((asset) => asset.state === "done").map((asset) => asset.code));
  return <>
    <ModuleHeading title="Mantenimiento e inventario" description="Equipos identificados, tareas programadas y evidencia de ejecución." action={<button className="primary-button compact" onClick={() => onNotice("Ficha demo de activo preparada; aún no se persistió.")}><Plus />Nuevo activo</button>} />
    <DemoNotice />
    <section className="data-panel"><div className="panel-title"><h2>Plan preventivo</h2><span>{initial.length} activos controlados</span></div><div className="asset-list">{initial.map((asset) => {
      const done = completed.includes(asset.code);
      return <article className="asset-row" key={asset.code}><span className="asset-icon"><Wrench /></span><span><strong>{asset.name}</strong><small>{asset.code} · {asset.location}</small></span><span><small>Frecuencia</small><strong>{asset.frequency}</strong></span><span><small>Próxima revisión</small><strong>{done ? "Completada" : asset.next}</strong></span><span className={`status ${done ? "success" : asset.state === "attention" ? "warning" : "neutral"}`}>{done ? "Realizado" : asset.state === "attention" ? "Revisar garantía" : "Programado"}</span>{!done && <button className="secondary-button compact" onClick={() => { setCompleted((current) => [...current, asset.code]); onNotice(`Ejecución de ${asset.code} registrada solo en la demo.`); }}><Check />Registrar</button>}</article>;
    })}</div></section>
    <div className="module-cards"><article><ClipboardCheck /><div><strong>Revisión de inventario</strong><span>2 de 3 elementos verificados</span></div><button onClick={() => onNotice("La revisión demo quedó marcada en progreso.")}>Continuar</button></article><article><PackageCheck /><div><strong>Consumibles</strong><span>4 existencias bajo mínimo</span></div><button onClick={() => onNotice("Se abrió la lista demo de reposición.")}>Revisar</button></article><article><FileClock /><div><strong>Garantías</strong><span>Bomba principal · vence dic. 2026</span></div><button onClick={() => onNotice("Cobertura demo revisada; no se contactó al proveedor.")}>Ver cobertura</button></article></div>
  </>;
}

export function ReservationsView({ tenant, onNotice }: Props) {
  const original = reservationsByTenant[tenant.id];
  const [date, setDate] = useState("2026-09-14");
  const [projector, setProjector] = useState(false);
  const [tables, setTables] = useState(0);
  const [created, setCreated] = useState<string[]>([]);
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
    <section className="data-panel reservation-history"><div className="panel-title"><h2>Reservas y devoluciones</h2><span>{original.length + created.length} registros</span></div>{original.map((item) => <div className="reservation-row" key={`${item.unit}-${item.date}`}><span className="date-tile"><CalendarCheck />{item.date}</span><span><strong>{item.amenity} · {item.unit}</strong><small>{item.schedule}</small></span><span><small>Alquiler</small><strong>{money.format(item.rental)}</strong></span><span><small>Garantía</small><strong>{money.format(item.deposit)}</strong></span><span className={`status ${item.state === "confirmed" ? "success" : item.state === "refund" ? "warning" : "neutral"}`}>{item.state === "confirmed" ? "Confirmada" : item.state === "refund" ? "Por devolver" : "Pago pendiente"}</span></div>)}</section>
  </>;
}

export function AssembliesView({ tenant, onNotice }: Props) {
  const [attendance, setAttendance] = useState([true, false, false]);
  const [link, setLink] = useState("");
  const representatives = tenant.people.slice(0, 3);
  return <>
    <ModuleHeading title="Asambleas y acuerdos" description="Convocatoria, asistencia y representación separadas del derecho a voto." action={<button className="primary-button compact" onClick={() => onNotice("Borrador de convocatoria creado solo en la demo.")}><Plus />Nueva convocatoria</button>} />
    <DemoNotice />
    <section className="assembly-hero"><div><span className="status success">Convocada</span><h2>Pintura de áreas comunes</h2><p>20 sep. 2026 · 19:00 · modalidad mixta</p></div><div className="assembly-facts"><span><CalendarDays />Agenda fijada</span><span><FileText />3 documentos</span><span><Vote />Votación en preparación</span></div></section>
    <div className="finance-layout lower"><section className="data-panel"><div className="panel-title"><h2>Acceso a la reunión</h2><span>Configuración manual</span></div><label className="field"><span>Enlace HTTPS de Meet, Zoom o Teams</span><input type="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://…" /></label><button className="primary-button compact" disabled={!link.startsWith("https://")} onClick={() => onNotice("Enlace guardado en la demo; no se creó una reunión externa.")}>Guardar enlace</button></section>
      <section className="data-panel"><div className="panel-title"><h2>Asistencia revisada</h2><span>{attendance.filter(Boolean).length} de {representatives.length}</span></div>{representatives.map((person, index) => <label className="attendance-row" key={person.id}><input type="checkbox" checked={attendance[index] ?? false} onChange={(event) => setAttendance((current) => current.map((value, currentIndex) => currentIndex === index ? event.target.checked : value))} /><span><strong>{person.name}</strong><small>{person.scope}</small></span></label>)}<p className="legal-note"><AlertTriangle />Registrar asistencia no concede voto ni genera multas automáticamente.</p></section></div>
  </>;
}

export function DocumentsView({ tenant, onNotice }: Props) {
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const docs = [...documentsByTenant[tenant.id], ...added.map((name) => ({ name, category: "Carga demo", version: "v1", access: "Solo junta", date: "Hoy" }))].filter((doc) => doc.name.toLowerCase().includes(query.toLowerCase()));
  function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAdded((current) => [...current, file.name]); onNotice("Archivo añadido a la lista local. No se subió a ningún servidor."); event.target.value = "";
  }
  return <>
    <ModuleHeading title="Archivo del condominio" description="Documentos privados, versiones y acceso por audiencia." action={<label className="primary-button compact file-button"><Plus />Añadir a la demo<input type="file" accept=".pdf,.docx,.xlsx,.jpg,.png" onChange={upload} /></label>} />
    <DemoNotice />
    <section className="data-panel"><label className="search-field"><Search /><span className="sr-only">Buscar documentos</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar documento" /></label><div className="document-list">{docs.map((doc) => <article key={`${doc.name}-${doc.version}`}><span className="document-icon"><FileText /></span><span><strong>{doc.name}</strong><small>{doc.category} · actualizado {doc.date}</small></span><span><small>Versión</small><strong>{doc.version}</strong></span><span className="status neutral"><KeyRound />{doc.access}</span><button aria-label={`Abrir ${doc.name}`} onClick={() => onNotice("Vista previa ficticia: el archivo no está almacenado.")}><ArrowRight /></button></article>)}</div></section>
  </>;
}

export function CommunicationsView({ tenant, onNotice }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("Todo el condominio");
  const [drafts, setDrafts] = useState<Array<{ title: string; audience: string }>>([]);
  function save(event: React.FormEvent) { event.preventDefault(); setDrafts((current) => [{ title, audience }, ...current]); setTitle(""); setMessage(""); onNotice("Borrador guardado en memoria; no se enviaron notificaciones."); }
  return <>
    <ModuleHeading title="Comunicados" description="Mensajes segmentados con estado de preparación y entrega." />
    <div className="finance-layout lower"><form className="data-panel" onSubmit={save}><div className="panel-title"><h2>Nuevo borrador</h2><Megaphone /></div><label className="field"><span>Título</span><input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Corte programado de agua" /></label><label className="field"><span>Destinatarios</span><select value={audience} onChange={(event) => setAudience(event.target.value)}><option>Todo el condominio</option>{tenant.towers.map((tower) => <option key={tower.id}>{tower.name}</option>)}<option>Solo propietarios</option></select></label><label className="field"><span>Mensaje</span><textarea required rows={4} value={message} onChange={(event) => setMessage(event.target.value)} /></label><button className="primary-button">Guardar borrador</button><small>No se enviará correo, push ni WhatsApp.</small></form>
      <section className="data-panel"><div className="panel-title"><h2>Centro de notificaciones</h2><span>{drafts.length + 2} elementos</span></div>{drafts.map((draft) => <div className="message-row" key={draft.title}><span className="task-icon"><Archive /></span><span><strong>{draft.title}</strong><small>{draft.audience}</small></span><span className="status neutral">Borrador</span></div>)}<div className="message-row"><span className="task-icon"><Mail /></span><span><strong>Mantenimiento del ascensor</strong><small>{tenant.towers[0].name} · centro de notificaciones</small></span><span className="status success">Publicado</span></div><div className="message-row"><span className="task-icon"><CalendarDays /></span><span><strong>Asamblea de propietarios</strong><small>Todo el condominio</small></span><span className="status neutral">Programado</span></div></section></div>
  </>;
}

export function IncidentsView({ tenant, onNotice }: Props) {
  const initial = incidentsByTenant[tenant.id];
  const [resolved, setResolved] = useState<string[]>(initial.filter((incident) => incident.state === "resolved").map((incident) => incident.id));
  return <>
    <ModuleHeading title="Incidencias" description="Seguimiento, responsables y acceso limitado a las unidades involucradas." action={<button className="primary-button compact" onClick={() => onNotice("Formulario demo de incidencia abierto; no se cargaron fotos.")}><Plus />Nueva incidencia</button>} />
    <section className="data-panel"><div className="panel-title"><h2>Casos del condominio</h2><span>{initial.filter((item) => !resolved.includes(item.id)).length} abiertos</span></div><div className="incident-board">{initial.map((incident) => {
      const done = resolved.includes(incident.id);
      return <article key={incident.id}><span className={`severity-mark ${incident.severity}`} /><span><strong>{incident.title}</strong><small>{incident.id} · {incident.scope} · desde {incident.opened}</small></span><span><small>Responsable</small><strong>{incident.owner}</strong></span><span className={`status ${done ? "success" : incident.severity === "high" ? "warning" : "neutral"}`}>{done ? "Resuelta" : incident.state === "working" ? "En atención" : "Abierta"}</span>{!done && <button className="secondary-button compact" onClick={() => { setResolved((current) => [...current, incident.id]); onNotice(`${incident.id} marcado como resuelto en la demo.`); }}><CheckCircle2 />Resolver</button>}</article>;
    })}</div></section>
    <p className="legal-note standalone"><ShieldCheck />Los casos que vinculan varias unidades deben exponer información solo a involucrados y personal autorizado.</p>
  </>;
}

export function OperatorView({ onNotice }: Props) {
  const [support, setSupport] = useState(false);
  const totalUnits = useMemo(() => 120, []);
  return <>
    <ModuleHeading title="Operación de Stoka Habita" description="Clientes, membresías y soporte excepcional separado de la información privada." />
    <section className="operator-warning"><ShieldCheck /><div><strong>Modo operador demostrativo</strong><span>No concede acceso a datos privados. El soporte real necesitará autorización temporal del tenant y auditoría.</span></div></section>
    <div className="metric-grid compact-metrics"><article className="metric-card"><span className="metric-icon"><Building2 /></span><div><span>Clientes demo</span><strong>2</strong><small>Ambos activos</small></div></article><article className="metric-card"><span className="metric-icon"><Users /></span><div><span>Unidades facturables</span><strong>{totalUnits}</strong><small>No incluye anexos vinculados</small></div></article><article className="metric-card"><span className="metric-icon"><Landmark /></span><div><span>Integraciones</span><strong>0</strong><small>Sin proveedores contratados</small></div></article></div>
    <section className="data-panel"><div className="responsive-table"><table><thead><tr><th>Cliente</th><th>Plan demo</th><th>Unidades</th><th>Membresía</th><th>Soporte</th></tr></thead><tbody><tr><td><strong>Los Jardines</strong></td><td>Gestión 51–100</td><td>96</td><td><span className="status success">Activa</span></td><td>Sin acceso</td></tr><tr><td><strong>Parque del Sol</strong></td><td>Gestión hasta 50</td><td>24</td><td><span className="status success">Activa</span></td><td>Sin acceso</td></tr></tbody></table></div></section>
    <section className="support-card"><span className="task-icon"><UserCheck /></span><div><h2>Solicitud de soporte temporal</h2><p>Simula una autorización de 30 minutos sin abrir ningún dato del condominio.</p></div><button className={support ? "secondary-button compact" : "primary-button compact"} onClick={() => { setSupport((value) => !value); onNotice(support ? "Solicitud demo cancelada." : "Solicitud demo creada; requiere aprobación de la junta."); }}>{support ? "Cancelar solicitud" : "Solicitar autorización"}</button></section>
  </>;
}

export function ContinuityView({ tenant, onNotice }: Props) {
  const [checked, setChecked] = useState([true, true, false, false, false]);
  const items = ["Saldos y cuentas bancarias", "Contratos vigentes", "Inventario y llaves", "Documentos y versiones", "Incidencias y compromisos pendientes"];
  return <>
    <ModuleHeading title="Entrega de gestión" description="Transferencia verificable para que el condominio sobreviva al cambio de personas." />
    <section className="handover-panel"><div className="handover-progress"><span>{checked.filter(Boolean).length} de {items.length} bloques verificados</span><div className="progress"><span style={{ width: `${checked.filter(Boolean).length / items.length * 100}%` }} /></div></div>{items.map((item, index) => <label className="handover-row" key={item}><input type="checkbox" checked={checked[index]} onChange={(event) => setChecked((current) => current.map((value, currentIndex) => currentIndex === index ? event.target.checked : value))} /><span><strong>{item}</strong><small>{checked[index] ? "Entregado y revisado" : "Pendiente de revisión"}</small></span><span className={`status ${checked[index] ? "success" : "warning"}`}>{checked[index] ? "Conforme" : "Pendiente"}</span></label>)}<button className="primary-button" disabled={!checked.every(Boolean)} onClick={() => onNotice(`Entrega demo de ${tenant.name} marcada como aceptada. No se firmó un acta real.`)}>Aceptar entrega demo</button></section>
  </>;
}
