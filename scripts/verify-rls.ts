import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL es obligatorio para verificar RLS.");

const pool = new Pool({ connectionString: databaseUrl });

async function countVisible(tenantId?: string) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role stoka_app");
    if (tenantId) await client.query("select set_config('app.tenant_id', $1, true)", [tenantId]);
    const tenantRows = await client.query<{ slug: string }>("select slug from tenants order by slug");
    const unitRows = await client.query<{ count: string }>("select count(*)::text as count from units");
    await client.query("rollback");
    return { slugs: tenantRows.rows.map((row) => row.slug), units: Number(unitRows.rows[0].count) };
  } finally {
    client.release();
  }
}

async function main() {
  try {
    const anonymous = await countVisible();
    if (anonymous.slugs.length !== 0 || anonymous.units !== 0) throw new Error("Sin tenant activo, RLS debe ocultar todos los datos.");

    const knownIds = [
      "b1e8cdb9-ce90-4463-a0f5-90db67cf7b3d",
      "2b6ccd06-b6be-4f9a-a0f1-3df79dfe16a9",
    ];
    const results = await Promise.all(knownIds.map(countVisible));
    if (results.some((result) => result.slugs.length > 1)) throw new Error("RLS expuso más de un tenant.");
    if (results.filter((result) => result.slugs.length === 1).length !== 2) throw new Error("No se pudieron verificar ambos tenants sembrados.");
    if (results.map((result) => result.units).sort((a, b) => a - b).join(",") !== "24,96") throw new Error("RLS no aisló las unidades esperadas.");
    console.log("RLS verificado: cada sesión ve únicamente 24 o 96 unidades de su tenant.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
