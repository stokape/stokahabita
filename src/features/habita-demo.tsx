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
  HandCoins,
  Handshake,
  Home,
  Landmark,
  LayoutDashboard,
  Menu,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Siren,
  Store,
  Users,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { demoTenants } from "@/data/demo/tenants";
import type { PaymentReminder } from "@/data/demo/advanced";
import { initialAccessRequests, initialPlateAuthorizations } from "@/data/demo/community";
import type { AccessRequest, PlateAuthorization, ResidentReservation } from "@/domain/community";
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
import { ArrearsView, ConciergeView, PaymentRemindersView, ProvidersView } from "@/features/advanced-operations-views";
import { BoardAccessPanel, OwnerAccessView, OwnerReservationsView } from "@/features/community-access";
import { DemoTools } from "@/features/demo-tools";
import { resetDemoStorage, useDemoState } from "@/lib/demo-storage";

type View = "summary" | "towers" | "units" | "people" | "finance" | "arrears" | "reminders" | "providers" | "maintenance" | "reservations" | "concierge" | "assemblies" | "documents" | "communications" | "incidents" | "continuity" | "operator" | "owner";
type DemoRole = "president" | "treasurer" | "secretary" | "administrator" | "owner" | "concierge" | "maintenance" | "superadmin";

const roleProfiles: Record<DemoRole, { label: string; actor: string; initials: string; description: string; access: string; defaultView: View; views: View[] }> = {
  president: { label: "Presidente de la junta", actor: "Presidencia", initials: "PJ", description: "Gobierno, supervisión y aprobaciones del condominio.", access: "Todos los módulos del condominio, alertas de pago y decisiones institucionales.", defaultView: "towers", views: ["summary", "towers", "units", "people", "finance", "arrears", "reminders", "providers", "maintenance", "reservations", "concierge", "assemblies", "documents", "communications", "incidents", "continuity"] },
  treasurer: { label: "Tesorero de la junta", actor: "Carlos Vega", initials: "CV", description: "Cobranza, pagos y seguimiento financiero.", access: "Resumen, torres, finanzas, morosidad, alertas de pago y documentos.", defaultView: "finance", views: ["summary", "towers", "finance", "arrears", "reminders", "documents"] },
  secretary: { label: "Secretario de la junta", actor: "Secretaría de la junta", initials: "SJ", description: "Actas, comunicaciones, padrón y seguimiento de acuerdos.", access: "Resumen, torres, personas, alertas de pago, asambleas, documentos, comunicados y entrega de gestión.", defaultView: "assemblies", views: ["summary", "towers", "people", "reminders", "assemblies", "documents", "communications", "continuity"] },
  administrator: { label: "Administrador de condominio", actor: "Personal de Gestión Urbana", initials: "AD", description: "Cuenta individual del personal administrativo con acceso delegado.", access: "Operación diaria, finanzas delegadas, documentos y continuidad; sin administrar cargos de junta.", defaultView: "summary", views: ["summary", "towers", "units", "finance", "arrears", "providers", "maintenance", "reservations", "concierge", "assemblies", "documents", "communications", "incidents", "continuity"] },
  owner: { label: "Propietario", actor: "Responsable de unidad", initials: "PR", description: "Saldo, recibos, avisos y gestiones de la unidad.", access: "Solo su unidad, recibos, avisos y solicitudes autorizadas.", defaultView: "owner", views: ["owner"] },
  concierge: { label: "Conserje de turno", actor: "Personal de conserjería", initials: "CT", description: "Cuenta individual del turno para ingresos, encomiendas e incidencias.", access: "Portería, incidencias operativas y avisos; sin finanzas ni archivos privados.", defaultView: "concierge", views: ["concierge", "incidents", "communications"] },
  maintenance: { label: "Personal de mantenimiento", actor: "Técnico de mantenimiento", initials: "PM", description: "Cuenta individual para activos, tareas e incidencias asignadas.", access: "Mantenimiento, incidencias y documentos técnicos.", defaultView: "maintenance", views: ["maintenance", "incidents", "documents"] },
  superadmin: { label: "Super admin · Stoka Habita", actor: "Super administrador", initials: "SA", description: "Clientes, membresías y soporte excepcional de la plataforma.", access: "Operación SaaS y solicitudes de soporte temporal; sin acceso general a datos privados.", defaultView: "operator", views: ["operator"] },
};

