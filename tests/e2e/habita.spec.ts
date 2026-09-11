import { expect, test, type Page } from "@playwright/test";

async function openApp(page: Page) {
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
}

test("cambia de tenant y simplifica la vista de una torre", async ({ page }, testInfo) => {
  await openApp(page);
  await expect(page.getByRole("heading", { name: "Vista por torres" })).toBeVisible();
  await expect(page.locator(".tower-card")).toHaveCount(3);

  await page.getByLabel("Condominio").selectOption("parque-del-sol");
  await expect(page.getByRole("heading", { name: "Estado del condominio" })).toBeVisible();
  await expect(page.locator(".tower-card")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Edificio", exact: true }).first()).toHaveAttribute("aria-current", "page");

  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Más", exact: true }).click();
  }
  await page.getByRole("button", { name: "Personas y accesos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Personas y accesos" })).toBeVisible();
  await expect(page.getByText("Diego Salas")).toBeVisible();
  await expect(page.getByText("María Torres")).toHaveCount(0);
});

test("solo habilita confirmar pago después de verificar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "El flujo se cubre una vez en escritorio.");
  await openApp(page);
  await page.getByRole("button", { name: /Revisar pago/ }).click();

  const confirm = page.getByRole("button", { name: "Confirmar en demo" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel("Movimiento bancario").selectOption("mov-demo");
  await page.getByLabel("Importe y operación verificados").check();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByRole("status")).toContainText("solo en esta sesión demo");
});

test("la vista móvil no desborda y abre el portal del propietario", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Validación específica del viewport móvil.");
  await openApp(page);
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport);

  await page.getByRole("button", { name: "Mi unidad" }).click();
  await expect(page.getByText("Hola, Ana")).toBeVisible();
  await expect(page.getByRole("button", { name: /Reportar pago/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegación móvil" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir menú" })).toHaveCount(0);
  await page.getByRole("button", { name: "Volver al panel demo" }).click();
  await expect(page.getByRole("heading", { name: "Vista por torres" })).toBeVisible();
});

test("el menú móvil cierra sin desplazar la vista de reservas", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Validación específica del viewport móvil.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openApp(page);
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("button", { name: "Reservas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Reservas y garantías" })).toBeVisible();
  await expect(page.locator(".sidebar-scrim")).toHaveCount(0);
  const layout = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    mainLeft: document.querySelector("main")?.getBoundingClientRect().left,
  }));
  expect(layout.scroll).toBeLessThanOrEqual(layout.viewport);
  expect(layout.mainLeft).toBe(0);
});

test("recorre finanzas, mantenimiento y reservas con estados útiles", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "El recorrido amplio se cubre una vez en escritorio.");
  await openApp(page);

  await page.getByRole("button", { name: "Finanzas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Finanzas" })).toBeVisible();
  await expect(page.getByText("S/ 17,000")).toBeVisible();

  await page.getByRole("button", { name: "Mantenimiento", exact: true }).click();
  await page.getByRole("button", { name: "Registrar", exact: true }).first().click();
  await expect(page.getByText("Realizado", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Reservas", exact: true }).click();
  await page.getByLabel("Fecha").fill("2026-09-12");
  await page.getByRole("button", { name: "Crear solicitud" }).click();
  await expect(page.locator(".inline-error")).toContainText("ya está reservado");
  await page.getByLabel("Fecha").fill("2026-09-14");
  await page.getByRole("button", { name: "Crear solicitud" }).click();
  await expect(page.getByRole("status")).toContainText("pendiente de validación de pago");
});

test("documentos permanecen locales y la entrega exige todos los bloques", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "El recorrido amplio se cubre una vez en escritorio.");
  await openApp(page);

  await page.getByRole("button", { name: "Documentos", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "acta-demo.pdf", mimeType: "application/pdf", buffer: Buffer.from("demo") });
  await expect(page.getByText("acta-demo.pdf")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("No se subió");

  await page.getByRole("button", { name: "Entrega de gestión", exact: true }).click();
  const accept = page.getByRole("button", { name: "Aceptar entrega demo" });
  await expect(accept).toBeDisabled();
  for (const checkbox of await page.getByRole("checkbox").all()) {
    if (!(await checkbox.isChecked())) await checkbox.check();
  }
  await expect(accept).toBeEnabled();
});
