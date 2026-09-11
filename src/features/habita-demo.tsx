"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileArchive,
  FileCheck2,
  FolderLock,
  Handshake,
  Home,
  Landmark,
  LayoutDashboard,
  Menu,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Siren,
  Users,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { demoTenants } from "@/data/demo/tenants";
import type { Permission, TenantId } from "@/domain/models";
import { collectionRate, selectTenant, tenantTotals } from "@/lib/demo-selectors";
import {
  AssembliesView,
  CommunicationsView,
  ContinuityView,
  DocumentsView,
  FinanceView,
  IncidentsView,
  MaintenanceView,
  OperatorView,
  ReservationsView,
  UnitsView,
} from "@/features/operations-views";

type View = "summary" | "towers" | "units" | "people" | "finance" | "maintenance" | "reservations" | "assemblies" | "documents" | "communications" | "incidents" | "continuity" | "operator" | "owner";

const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 });

const permissionLabels: Record<Permission, string> = {
  "finances:view": "Ver finanzas",
  "payments:review": "Revisar pagos",
  "people:manage": "Gestionar accesos",
  "unit:pay": "Reportar pagos",
  "unit:incidents": "Registrar incidencias",
  "assemblies:vote": "Votar cuando corresponda",
};

export function HabitaDemo() {
  const [tenantId, setTenantId] = useState<TenantId>("los-jardines");
  const [view, setView] = useState<View>("towers");
  const [menuOpen, setMenuOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [movement, setMovement] = useState("");
  const [verified, setVerified] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [notice, setNotice] = useState("");
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => { shellRef.current?.setAttribute("data-ready", "true"); }, []);

  const tenant = selectTenant(demoTenants, tenantId) ?? demoTenants[0];
  const totals = useMemo(() => tenantTotals(tenant), [tenant]);

  function changeTenant(nextId: TenantId) {
    setTenantId(nextId);
    setView("towers");
    setPaymentOpen(false);
    setMovement("");
    setVerified(false);
    setPaymentConfirmed(false);
    setNotice(`Vista demo cambiada a ${selectTenant(demoTenants, nextId)?.name}.`);
  }

  function navigate(nextView: View) {
    setView(nextView);
    setMenuOpen(false);
    setPaymentOpen(false);
  }

  function confirmPayment() {
    if (!movement || !verified || paymentConfirmed) return;
    setPaymentConfirmed(true);
    setPaymentOpen(false);
    setNotice("Pago marcado como confirmado solo en esta sesión demo. No se guardó en un servidor.");
  }

  return (
    <div ref={shellRef} className={`app-shell ${view === "owner" ? "owner-shell" : ""}`} data-ready="false">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      {view !== "owner" && <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`} aria-label="Navegación principal">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><Building2 /></span><span>Stoka <strong>Habita</strong></span></div>
        <p className="brand-subtitle">Gestión para tu condominio</p>
        <label className="tenant-label" htmlFor="tenant-select">Condominio</label>
        <div className="select-wrap">
          <Building2 aria-hidden="true" size={18} />
          <select id="tenant-select" value={tenantId} onChange={(event) => changeTenant(event.target.value as TenantId)}>
            {demoTenants.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <ChevronDown aria-hidden="true" size={16} />
        </div>
        <nav className="side-nav">
          <span className="nav-group-label">Condominio</span>
          <NavButton icon={<LayoutDashboard />} label="Resumen" active={view === "summary"} onClick={() => navigate("summary")} />
          <NavButton icon={<Building2 />} label={tenant.towers.length === 1 ? "Edificio" : "Torres"} active={view === "towers"} onClick={() => navigate("towers")} />
          <NavButton icon={<Home />} label="Unidades" active={view === "units"} onClick={() => navigate("units")} />
          <NavButton icon={<Users />} label="Personas y accesos" active={view === "people"} onClick={() => navigate("people")} />
          <span className="nav-group-label">Operación</span>
          <NavButton icon={<Landmark />} label="Finanzas" active={view === "finance"} onClick={() => navigate("finance")} />
          <NavButton icon={<Wrench />} label="Mantenimiento" active={view === "maintenance"} onClick={() => navigate("maintenance")} />
          <NavButton icon={<CalendarCheck />} label="Reservas" active={view === "reservations"} onClick={() => navigate("reservations")} />
          <NavButton icon={<Siren />} label="Incidencias" active={view === "incidents"} onClick={() => navigate("incidents")} />
          <span className="nav-group-label">Institucional</span>
          <NavButton icon={<Handshake />} label="Asambleas" active={view === "assemblies"} onClick={() => navigate("assemblies")} />
          <NavButton icon={<FolderLock />} label="Documentos" active={view === "documents"} onClick={() => navigate("documents")} />
          <NavButton icon={<Megaphone />} label="Comunicados" active={view === "communications"} onClick={() => navigate("communications")} />
          <NavButton icon={<FileArchive />} label="Entrega de gestión" active={view === "continuity"} onClick={() => navigate("continuity")} />
          <span className="nav-group-label">Portales</span>
          <NavButton icon={<Home />} label="Vista propietario" active={false} onClick={() => navigate("owner")} />
          <NavButton icon={<ShieldCheck />} label="Operador SaaS" active={view === "operator"} onClick={() => navigate("operator")} />
        </nav>
        <div className="admin-card"><span className="avatar small">GU</span><div><strong>Gestión Urbana SAC</strong><span>Acceso demo · hasta dic. 2027</span></div></div>
      </aside>}

      {view !== "owner" && menuOpen && <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}

      <div className="workspace">
        {view !== "owner" && <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div className="topbar-tenant"><strong>{tenant.name}</strong><span>{tenant.city} · Junta de propietarios</span></div>
          <span className="demo-pill">Datos ficticios</span>
          <button className="icon-button" aria-label="Notificaciones" onClick={() => setNotice("No hay notificaciones nuevas en esta demo.")}><Bell /></button>
          <div className="profile"><span className="avatar">{tenantId === "los-jardines" ? "MT" : "LR"}</span><span>{tenant.people[0].name}</span></div>
        </header>}

        <main className="main-content" id="main-content" tabIndex={-1}>
          <div className="demo-banner"><ShieldCheck aria-hidden="true" /><span><strong>Demo local.</strong> Los cambios viven solo en esta pestaña; no hay autenticación ni persistencia real.</span></div>
          {view === "summary" && <SummaryView tenant={tenant} totals={totals} paymentConfirmed={paymentConfirmed} onReviewPayment={() => setPaymentOpen(true)} onGoTowers={() => navigate("towers")} />}
          {view === "towers" && <TowersView tenant={tenant} totals={totals} onReviewPayment={() => setPaymentOpen(true)} />}
          {view === "units" && <UnitsView tenant={tenant} onNotice={setNotice} />}
          {view === "people" && <PeopleView tenant={tenant} />}
          {view === "finance" && <FinanceView tenant={tenant} onNotice={setNotice} onReviewPayment={() => setPaymentOpen(true)} />}
          {view === "maintenance" && <MaintenanceView tenant={tenant} onNotice={setNotice} />}
          {view === "reservations" && <ReservationsView tenant={tenant} onNotice={setNotice} />}
          {view === "assemblies" && <AssembliesView tenant={tenant} onNotice={setNotice} />}
          {view === "documents" && <DocumentsView tenant={tenant} onNotice={setNotice} />}
          {view === "communications" && <CommunicationsView tenant={tenant} onNotice={setNotice} />}
          {view === "incidents" && <IncidentsView tenant={tenant} onNotice={setNotice} />}
          {view === "continuity" && <ContinuityView tenant={tenant} onNotice={setNotice} />}
          {view === "operator" && <OperatorView tenant={tenant} onNotice={setNotice} />}
          {view === "owner" && <OwnerView tenant={tenant} onAction={(message) => setNotice(message)} onExit={() => navigate("towers")} />}
        </main>

        {view !== "owner" && <nav className="bottom-nav" aria-label="Navegación móvil">
          <NavButton icon={<LayoutDashboard />} label="Resumen" active={view === "summary"} onClick={() => navigate("summary")} />
          <NavButton icon={<Building2 />} label={tenant.towers.length === 1 ? "Edificio" : "Torres"} active={view === "towers"} onClick={() => navigate("towers")} />
          <NavButton icon={<Home />} label="Mi unidad" active={false} onClick={() => navigate("owner")} />
          <NavButton icon={<Menu />} label="Más" active={!(["summary", "towers"] as View[]).includes(view)} onClick={() => setMenuOpen(true)} />
        </nav>}
      </div>

      {paymentOpen && <PaymentPanel movement={movement} verified={verified} onMovement={setMovement} onVerified={setVerified} onClose={() => setPaymentOpen(false)} onConfirm={confirmPayment} />}
      {notice && <div className="toast" role="status"><Check aria-hidden="true" /><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice("")}><X /></button></div>}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-button ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={onClick}><span aria-hidden="true">{icon}</span>{label}</button>;
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div><div className="period-label"><CalendarDays aria-hidden="true" />Septiembre 2026</div></div>;
}

function SummaryView({ tenant, totals, paymentConfirmed, onReviewPayment, onGoTowers }: { tenant: (typeof demoTenants)[number]; totals: ReturnType<typeof tenantTotals>; paymentConfirmed: boolean; onReviewPayment: () => void; onGoTowers: () => void }) {
  const collected = totals.collected + (paymentConfirmed && tenant.id === "los-jardines" ? 300 : 0);
  const gap = Math.max(0, tenant.commitments - tenant.operationalBalance - (paymentConfirmed ? 300 : 0));
  return <>
    <PageHeading title={`Buenos días, ${tenant.people[0].name.split(" ")[0]}`} description="Panel de junta · Lo importante del condominio, listo para revisar." />
    <section className="metric-grid" aria-label="Indicadores del condominio">
      <Metric icon={<WalletCards />} label="Disponible operativo" value={money.format(tenant.operationalBalance)} note="Fondos de libre disponibilidad" />
      <Metric icon={<CircleDollarSign />} label="Cobrado este mes" value={money.format(collected)} note={`${collectionRate(collected, totals.issued)}% de ${money.format(totals.issued)}`} />
      <Metric icon={<Clock3 />} label="Deuda vencida" value={money.format(tenant.overdueDebt)} note="Incluye periodos anteriores" tone="danger" />
    </section>
    {gap > 0 && <section className="cash-alert"><AlertTriangle aria-hidden="true" /><div><strong>Faltan {money.format(gap)} para los próximos 30 días</strong><span>Disponible {money.format(tenant.operationalBalance)} · compromisos {money.format(tenant.commitments)}</span></div><button onClick={onGoTowers}>Revisar cobranza <ArrowRight /></button></section>}
    <div className="summary-columns">
      <section className="panel"><div className="section-heading"><h2>Por revisar hoy</h2><span className="count-badge">3</span></div>
        <button className="review-row featured" onClick={onReviewPayment}><span className="row-icon"><ReceiptText /></span><span><strong>Pago · A-203</strong><small>Mantenimiento de septiembre</small></span><b>{money.format(300)}</b><span className={`status ${paymentConfirmed ? "success" : "warning"}`}>{paymentConfirmed ? "Confirmado en demo" : "Por verificar"}</span><ArrowRight /></button>
        <div className="review-row"><span className="row-icon"><FileCheck2 /></span><span><strong>Convenio · A-402</strong><small>4 cuotas propuestas</small></span><b>{money.format(1200)}</b><span className="status neutral">Pendiente</span></div>
        <div className="review-row"><span className="row-icon"><ShieldCheck /></span><span><strong>Garantía · A-105</strong><small>Salón de eventos</small></span><b>{money.format(300)}</b><span className="status soft">Por devolver</span></div>
      </section>
      <section className="panel"><div className="section-heading"><h2>Agenda operativa</h2></div>
        <AgendaRow date="15 sep." title="Ascensor · Torre A" meta="Preventivo mensual" />
        <AgendaRow date="18 sep." title="Bomba principal" meta="Inspección trimestral" />
        <AgendaRow date="20 sep." title="Asamblea de propietarios" meta="19:00 · Modalidad mixta" />
      </section>
    </div>
  </>;
}

function TowersView({ tenant, totals, onReviewPayment }: { tenant: (typeof demoTenants)[number]; totals: ReturnType<typeof tenantTotals>; onReviewPayment: () => void }) {
  const plural = tenant.towers.length > 1;
  return <>
    <PageHeading title={plural ? "Vista por torres" : "Estado del condominio"} description={plural ? `Comparación operativa · ${tenant.towers.length} torres · ${totals.units} departamentos` : `${totals.units} departamentos · vista simplificada para un solo edificio`} />
    <section className={`tower-grid ${plural ? "" : "single"}`} aria-label={plural ? "Estado de cada torre" : "Estado del edificio"}>
      {tenant.towers.map((tower) => {
        const rate = collectionRate(tower.collected, tower.issued);
        return <article className="tower-card" key={tower.id}>
          <div className="tower-visual" aria-hidden="true"><Building2 /><span>{tower.name.slice(-1)}</span></div>
          <div className="tower-title"><div><h2>{tower.name}</h2><p>{plural ? "Torre · " : "Condominio · "}{tower.units} departamentos</p></div><span className={`status ${tower.status === "attention" ? "warning" : "success"}`}>{tower.status === "attention" ? "Requiere atención" : "En seguimiento"}</span></div>
          <div className="money-row"><span>Cobrado / emitido</span><strong>{money.format(tower.collected)} <small>/ {money.format(tower.issued)}</small></strong></div>
          <div className="progress" aria-label={`${rate}% cobrado`}><span style={{ width: `${rate}%` }} /></div><div className="progress-label">{rate}% cobrado</div>
          <dl className="tower-facts"><div><dt>Incidencias abiertas</dt><dd>{tower.incidents}</dd></div><div><dt>Próximo mantenimiento</dt><dd>{tower.nextMaintenance}</dd></div></dl>
        </article>;
      })}
    </section>
    <div className="tower-lower">
      <section className="panel priority-panel"><div className="section-heading"><h2>Acciones prioritarias pendientes</h2></div>
        {tenant.id === "los-jardines" ? <><div className="action-line"><span><strong>Torre B</strong><small>Filtración entre B-402 y B-302</small></span><span className="status warning">Inspección pendiente</span></div><button className="action-line clickable" onClick={onReviewPayment}><span><strong>Torre A</strong><small>Pago A-203 reportado por S/ 300</small></span><span>Revisar pago <ArrowRight /></span></button></> : <div className="empty-state"><Check /><div><strong>Sin acciones financieras urgentes</strong><span>Hay una incidencia abierta en seguimiento.</span></div></div>}
      </section>
      <section className="collection-card"><span className="collection-label">Cobranza total</span><strong>{money.format(totals.collected)} <small>de {money.format(totals.issued)}</small></strong><div className="progress light"><span style={{ width: `${collectionRate(totals.collected, totals.issued)}%` }} /></div><span>{collectionRate(totals.collected, totals.issued)}% del mes</span></section>
    </div>
  </>;
}

function PeopleView({ tenant }: { tenant: (typeof demoTenants)[number] }) {
  return <>
    <PageHeading title="Personas y accesos" description="Identidad, roles individuales, alcance y vigencia dentro de este condominio." />
    <section className="scope-note"><ShieldCheck /><div><strong>Una persona, permisos específicos</strong><span>Los permisos de pago, convivencia y voto se muestran separados. Esta demo no aplica autorización de servidor.</span></div></section>
    <section className="people-grid">
      {tenant.people.map((person) => <article className="person-card" key={person.id}>
        <div className="person-top"><span className="avatar large">{person.initials}</span><div><h2>{person.name}</h2><p>{person.role}</p></div><span className={`status ${person.state === "active" ? "success" : "warning"}`}>{person.state === "active" ? "Activo" : "Vigencia definida"}</span></div>
        <dl className="person-meta"><div><dt>Alcance</dt><dd>{person.scope}</dd></div><div><dt>Vigencia</dt><dd>{person.period}</dd></div></dl>
        <div className="permission-list" aria-label={`Permisos de ${person.name}`}>{person.permissions.map((permission) => <span key={permission}><Check />{permissionLabels[permission]}</span>)}</div>
      </article>)}
    </section>
  </>;
}

function OwnerView({ tenant, onAction, onExit }: { tenant: (typeof demoTenants)[number]; onAction: (message: string) => void; onExit: () => void }) {
  const owner = tenant.owner;
  return <div className="owner-stage">
    <div className="owner-context"><button className="owner-exit" onClick={onExit}><ArrowLeft />Volver al panel demo</button><h1>Portal del propietario</h1><p>Una vista adaptable enfocada en saldo, recibos, avisos y acciones autorizadas.</p><div className="context-list"><span><ShieldCheck />Cuenta individual, no compartida por departamento</span><span><Users />Responsables con permisos y vigencia propios</span><span><Landmark />El condominio conserva el historial</span></div></div>
    <section className="phone-frame" aria-label="Vista móvil del propietario">
      <div className="phone-top"><button className="phone-exit" aria-label="Volver al panel demo" onClick={onExit}><ArrowLeft /></button><div><small>{tenant.name}</small><strong>Hola, {owner.personName.split(" ")[0]}</strong></div><span className="avatar">{owner.personName.split(" ").map((part) => part[0]).join("")}</span></div>
      <div className="unit-chip"><Home />Unidad {owner.unit}<ChevronDown /></div>
      <article className={`balance-card ${owner.balance === 0 ? "settled" : ""}`}><span>{owner.balance === 0 ? "Estás al día" : "Saldo por pagar"}</span><strong>{money.format(owner.balance)}</strong><small>{owner.dueDate}</small>{owner.balance > 0 && <button onClick={() => onAction("Se abrió el flujo demo para reportar un pago. No se envió información.")}>Reportar pago <ArrowRight /></button>}</article>
      <section className="owner-section"><div className="section-heading"><h2>Mi recibo</h2><span>Septiembre</span></div><button className="receipt-card" onClick={() => onAction("Vista previa demo del recibo. No es un comprobante tributario.")}><span className="row-icon"><ReceiptText /></span><span><strong>{owner.pendingReceipt}</strong><small>{owner.balance === 0 ? "Pagado en demo" : "Pendiente"}</small></span><ArrowRight /></button></section>
      <section className="owner-section"><div className="section-heading"><h2>Comunicados</h2><span>{owner.announcements.length} nuevos</span></div>{owner.announcements.map((announcement) => <div className="announcement" key={announcement.title}><span className="announce-dot" /><span><strong>{announcement.title}</strong><small>{announcement.meta}</small></span></div>)}</section>
          <nav className="phone-nav"><button className="active" aria-current="page" onClick={() => onAction("Ya estás en el inicio del portal del propietario.")}><Home />Inicio</button><button onClick={() => onAction("El historial completo de recibos requiere persistencia y queda desactivado en esta demo.")}><ReceiptText />Recibos</button><button onClick={() => onAction("Las solicitudes de reserva del propietario se validan en el módulo de junta, sin envío real.")}><CalendarDays />Reservas</button></nav>
    </section>
  </div>;
}

function PaymentPanel({ movement, verified, onMovement, onVerified, onClose, onConfirm }: { movement: string; verified: boolean; onMovement: (value: string) => void; onVerified: (value: boolean) => void; onClose: () => void; onConfirm: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), select, input:not([disabled])');
    focusable?.[0]?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, []);
  return <div className="drawer-layer"><button className="drawer-scrim" aria-label="Cerrar revisión" onClick={onClose} /><aside ref={panelRef} tabIndex={-1} className="payment-drawer" role="dialog" aria-modal="true" aria-labelledby="payment-title">
    <div className="drawer-head"><div><h2 id="payment-title">Verificar pago · A-203</h2><p>Revisión manual asistida</p></div><button className="icon-button" aria-label="Cerrar" onClick={onClose}><X /></button></div>
    <div className="reported-amount"><span>Importe reportado</span><strong>{money.format(300)}</strong><small>9 sep. 2026 · Operación DEMO-0909</small></div>
    <div className="evidence-row"><span className="row-icon"><ReceiptText /></span><span><strong>Comprobante de ejemplo.pdf</strong><small>Evidencia ficticia · vista local</small></span><span className="status neutral">PDF</span></div>
    <div className="drawer-divider" />
    <label className="field"><span>Movimiento bancario</span><select value={movement} onChange={(event) => onMovement(event.target.value)}><option value="">Seleccionar movimiento</option><option value="mov-demo">09 sep. · DEMO-0909 · S/ 300</option></select></label>
    <label className="check-field"><input type="checkbox" checked={verified} onChange={(event) => onVerified(event.target.checked)} /><span><strong>Importe y operación verificados</strong><small>Confirmo que revisé la coincidencia y la cuenta destino.</small></span></label>
    <p className="security-note"><ShieldCheck />En producción, el servidor deberá validar tenant, permiso del revisor y uso único del movimiento.</p>
    <div className="drawer-actions"><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={!movement || !verified} onClick={onConfirm}>Confirmar en demo</button></div>
  </aside></div>;
}

function Metric({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone?: "danger" }) {
  return <article className={`metric-card ${tone ?? ""}`}><span className="metric-icon" aria-hidden="true">{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function AgendaRow({ date, title, meta }: { date: string; title: string; meta: string }) {
  return <div className="agenda-row"><span className="date-box"><CalendarDays />{date}</span><span><strong>{title}</strong><small>{meta}</small></span></div>;
}
