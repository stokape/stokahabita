"use client";

import { ArrowRight, BellRing, Check, ClipboardList, HandCoins, Mail, Package, Plus, Send, ShieldCheck, Smartphone, Truck, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Tenant } from "@/domain/models";
import type { AccessRequest, PlateAuthorization } from "@/domain/community";
import { arrearsByTenant, conciergeByTenant, paymentReminderRecipientsByTenant, providersByTenant, type PaymentReminder } from "@/data/demo/advanced";
import { ConciergeAuthorizedAccess } from "@/features/community-access";
import { useDemoState } from "@/lib/demo-storage";

const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 });
type Props = { tenant: Tenant; onNotice: (message: string) => void };

function ModuleHeading({ title, description }: { title: string; description: string }) {
  return <div className="module-heading"><div><h1>{title}</h1><p>{description}</p></div></div>;
}

function DemoNotice({ children }: { children: React.ReactNode }) {
  return <p className="module-demo-note"><ShieldCheck />{children}</p>;
}

export function ArrearsView({ tenant, onNotice }: Props) {
  const cases = arrearsByTenant[tenant.id];
  const [selected, setSelected] = useState(cases[0]?.id ?? "");
  const [initialPayment, setInitialPayment] = useState(300);
  const [installments, setInstallments] = useState(3);
  const [proposed, setProposed] = useDemoState<string[]>(`arrears-proposals:${tenant.id}`, []);
  const active = cases.find((item) => item.id === selected) ?? cases[0];
  const remaining = Math.max(0, active.balance - initialPayment);
  const installmentAmount = remaining / installments;

  function prepareProposal(event: React.FormEvent) {
    event.preventDefault();
    setProposed((current) => current.includes(active.id) ? current : [...current, active.id]);
    onNotice(`Propuesta de ${active.unit} preparada solo en la demo; no cambió la deuda ni se contactó al responsable.`);
  }

  return <>
    <ModuleHeading title="Morosidad y convenios" description="Seguimiento privado de deuda, compromisos y próximas acciones sin aplicar intereses automáticos." />
    <DemoNotice>Los importes y contactos son ficticios. Preparar una propuesta no modifica la deuda ni crea un acuerdo válido.</DemoNotice>
    <div className="arrears-layout">
      <section className="data-panel"><div className="panel-title"><h2>Casos en seguimiento</h2><span>{cases.length} unidades</span></div><div className="case-list">
        {cases.map((item) => <button key={item.id} className={`case-row ${selected === item.id ? "selected" : ""}`} onClick={() => setSelected(item.id)} aria-pressed={selected === item.id}>
          <span><strong>{item.unit}</strong><small>{item.id} · último contacto {item.contact}</small></span>
          <span><small>{item.age}</small><strong>{money.format(item.balance)}</strong></span>
          <span className={`status ${item.state === "agreement" ? "success" : item.state === "proposal" ? "warning" : "neutral"}`}>{proposed.includes(item.id) ? "Propuesta preparada" : item.state === "agreement" ? "Convenio activo" : item.state === "proposal" ? "Por revisar" : "Seguimiento"}</span>
        </button>)}
      </div></section>
      <form className="data-panel proposal-form" onSubmit={prepareProposal}><div className="panel-title"><h2>Propuesta para {active.unit}</h2><HandCoins /></div>
        <div className="proposal-balance"><span>Saldo informado</span><strong>{money.format(active.balance)}</strong><small>{active.nextAction}</small></div>
        <label className="field"><span>Pago inicial</span><input aria-label="Pago inicial" type="number" min="0" max={active.balance} step="50" value={initialPayment} onChange={(event) => setInitialPayment(Number(event.target.value))} /></label>
        <label className="field"><span>Número de cuotas</span><select aria-label="Número de cuotas" value={installments} onChange={(event) => setInstallments(Number(event.target.value))}>{[2,3,4,6].map((value) => <option key={value} value={value}>{value} cuotas</option>)}</select></label>
        <div className="proposal-result"><span>Proyección sin intereses</span><strong>{installments} × {money.format(installmentAmount)}</strong><small>Más un pago inicial de {money.format(initialPayment)}</small></div>
        <button className="primary-button"><ClipboardList />Preparar propuesta</button>
        <small>Requiere revisión y aceptación fuera de esta demo.</small>
      </form>
    </div>
  </>;
}

