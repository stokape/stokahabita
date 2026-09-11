"use client";

import { Building2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DatabaseAccess() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function enter(tenantSlug: string) {
    setLoading(tenantSlug); setError("");
    const response = await fetch("/api/auth/development", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenantSlug }),
    });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "No se pudo iniciar la sesión local."); setLoading(null); return; }
    router.refresh();
  }

  return <main className="database-gate" id="main-content">
    <section className="database-card">
      <span className="brand-mark" aria-hidden="true"><Building2 /></span>
      <h1>Acceso local a PostgreSQL</h1>
      <p>Este acceso existe solo para desarrollo. En producción se reemplaza por un proveedor de identidad verificado.</p>
      <div className="database-actions">
        <button className="primary-button" disabled={loading !== null} onClick={() => enter("los-jardines")}>{loading === "los-jardines" ? <LoaderCircle className="spin" /> : <ShieldCheck />}Entrar a Los Jardines</button>
        <button className="secondary-button" disabled={loading !== null} onClick={() => enter("parque-del-sol")}>Entrar a Parque del Sol</button>
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
  </main>;
}
