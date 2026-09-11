import { DatabaseAccess } from "@/features/database-access";
import { runtimeConfig } from "@/server/config";
import { readSession } from "@/server/auth/session";
import { resolveMembership } from "@/server/dal/auth";

export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  const config = runtimeConfig();
  if (config.APP_MODE !== "database") return <main className="database-gate"><section className="database-card"><h1>Modo base de datos desactivado</h1><p>Usa <code>APP_MODE=database</code> y las variables locales documentadas para probar esta zona.</p></section></main>;
  const session = await readSession();
  const membership = session ? await resolveMembership(session) : null;
  if (!membership) return <DatabaseAccess />;
  return <main className="database-gate" id="main-content"><section className="database-card wide-card">
    <span className="status success">Sesión cifrada y membresía vigente</span>
    <h1>{membership.tenantName}</h1>
    <p>{membership.personName} · {membership.role}</p>
    <dl className="database-facts"><div><dt>Tenant</dt><dd>{membership.tenantSlug}</dd></div><div><dt>Unidades visibles</dt><dd>{membership.unitCount}</dd></div><div><dt>Permisos resueltos en servidor</dt><dd>{membership.permissions.length}</dd></div></dl>
    <p className="module-demo-note"><ShieldIcon />La consulta se ejecutó con el rol de aplicación y políticas RLS activas. Cambiar un selector del navegador no cambia este alcance.</p>
    <form action="/api/auth/logout" method="post"><button className="secondary-button">Cerrar sesión local</button></form>
  </section></main>;
}

function ShieldIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>;
}