const demoRoleOrder: DemoRole[] = ["president", "treasurer", "secretary", "administrator", "owner", "concierge", "maintenance", "superadmin"];

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
  const [role, setRole] = useState<DemoRole>("president");
  const [selectingRole, setSelectingRole] = useState(true);
  const [view, setView] = useState<View>("towers");
  const [menuOpen, setMenuOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [movement, setMovement] = useState("");
  const [verified, setVerified] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useDemoState("payment-confirmed", false);
  const [paymentReminders, setPaymentReminders] = useDemoState<PaymentReminder[]>("payment-reminders", []);
  const [accessRequests, setAccessRequests] = useDemoState<AccessRequest[]>("access-requests", initialAccessRequests);
  const [plateAuthorizations, setPlateAuthorizations] = useDemoState<PlateAuthorization[]>("plate-authorizations", initialPlateAuthorizations);
  const [residentReservations, setResidentReservations] = useDemoState<ResidentReservation[]>("resident-reservations", []);
  const [notice, setNotice] = useState("");
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => { shellRef.current?.setAttribute("data-ready", "true"); }, []);

  const tenant = selectTenant(demoTenants, tenantId) ?? demoTenants[0];
  const totals = useMemo(() => tenantTotals(tenant), [tenant]);
  const roleProfile = roleProfiles[role];
  const actor = role === "president" ? { name: tenant.people[0].name, initials: tenant.people[0].initials } : { name: roleProfile.actor, initials: roleProfile.initials };
  const canView = (candidate: View) => roleProfile.views.includes(candidate);
  const resetWorkspacePosition = () => requestAnimationFrame(() => {
    document.getElementById("main-content")?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  });

  function changeTenant(nextId: TenantId) {
    setTenantId(nextId);
    setView(roleProfile.defaultView);
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

  function changeRole(nextRole: DemoRole) {
    const nextProfile = roleProfiles[nextRole];
    setRole(nextRole);
    setView(nextProfile.defaultView);
    setMenuOpen(false);
    setPaymentOpen(false);
    setSelectingRole(false);
    setNotice("");
    resetWorkspacePosition();
  }

  function openRoleHub() {
    setSelectingRole(true);
    setMenuOpen(false);
    setPaymentOpen(false);
    setNotice("");
    resetWorkspacePosition();
  }

  function confirmPayment() {
    if (!movement || !verified || paymentConfirmed) return;
    setPaymentConfirmed(true);
    setPaymentOpen(false);
    setNotice("Pago marcado como confirmado solo en esta sesión demo del navegador; el cambio permanecerá al recargar.");
  }

  function resetDemo() {
    if (!window.confirm("¿Restablecer todos los datos ficticios y comentarios guardados en este navegador?")) return;
    resetDemoStorage();
    setMovement("");
    setVerified(false);
    setPaymentOpen(false);
    setNotice("La demostración volvió a su estado inicial.");
  }

  return (
    <div ref={shellRef} className={`app-shell ${view === "owner" && !selectingRole ? "owner-shell" : ""} ${selectingRole ? "role-hub-shell" : ""}`} data-ready="false">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      {!selectingRole && view !== "owner" && <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`} aria-label="Navegación principal">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><Building2 /></span><span>Stoka <strong>Habita</strong></span></div>
        <p className="brand-subtitle">Gestión para tu condominio</p>
        <button className="role-switch-button" onClick={openRoleHub}><span className="avatar small">{actor.initials}</span><span><strong>{roleProfile.label}</strong><small>Cambiar demo</small></span><ArrowRight /></button>
        <label className="tenant-label" htmlFor="tenant-select">Condominio</label>
        <div className="select-wrap">
          <Building2 aria-hidden="true" size={18} />
          <select id="tenant-select" value={tenantId} onChange={(event) => changeTenant(event.target.value as TenantId)}>
            {demoTenants.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <ChevronDown aria-hidden="true" size={16} />
        </div>
        <nav className="side-nav">
          {["summary", "towers", "units", "people"].some((item) => canView(item as View)) && <><span className="nav-group-label">Condominio</span>
            {canView("summary") && <NavButton icon={<LayoutDashboard />} label="Resumen" active={view === "summary"} onClick={() => navigate("summary")} />}
            {canView("towers") && <NavButton icon={<Building2 />} label={tenant.towers.length === 1 ? "Edificio" : "Torres"} active={view === "towers"} onClick={() => navigate("towers")} />}
            {canView("units") && <NavButton icon={<Home />} label="Unidades" active={view === "units"} onClick={() => navigate("units")} />}
            {canView("people") && <NavButton icon={<Users />} label="Personas y accesos" active={view === "people"} onClick={() => navigate("people")} />}
          </>}
          {["finance", "arrears", "reminders", "providers", "maintenance", "reservations", "concierge", "incidents"].some((item) => canView(item as View)) && <><span className="nav-group-label">Operación</span>
            {canView("finance") && <NavButton icon={<Landmark />} label="Finanzas" active={view === "finance"} onClick={() => navigate("finance")} />}
            {canView("arrears") && <NavButton icon={<HandCoins />} label="Morosidad y convenios" active={view === "arrears"} onClick={() => navigate("arrears")} />}
            {canView("reminders") && <NavButton icon={<Bell />} label="Alertas de pago" active={view === "reminders"} onClick={() => navigate("reminders")} />}
            {canView("providers") && <NavButton icon={<Store />} label="Proveedores" active={view === "providers"} onClick={() => navigate("providers")} />}
            {canView("maintenance") && <NavButton icon={<Wrench />} label="Mantenimiento" active={view === "maintenance"} onClick={() => navigate("maintenance")} />}
            {canView("reservations") && <NavButton icon={<CalendarCheck />} label="Reservas" active={view === "reservations"} onClick={() => navigate("reservations")} />}
            {canView("concierge") && <NavButton icon={<Users />} label="Portería" active={view === "concierge"} onClick={() => navigate("concierge")} />}
            {canView("incidents") && <NavButton icon={<Siren />} label="Incidencias" active={view === "incidents"} onClick={() => navigate("incidents")} />}
          </>}
          {["assemblies", "documents", "communications", "continuity"].some((item) => canView(item as View)) && <><span className="nav-group-label">Institucional</span>
            {canView("assemblies") && <NavButton icon={<Handshake />} label="Asambleas" active={view === "assemblies"} onClick={() => navigate("assemblies")} />}
            {canView("documents") && <NavButton icon={<FolderLock />} label="Documentos" active={view === "documents"} onClick={() => navigate("documents")} />}
            {canView("communications") && <NavButton icon={<Megaphone />} label="Comunicados" active={view === "communications"} onClick={() => navigate("communications")} />}
            {canView("continuity") && <NavButton icon={<FileArchive />} label="Entrega de gestión" active={view === "continuity"} onClick={() => navigate("continuity")} />}
          </>}
          {canView("operator") && <><span className="nav-group-label">Plataforma</span><NavButton icon={<ShieldCheck />} label="Panel super admin" active={view === "operator"} onClick={() => navigate("operator")} /></>}
        </nav>
        <div className="admin-card"><span className="avatar small">{actor.initials}</span><div><strong>{actor.name}</strong><span>{roleProfile.label} · acceso simulado</span></div></div>
      </aside>}

      {!selectingRole && view !== "owner" && menuOpen && <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}

      <div className="workspace">
        {!selectingRole && view !== "owner" && <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div className="topbar-tenant"><strong>{role === "superadmin" ? "Operación Stoka Habita" : tenant.name}</strong><span>{role === "superadmin" ? "Vista transversal sin datos privados" : `${tenant.city} · ${roleProfile.label}`}</span></div>
          <span className="demo-pill">Datos ficticios</span>
          <button className="icon-button" aria-label="Notificaciones" onClick={() => setNotice("No hay notificaciones nuevas en esta demo.")}><Bell /></button>
          <div className="profile"><span className="avatar">{actor.initials}</span><span>{actor.name}</span></div>
        </header>}

        <main className="main-content" id="main-content" tabIndex={-1}>
          <div className="demo-banner"><ShieldCheck aria-hidden="true" /><span><strong>Demostración con datos ficticios.</strong> Los cambios se conservan en este navegador y puedes restablecerlos cuando quieras.</span></div>
          {selectingRole ? <RoleHub tenantId={tenantId} onTenantChange={changeTenant} onChoose={changeRole} /> : <>
          {view === "summary" && <SummaryView tenant={tenant} totals={totals} paymentConfirmed={paymentConfirmed} actorName={actor.name} roleLabel={roleProfile.label} onReviewPayment={() => setPaymentOpen(true)} onGoTowers={() => navigate("towers")} />}
          {view === "towers" && <TowersView tenant={tenant} totals={totals} onReviewPayment={() => setPaymentOpen(true)} />}
          {view === "units" && <UnitsView tenant={tenant} onNotice={setNotice} />}
          {view === "people" && <PeopleView tenant={tenant} requests={accessRequests.filter((item) => item.tenantId === tenant.id)} plates={plateAuthorizations.filter((item) => item.tenantId === tenant.id)} reservations={residentReservations.filter((item) => item.tenantId === tenant.id)} approver={actor.name} onAccessState={(id, state) => setAccessRequests((current) => current.map((item) => item.id === id ? { ...item, state } : item))} onPlateState={(id, state, approvedBy) => setPlateAuthorizations((current) => current.map((item) => item.id === id ? { ...item, state, approvedBy: approvedBy ?? item.approvedBy } : item))} onReservationState={(id, state) => setResidentReservations((current) => current.map((item) => item.id === id ? { ...item, state } : item))} onNotice={setNotice} />}
          {view === "finance" && <FinanceView tenant={tenant} onNotice={setNotice} onReviewPayment={() => setPaymentOpen(true)} />}
          {view === "arrears" && <ArrearsView tenant={tenant} onNotice={setNotice} />}
          {view === "reminders" && <PaymentRemindersView key={tenant.id} tenant={tenant} sender={roleProfile.label} sentReminders={paymentReminders.filter((reminder) => reminder.tenantId === tenant.id)} onSend={(reminder) => setPaymentReminders((current) => [reminder, ...current])} onNotice={setNotice} />}
          {view === "providers" && <ProvidersView tenant={tenant} onNotice={setNotice} />}
          {view === "maintenance" && <MaintenanceView tenant={tenant} onNotice={setNotice} />}
          {view === "reservations" && <ReservationsView tenant={tenant} onNotice={setNotice} residentReservations={residentReservations.filter((item) => item.tenantId === tenant.id)} canVoid={role === "president"} onVoid={(id) => setResidentReservations((current) => current.map((item) => item.id === id ? { ...item, state: "voided" } : item))} />}
          {view === "concierge" && <ConciergeView tenant={tenant} onNotice={setNotice} authorizedRequests={accessRequests.filter((item) => item.tenantId === tenant.id)} activePlates={plateAuthorizations.filter((item) => item.tenantId === tenant.id)} onAccessState={(id, state) => setAccessRequests((current) => current.map((item) => item.id === id ? { ...item, state } : item))} />}
          {view === "assemblies" && <AssembliesView tenant={tenant} onNotice={setNotice} />}
          {view === "documents" && <DocumentsView tenant={tenant} onNotice={setNotice} />}
          {view === "communications" && <CommunicationsView tenant={tenant} onNotice={setNotice} />}
          {view === "incidents" && <IncidentsView tenant={tenant} onNotice={setNotice} />}
          {view === "continuity" && <ContinuityView tenant={tenant} onNotice={setNotice} />}
          {view === "operator" && <OperatorView tenant={tenant} onNotice={setNotice} />}
          {view === "owner" && <OwnerView tenant={tenant} reminders={paymentReminders.filter((reminder) => reminder.tenantId === tenant.id && reminder.units.includes(tenant.owner.unit) && reminder.channels.includes("app"))} requests={accessRequests.filter((item) => item.tenantId === tenant.id && item.unit === tenant.owner.unit)} plates={plateAuthorizations.filter((item) => item.tenantId === tenant.id && item.unit === tenant.owner.unit)} reservations={residentReservations.filter((item) => item.tenantId === tenant.id && item.unit === tenant.owner.unit)} onSaveRequest={(request) => setAccessRequests((current) => current.some((item) => item.id === request.id) ? current.map((item) => item.id === request.id ? request : item) : [request, ...current])} onCancelRequest={(id) => setAccessRequests((current) => current.map((item) => item.id === id ? { ...item, state: "cancelled" } : item))} onRequestPlate={(plate) => setPlateAuthorizations((current) => [plate, ...current])} onSaveReservation={(reservation) => setResidentReservations((current) => current.some((item) => item.id === reservation.id) ? current.map((item) => item.id === reservation.id ? reservation : item) : [reservation, ...current])} onCancelReservation={(id) => setResidentReservations((current) => current.map((item) => item.id === id ? { ...item, state: "cancelled" } : item))} onAction={setNotice} onExit={openRoleHub} />}
          </>}
        </main>

        {!selectingRole && view !== "owner" && <RoleBottomNav role={role} view={view} tenant={tenant} navigate={navigate} openMenu={() => setMenuOpen(true)} />}
      </div>

      {paymentOpen && <PaymentPanel movement={movement} verified={verified} onMovement={setMovement} onVerified={setVerified} onClose={() => setPaymentOpen(false)} onConfirm={confirmPayment} />}
      <DemoTools context={`${tenant.name} · ${roleProfile.label} · ${view}`} onReset={resetDemo} onNotice={setNotice} />
      {notice && <div className="toast" role="status"><Check aria-hidden="true" /><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice("")}><X /></button></div>}
    </div>
  );
}

function RoleHub({ tenantId, onTenantChange, onChoose }: { tenantId: TenantId; onTenantChange: (tenantId: TenantId) => void; onChoose: (role: DemoRole) => void }) {
  return <section className="role-hub" aria-labelledby="role-hub-title">
    <div className="role-hub-brand"><span className="brand-mark" aria-hidden="true"><Building2 /></span><span>Stoka <strong>Habita</strong></span></div>
    <div className="role-hub-heading"><div><h1 id="role-hub-title">Elige una demo independiente</h1><p>Cada perfil abre su propio espacio, navegación y contenido ficticio.</p></div><label className="hub-tenant"><span>Condominio demo</span><select value={tenantId} onChange={(event) => onTenantChange(event.target.value as TenantId)}>{demoTenants.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div>
    <div className="role-grid" aria-label="Demos disponibles">
      {demoRoleOrder.map((roleId) => {
        const profile = roleProfiles[roleId];
        return <button key={roleId} className="role-option" aria-label={`Abrir demo de ${profile.label}`} onClick={() => onChoose(roleId)}><span className="avatar">{profile.initials}</span><span className="role-option-copy"><strong>{profile.label}</strong><span>{profile.description}</span><small><b>Acceso:</b> {profile.access}</small></span><span className="role-open">Abrir demo <ArrowRight /></span></button>;
      })}
    </div>
    <p className="role-hub-note"><ShieldCheck />Estas vistas explican el producto. No representan cuentas, sesiones ni permisos aplicados en servidor.</p>
  </section>;
}

function RoleBottomNav({ role, view, tenant, navigate, openMenu }: { role: DemoRole; view: View; tenant: (typeof demoTenants)[number]; navigate: (view: View) => void; openMenu: () => void }) {
  if (role === "treasurer") return <nav className="bottom-nav items-4" aria-label="Navegación móvil"><NavButton icon={<LayoutDashboard />} label="Resumen" active={view === "summary"} onClick={() => navigate("summary")} /><NavButton icon={<Landmark />} label="Finanzas" active={view === "finance"} onClick={() => navigate("finance")} /><NavButton icon={<HandCoins />} label="Morosidad" active={view === "arrears"} onClick={() => navigate("arrears")} /><NavButton icon={<Menu />} label="Más" active={view === "documents" || view === "towers"} onClick={openMenu} /></nav>;
  if (role === "secretary") return <nav className="bottom-nav items-4" aria-label="Navegación móvil"><NavButton icon={<LayoutDashboard />} label="Resumen" active={view === "summary"} onClick={() => navigate("summary")} /><NavButton icon={<Handshake />} label="Asambleas" active={view === "assemblies"} onClick={() => navigate("assemblies")} /><NavButton icon={<FolderLock />} label="Documentos" active={view === "documents"} onClick={() => navigate("documents")} /><NavButton icon={<Menu />} label="Más" active={!(["summary", "assemblies", "documents"] as View[]).includes(view)} onClick={openMenu} /></nav>;
  if (role === "administrator") return <nav className="bottom-nav items-4" aria-label="Navegación móvil"><NavButton icon={<LayoutDashboard />} label="Resumen" active={view === "summary"} onClick={() => navigate("summary")} /><NavButton icon={<Building2 />} label={tenant.towers.length === 1 ? "Edificio" : "Torres"} active={view === "towers"} onClick={() => navigate("towers")} /><NavButton icon={<Siren />} label="Incidencias" active={view === "incidents"} onClick={() => navigate("incidents")} /><NavButton icon={<Menu />} label="Más" active={!(["summary", "towers", "incidents"] as View[]).includes(view)} onClick={openMenu} /></nav>;
  if (role === "concierge") return <nav className="bottom-nav items-3" aria-label="Navegación móvil"><NavButton icon={<Users />} label="Portería" active={view === "concierge"} onClick={() => navigate("concierge")} /><NavButton icon={<Siren />} label="Incidencias" active={view === "incidents"} onClick={() => navigate("incidents")} /><NavButton icon={<Megaphone />} label="Avisos" active={view === "communications"} onClick={() => navigate("communications")} /></nav>;
  if (role === "maintenance") return <nav className="bottom-nav items-3" aria-label="Navegación móvil"><NavButton icon={<Wrench />} label="Tareas" active={view === "maintenance"} onClick={() => navigate("maintenance")} /><NavButton icon={<Siren />} label="Incidencias" active={view === "incidents"} onClick={() => navigate("incidents")} /><NavButton icon={<FolderLock />} label="Documentos" active={view === "documents"} onClick={() => navigate("documents")} /></nav>;
  if (role === "superadmin") return <nav className="bottom-nav items-2" aria-label="Navegación móvil"><NavButton icon={<ShieldCheck />} label="Clientes" active={view === "operator"} onClick={() => navigate("operator")} /><NavButton icon={<Menu />} label="Cambiar rol" active={false} onClick={openMenu} /></nav>;
  return <nav className="bottom-nav items-4" aria-label="Navegación móvil"><NavButton icon={<LayoutDashboard />} label="Resumen" active={view === "summary"} onClick={() => navigate("summary")} /><NavButton icon={<Building2 />} label={tenant.towers.length === 1 ? "Edificio" : "Torres"} active={view === "towers"} onClick={() => navigate("towers")} /><NavButton icon={<Landmark />} label="Finanzas" active={view === "finance"} onClick={() => navigate("finance")} /><NavButton icon={<Menu />} label="Más" active={!(["summary", "towers", "finance"] as View[]).includes(view)} onClick={openMenu} /></nav>;
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-button ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={onClick}><span aria-hidden="true">{icon}</span>{label}</button>;
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div><div className="period-label"><CalendarDays aria-hidden="true" />Septiembre 2026</div></div>;
}

function SummaryView({ tenant, totals, paymentConfirmed, actorName, roleLabel, onReviewPayment, onGoTowers }: { tenant: (typeof demoTenants)[number]; totals: ReturnType<typeof tenantTotals>; paymentConfirmed: boolean; actorName: string; roleLabel: string; onReviewPayment: () => void; onGoTowers: () => void }) {
  const collected = totals.collected + (paymentConfirmed && tenant.id === "los-jardines" ? 300 : 0);
  const gap = Math.max(0, tenant.commitments - tenant.operationalBalance - (paymentConfirmed ? 300 : 0));
  return <>
    <PageHeading title={`Buenos días, ${actorName.split(" ")[0]}`} description={`${roleLabel} · Lo importante del condominio, listo para revisar.`} />
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

function PeopleView({ tenant, requests, plates, reservations, approver, onAccessState, onPlateState, onReservationState, onNotice }: { tenant: (typeof demoTenants)[number]; requests: AccessRequest[]; plates: PlateAuthorization[]; reservations: ResidentReservation[]; approver: string; onAccessState: (id: string, state: AccessRequest["state"]) => void; onPlateState: (id: string, state: PlateAuthorization["state"], approvedBy?: string) => void; onReservationState: (id: string, state: ResidentReservation["state"]) => void; onNotice: (message: string) => void }) {
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
    <BoardAccessPanel tenant={tenant} requests={requests} plates={plates} reservations={reservations} approver={approver} onAccessState={onAccessState} onPlateState={onPlateState} onReservationState={onReservationState} onNotice={onNotice} />
  </>;
}

function OwnerView({ tenant, reminders, requests, plates, reservations, onSaveRequest, onCancelRequest, onRequestPlate, onSaveReservation, onCancelReservation, onAction, onExit }: { tenant: (typeof demoTenants)[number]; reminders: PaymentReminder[]; requests: AccessRequest[]; plates: PlateAuthorization[]; reservations: ResidentReservation[]; onSaveRequest: (request: AccessRequest) => void; onCancelRequest: (id: string) => void; onRequestPlate: (plate: PlateAuthorization) => void; onSaveReservation: (reservation: ResidentReservation) => void; onCancelReservation: (id: string) => void; onAction: (message: string) => void; onExit: () => void }) {
  const owner = tenant.owner;
  const latestReminder = reminders[0];
  const [tab, setTab] = useState<"home" | "receipts" | "access" | "reservations">("home");
  const [reporting, setReporting] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [operation, setOperation] = useState("");
  const [paymentReported, setPaymentReported] = useDemoState(`owner-payment:${tenant.id}`, false);
  function reportPayment(event: React.FormEvent) { event.preventDefault(); setPaymentReported(true); setReporting(false); onAction("Pago ficticio reportado. La junta ya puede revisar la operación DEMO indicada."); }
  return <div className="owner-stage">
    <div className="owner-context"><button className="owner-exit" onClick={onExit}><ArrowLeft />Volver a las demos</button><h1>Portal del propietario</h1><p>Saldo, accesos, cochera y reservas conectados con portería y la junta.</p><div className="context-list"><span><ShieldCheck />El residente crea y modifica sus solicitudes</span><span><Users />Portería recibe solo la información operativa</span><span><Landmark />La junta aprueba placas y puede anular registros</span></div></div>
    <section className="phone-frame" aria-label="Vista móvil del propietario">
      <div className="owner-scroll"><div className="phone-top"><button className="phone-exit" aria-label="Volver a las demos" onClick={onExit}><ArrowLeft /></button><div><small>{tenant.name}</small><strong>Hola, {owner.personName.split(" ")[0]}</strong></div><span className="avatar">{owner.personName.split(" ").map((part) => part[0]).join("")}</span></div>
        <div className="unit-chip"><Home />Unidad {owner.unit} · {owner.parking.level} {owner.parking.number}<ChevronDown /></div>
        {tab === "home" && <>{latestReminder && <section className="owner-payment-alert" aria-label="Nueva alerta de pago"><span className="row-icon"><Bell /></span><div><span>Nueva alerta de pago</span><strong>Recordatorio de la junta</strong><p>{latestReminder.message}</p><small>{latestReminder.sender} · {latestReminder.sentAt}{latestReminder.channels.includes("email") ? " · también enviado por correo demo" : ""}</small></div></section>}<article className={`balance-card ${owner.balance === 0 ? "settled" : ""}`}><span>{owner.balance === 0 ? "Estás al día" : paymentReported ? "Pago reportado · por verificar" : "Saldo por pagar"}</span><strong>{money.format(owner.balance)}</strong><small>{owner.dueDate}</small>{owner.balance > 0 && !paymentReported && <button onClick={() => setReporting(true)}>Reportar pago <ArrowRight /></button>}{paymentReported && <span className="status warning">En revisión de la junta</span>}</article>{reporting && <form className="owner-section owner-payment-form" onSubmit={reportPayment}><div className="section-heading"><h2>Reportar pago ficticio</h2><button type="button" className="text-button" onClick={() => setReporting(false)}>Cancelar</button></div><label className="field"><span>Importe</span><input value={owner.balance} readOnly /></label><label className="field"><span>Número de operación</span><input required minLength={4} maxLength={30} value={operation} onChange={(event) => setOperation(event.target.value)} placeholder="Ej. DEMO-0909" /></label><button className="primary-button">Enviar a revisión</button></form>}<section className="owner-section"><div className="section-heading"><h2>Comunicados</h2><span>{owner.announcements.length} nuevos</span></div>{owner.announcements.map((announcement) => <div className="announcement" key={announcement.title}><span className="announce-dot" /><span><strong>{announcement.title}</strong><small>{announcement.meta}</small></span></div>)}</section></>}
        {tab === "receipts" && <section className="owner-section owner-tab-section"><div className="section-heading"><h2>Mis recibos</h2><span>Septiembre</span></div><button className="receipt-card" onClick={() => setReceiptOpen(true)}><span className="row-icon"><ReceiptText /></span><span><strong>{owner.pendingReceipt}</strong><small>{owner.balance === 0 ? "Pagado en demo" : "Pendiente"}</small></span><ArrowRight /></button>{receiptOpen && <article className="owner-receipt-preview"><div><ReceiptText /><strong>Recibo ficticio · septiembre 2026</strong></div><dl><div><dt>Unidad</dt><dd>{owner.unit}</dd></div><div><dt>Mantenimiento</dt><dd>{money.format(owner.balance)}</dd></div><div><dt>Estado</dt><dd>{paymentReported ? "Pago reportado" : "Pendiente"}</dd></div></dl><p>No es un comprobante tributario ni genera una obligación real.</p><button className="secondary-button compact" onClick={() => setReceiptOpen(false)}>Cerrar vista previa</button></article>}</section>}
        {tab === "access" && <OwnerAccessView tenant={tenant} requests={requests} plates={plates} onSaveRequest={onSaveRequest} onCancelRequest={onCancelRequest} onRequestPlate={onRequestPlate} onNotice={onAction} />}
        {tab === "reservations" && <OwnerReservationsView tenant={tenant} reservations={reservations} onSave={onSaveReservation} onCancel={onCancelReservation} onNotice={onAction} />}
      </div>
      <nav className="phone-nav items-4"><button className={tab === "home" ? "active" : ""} aria-current={tab === "home" ? "page" : undefined} onClick={() => setTab("home")}><Home />Inicio</button><button className={tab === "receipts" ? "active" : ""} aria-current={tab === "receipts" ? "page" : undefined} onClick={() => setTab("receipts")}><ReceiptText />Recibos</button><button className={tab === "access" ? "active" : ""} aria-current={tab === "access" ? "page" : undefined} onClick={() => setTab("access")}><Users />Accesos</button><button className={tab === "reservations" ? "active" : ""} aria-current={tab === "reservations" ? "page" : undefined} onClick={() => setTab("reservations")}><CalendarDays />Reservas</button></nav>
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