export function PaymentRemindersView({ tenant, sender, sentReminders, onSend, onNotice }: Props & { sender: string; sentReminders: PaymentReminder[]; onSend: (reminder: PaymentReminder) => void }) {
  const recipients = paymentReminderRecipientsByTenant[tenant.id];
  const [selected, setSelected] = useState<string[]>([]);
  const [channels, setChannels] = useState<Array<"app" | "email">>(["app", "email"]);
  const [message, setMessage] = useState("Te recordamos que tienes una cuota de mantenimiento pendiente. Revisa el detalle en Stoka Habita o responde este correo si ya realizaste el pago.");
  const selectedRecipients = recipients.filter((recipient) => selected.includes(recipient.id));
  const total = selectedRecipients.reduce((sum, recipient) => sum + recipient.balance, 0);

  function toggleRecipient(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleChannel(channel: "app" | "email") {
    setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]);
  }

  function sendReminder(event: React.FormEvent) {
    event.preventDefault();
    if (!selected.length || !channels.length || !message.trim()) return;
    onSend({ id: `REM-${tenant.id}-${sentReminders.length + 1}`, tenantId: tenant.id, units: selectedRecipients.map((recipient) => recipient.unit), sender, message: message.trim(), channels, sentAt: "Ahora" });
    const channelCopy = channels.length === 2 ? "la app demo y el correo simulado" : channels[0] === "app" ? "la app demo" : "el correo simulado";
    onNotice(`${selected.length} ${selected.length === 1 ? "alerta preparada" : "alertas preparadas"} para ${channelCopy}. No se envió ningún correo real.`);
  }

  return <>
    <ModuleHeading title="Alertas de pago" description="Recordatorios dirigidos a responsables con cuotas pendientes, desde un solo flujo controlado." />
    <DemoNotice>Las alertas aparecen dentro del portal del propietario durante esta sesión. El correo se simula: aún no existe un proveedor de envío conectado.</DemoNotice>
    <form className="reminder-layout" onSubmit={sendReminder}>
      <section className="data-panel recipient-panel">
        <div className="panel-title"><div><h2>Destinatarios pendientes</h2><span>{recipients.length} responsables ficticios</span></div><button type="button" className="text-button" onClick={() => setSelected(selected.length === recipients.length ? [] : recipients.map((recipient) => recipient.id))}>{selected.length === recipients.length ? "Quitar selección" : "Seleccionar todos"}</button></div>
        <div className="recipient-list">{recipients.map((recipient) => <label key={recipient.id} className={selected.includes(recipient.id) ? "selected" : ""}><input type="checkbox" checked={selected.includes(recipient.id)} onChange={() => toggleRecipient(recipient.id)} /><span><strong>{recipient.unit} · {recipient.name}</strong><small>{recipient.email} · venció {recipient.dueDate}</small></span><b>{money.format(recipient.balance)}</b></label>)}</div>
      </section>
      <section className="data-panel reminder-compose">
        <div className="panel-title"><h2>Preparar alerta</h2><BellRing /></div>
        <fieldset className="channel-options"><legend>Canales</legend><label><input type="checkbox" checked={channels.includes("app")} onChange={() => toggleChannel("app")} /><Smartphone /><span><strong>App del propietario</strong><small>Visible en su portal demo</small></span></label><label><input type="checkbox" checked={channels.includes("email")} onChange={() => toggleChannel("email")} /><Mail /><span><strong>Correo electrónico</strong><small>Simulado, sin envío externo</small></span></label></fieldset>
        <label className="field"><span>Mensaje</span><textarea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
        <div className="reminder-summary"><span>{selected.length} {selected.length === 1 ? "destinatario" : "destinatarios"}</span><strong>{money.format(total)} pendiente</strong></div>
        <button className="primary-button" disabled={!selected.length || !channels.length || !message.trim()}><Send />Enviar alertas en demo</button>
      </section>
    </form>
    {sentReminders.length > 0 && <section className="data-panel delivery-panel"><div className="panel-title"><h2>Actividad de esta sesión</h2><span>{sentReminders.length} {sentReminders.length === 1 ? "envío" : "envíos"}</span></div>{sentReminders.map((reminder) => <article key={reminder.id}><span className="task-icon"><Check /></span><span><strong>{reminder.units.join(", ")}</strong><small>{reminder.sender} · {reminder.sentAt}</small></span><span>{reminder.channels.includes("app") ? "App demo entregada" : "Sin app"}<small>{reminder.channels.includes("email") ? "Correo simulado" : "Sin correo"}</small></span></article>)}</section>}
  </>;
}

