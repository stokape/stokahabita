"use client";

import { ArrowRight, Check, ClipboardList, HandCoins, Package, Plus, ShieldCheck, Truck, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Tenant } from "@/domain/models";
import { arrearsByTenant, conciergeByTenant, providersByTenant } from "@/data/demo/advanced";

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
  const [proposed, setProposed] = useState<string[]>([]);
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

export function ProvidersView({ tenant, onNotice }: Props) {
  const providers = providersByTenant[tenant.id];
  const candidates = providers.filter((item) => item.service.includes("cotización") || item.state === "review");
  const [shortlisted, setShortlisted] = useState<string[]>([]);
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

export function ConciergeView({ tenant, onNotice }: Props) {
  const initial = conciergeByTenant[tenant.id];
  const [entries, setEntries] = useState(initial);
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
    <div className="concierge-layout"><form className="data-panel concierge-form" onSubmit={addEntry}><div className="panel-title"><h2>Nuevo registro</h2><Plus /></div>
      <label className="field"><span>Tipo</span><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option>Visita</option><option>Paquete</option><option>Trabajo</option></select></label>
      <label className="field"><span>{kind === "Paquete" ? "Empresa o remitente" : "Nombre o descripción"}</span><input required value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={kind === "Paquete" ? "Ej. Olva Courier" : "Ej. Carmen Ruiz"} /></label>
      <label className="field"><span>Unidad o destino</span><input required value={unit} onChange={(event) => setUnit(event.target.value)} /></label>
      <button className="primary-button"><UserRoundCheck />Registrar en demo</button><small>No solicita ni almacena un documento de identidad real.</small>
    </form><section className="data-panel"><div className="panel-title"><h2>Turno actual</h2><span>{openCount} por atender</span></div><div className="concierge-list">{entries.map((item) => <article key={item.id}><span className="task-icon">{item.kind === "Paquete" ? <Package /> : <UserRoundCheck />}</span><span><strong>{item.detail}</strong><small>{item.kind} · {item.unit} · {item.time}</small></span><span className={`status ${item.state === "closed" ? "success" : item.state === "waiting" ? "warning" : "neutral"}`}>{item.state === "closed" ? "Cerrado" : item.state === "waiting" ? "Por entregar" : "En interior"}</span>{item.state !== "closed" && <button className="secondary-button compact" onClick={() => closeEntry(item.id, item.kind)}>{item.kind === "Paquete" ? "Entregar" : "Registrar salida"}</button>}</article>)}</div></section></div>
  </>;
}
