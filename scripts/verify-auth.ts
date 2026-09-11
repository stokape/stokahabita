import { chromium } from "@playwright/test";

const baseURL = process.env.AUTH_BASE_URL ?? "http://localhost:3002";

async function verifyTenant(slug: "los-jardines" | "parque-del-sol", expectedName: string, expectedUnits: number, forbiddenUnits: number) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  try {
    const response = await context.request.post(`${baseURL}/api/auth/development`, { data: { tenantSlug: slug } });
    if (!response.ok()) throw new Error(`No se pudo crear la sesión para ${slug}: ${response.status()}`);
    const page = await context.newPage();
    await page.goto(`${baseURL}/database`);
    const body = await page.locator("body").innerText();
    if (!body.includes(expectedName) || !body.includes(`Unidades visibles\n${expectedUnits}`)) throw new Error(`La sesión de ${slug} no devolvió su propio tenant.`);
    if (body.includes(`Unidades visibles\n${forbiddenUnits}`)) throw new Error(`La sesión de ${slug} expuso el conteo del otro tenant.`);
  } finally {
    await browser.close();
  }
}

async function main() {
  await verifyTenant("los-jardines", "Los Jardines", 96, 24);
  await verifyTenant("parque-del-sol", "Parque del Sol", 24, 96);
  console.log("Sesiones verificadas: cada tenant conserva su membresía y conteo aislados.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