export function ProvidersView({ tenant, onNotice }: Props) {
  const providers = providersByTenant[tenant.id];
  const candidates = providers.filter((item) => item.service.includes("cotización") || item.state === "review");
  const [shortlisted, setShortlisted] = useDemoState<string[]>(`providers:${tenant.id}`, []);
  return <>
    <ModuleHeading title="Proveedores y concursos" description="Contratos, vencimientos y cotizaciones comparables con una decisión documentada." />
    <DemoNotice>No se contrata ni contacta a proveedores desde este flujo demostrativo.</DemoNotice>
    <section className="data-panel"><div className="panel-title"><h2>Directorio y contratos</h2><span>{providers.length} registros</span></div><div className="responsive-table"><table><thead><tr><th>Proveedor</th><th>Servicio</th><th>Importe mensual</th><th>Vigencia</th><th>Estado</th></tr></thead><tbody>{providers.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small className="cell-note">{item.id}</small></td><td>{item.service}</td><td className="number-cell">{money.format(item.monthly)}</td><td>{item.contractEnd}</td><td><span className={`status ${item.state === "current" ? "success" : item.state === "review" ? "warning" : "neutral"}`}>{item.state === "current" ? "Vigente" : item.state === "review" ? "Por renovar" : "Cotización"}</span></td></tr>)}</tbody></table></div></section>
    <section className="comparison-panel"><div className="panel-title"><h2>Comparación para ascensores</h2><span>Decisión demo</span></div><div className="quote-grid">{candidates.map((item) => {
      const selected = shortlisted.includes(item.id);
      return <article key={item.id} className={selected ? "selected" : ""}><div><span className="task-icon"><Truck /></span><span><strong>{item.name}</strong><small>{item.service}</small></span></div><strong className="quote-amount">{money.format(item.monthly)}<small>/ mes</small></strong><dl><div><dt>Vigencia</dt><dd>{item.contractEnd}</dd></div><div><dt>Evaluación</dt><dd>{item.state === "review" ? "Proveedor actual" : "Alternativa"}</dd></div></dl><button className={selected ? "secondary-button compact" : "primary-button compact"} onClick={() => { setShortlisted((current) => selected ? current.filter((id) => id !== item.id) : [...current, item.id]); onNotice(selected ? `${item.name} retirado de la preselección demo.` : `${item.name} añadido a la preselección demo; no se envió una invitación.`); }}>{selected ? <><Check />Preseleccionado</> : <>Preseleccionar <ArrowRight /></>}</button></article>;
    })}</div></section>
  </>;
}

export function ConciergeView({ tenant, onNotice, authorizedRequests, activePlates, onAccessState }: Props & { authorizedRequests: AccessRequest[]; activePlates: PlateAuthorization[]; onAccessState: (id: string, state: AccessRequest["state"]) => void }) {
  const initial = conciergeByTenant[tenant.id];
  const [entries, setEntries] = useDemoState(`concierge:${tenant.id}`, initial);
  const [kind, setKind] = useState<"Visita" | "Paquete" | "Trabajo">("Visita");
  const [detail, setDetail] = useState("");
  const [unit, setUnit] = useState(tenant.owner.unit);
  const openCount = useMemo(() => entries.filter((item) => item.state !== "closed").length, [entries]);

  function addEntry(event: React.FormEvent) {
    event.preventDefault();
    const id = `DEM-${String(entries.length + 1).padStart(3, "0")}`;
    setEntries((current) => [{ id, kind, detail, unit, time: "Ahora", state: kind === "Paquete" ? "waiting" : "inside" }, ...current]);
    setDetail("");
    onNotice(`${kind} registrada solo en esta pestaña. No se notificó a la unidad.`);
  }

  function closeEntry(id: string, kind: string) {
    setEntries((current) => current.map((item) => item.id === id ? { ...item, state: "closed" } : item));
    onNotice(`${kind} marcada como cerrada en la demo.`);
  }

  return <>
    <ModuleHeading title="Portería" description="Registro mínimo de visitas, paquetes y trabajos con acceso limitado al turno operativo." />
    <DemoNotice>La portería demo ve solo lo necesario para atender el ingreso; no expone finanzas ni documentos privados.</DemoNotice>
    <ConciergeAuthorizedAccess requests={authorizedRequests} plates={activePlates} onState={onAccessState} onNotice={onNotice} />
    <div className="concierge-layout"><form className="data-panel concierge-form" onSubmit={addEntry}><div className="panel-title"><h2>Nuevo registro</h2><Plus /></div>
      <label className="field"><span>Tipo</span><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option>Visita</option><option>Paquete</option><option>Trabajo</option></select></label>
      <label className="field"><span>{kind === "Paquete" ? "Empresa o remitente" : "Nombre o descripción"}</span><input required value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={kind === "Paquete" ? "Ej. Olva Courier" : "Ej. Carmen Ruiz"} /></label>
      <label className="field"><span>Unidad o destino</span><input required value={unit} onChange={(event) => setUnit(event.target.value)} /></label>
      <button className="primary-button"><UserRoundCheck />Registrar en demo</button><small>No solicita ni almacena un documento de identidad real.</small>
    </form><section className="data-panel"><div className="panel-title"><h2>Turno actual</h2><span>{openCount} por atender</span></div><div className="concierge-list">{entries.map((item) => <article key={item.id}><span className="task-icon">{item.kind === "Paquete" ? <Package /> : <UserRoundCheck />}</span><span><strong>{item.detail}</strong><small>{item.kind} · {item.unit} · {item.time}</small></span><span className={`status ${item.state === "closed" ? "success" : item.state === "waiting" ? "warning" : "neutral"}`}>{item.state === "closed" ? "Cerrado" : item.state === "waiting" ? "Por entregar" : "En interior"}</span>{item.state !== "closed" && <button className="secondary-button compact" onClick={() => closeEntry(item.id, item.kind)}>{item.kind === "Paquete" ? "Entregar" : "Registrar salida"}</button>}</article>)}</div></section></div>
  </>;
}
