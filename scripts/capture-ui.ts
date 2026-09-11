import { mkdir } from "node:fs/promises";
import { chromium, devices } from "@playwright/test";

const baseURL = process.env.QA_BASE_URL ?? "http://localhost:3001";
const output = ".impeccable/review";

async function main() {
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await desktop.emulateMedia({ reducedMotion: "reduce" });
    await desktop.goto(baseURL);
    await desktop.locator(".app-shell[data-ready=true]").waitFor();
    await desktop.getByRole("button", { name: "Finanzas", exact: true }).click();
    await desktop.waitForTimeout(50);
    await desktop.screenshot({ path: `${output}/desktop.png`, fullPage: true });

    const singleTower = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await singleTower.emulateMedia({ reducedMotion: "reduce" });
    await singleTower.goto(baseURL);
    await singleTower.locator(".app-shell[data-ready=true]").waitFor();
    await singleTower.getByLabel("Condominio").selectOption("parque-del-sol");
    await singleTower.waitForTimeout(50);
    await singleTower.screenshot({ path: `${output}/single-tower.png`, fullPage: true });

    const mobile = await browser.newPage({ ...devices["iPhone 13"], viewport: { width: 375, height: 812 } });
    await mobile.emulateMedia({ reducedMotion: "reduce" });
    await mobile.goto(baseURL);
    await mobile.locator(".app-shell[data-ready=true]").waitFor();
    await mobile.getByRole("button", { name: "Abrir menú" }).click();
    await mobile.getByRole("button", { name: "Reservas", exact: true }).click();
    await mobile.waitForTimeout(50);
    await mobile.screenshot({ path: `${output}/mobile.png`, fullPage: true });

    const owner = await browser.newPage({ ...devices["iPhone 13"], viewport: { width: 375, height: 812 } });
    await owner.emulateMedia({ reducedMotion: "reduce" });
    await owner.goto(baseURL);
    await owner.locator(".app-shell[data-ready=true]").waitFor();
    await owner.getByRole("button", { name: "Mi unidad", exact: true }).click();
    await owner.waitForTimeout(50);
    await owner.screenshot({ path: `${output}/owner-mobile.png`, fullPage: true });
    console.log(`Capturas guardadas en ${output}.`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
