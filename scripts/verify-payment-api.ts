import { chromium } from "@playwright/test";
import { Pool } from "pg";
import { stableUuid } from "../src/lib/stable-id";

const baseURL = process.env.AUTH_BASE_URL ?? "http://localhost:3002";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL es obligatorio.");

const tenantId = stableUuid("tenant:los-jardines");
const paymentId = stableUuid("payment:los-jardines:a-203:2026-09");
const movementId = stableUuid("movement:los-jardines:demo-0909");
const payload = { tenantId, paymentId, movementId };

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  await pool.query("update payment_reports set status = 'reported', bank_movement_id = null, reviewed_by = null, reviewed_at = null where id = $1", [paymentId]);
  await pool.query("update bank_movements set reconciled_at = null where id = $1", [movementId]);
  const browser = await chromium.launch({ headless: true });
  try {
    const losJardines = await browser.newContext();
    await losJardines.request.post(`${baseURL}/api/auth/development`, { data: { tenantSlug: "los-jardines" } });
    const confirmed = await losJardines.request.post(`${baseURL}/api/payments/confirm`, { data: payload });
    if (confirmed.status() !== 200) throw new Error(`La confirmación válida respondió ${confirmed.status()}: ${await confirmed.text()}`);
    const duplicate = await losJardines.request.post(`${baseURL}/api/payments/confirm`, { data: payload });
    if (duplicate.status() !== 409) throw new Error(`El duplicado debió rechazarse con 409 y respondió ${duplicate.status()}.`);

    const parque = await browser.newContext();
    await parque.request.post(`${baseURL}/api/auth/development`, { data: { tenantSlug: "parque-del-sol" } });
    const crossed = await parque.request.post(`${baseURL}/api/payments/confirm`, { data: payload });
    if (crossed.status() !== 403) throw new Error(`El cruce de tenant debió rechazarse con 403 y respondió ${crossed.status()}.`);
    console.log("Pago verificado: confirma una vez, rechaza duplicados y bloquea cruces de tenant.");
  } finally {
    await pool.query("update payment_reports set status = 'reported', bank_movement_id = null, reviewed_by = null, reviewed_at = null where id = $1", [paymentId]);
    await pool.query("update bank_movements set reconciled_at = null where id = $1", [movementId]);
    await pool.end();
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
