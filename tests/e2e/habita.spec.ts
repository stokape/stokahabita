import { expect, test, type Page } from "@playwright/test";

async function openRoleHub(page: Page) {
  await page.goto("/");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("heading", { name: "Elige una demo independiente" })).toBeVisible();
}

async function openApp(page: Page) {
  await openRoleHub(page);
  await page.getByRole("button", { name: "Abrir demo de Presidente de la junta" }).click();
}

test("cambia de tenant y simplifica la vista de una torre", async ({ page }, testInfo) => {
  await openApp(page);
  await expect(page.getByRole("heading", { name: "Vista por torres" })).toBeVisible();
  await expect(page.locator(".tower-card")).toHaveCount(3);

  await page.getByLabel("Condominio", { exact: true }).selectOption("parque-del-sol");
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
  await openRoleHub(page);
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport);

  await page.getByRole("button", { name: "Abrir demo de Propietario" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByText("Hola, Ana")).toBeVisible();
  await expect(page.getByRole("button", { name: /Reportar pago/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegación móvil" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir menú" })).toHaveCount(0);
  await page.getByRole("button", { name: "Volver a las demos" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole("heading", { name: "Elige una demo independiente" })).toBeVisible();
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

test("prepara convenios, compara proveedores y registra portería solo en la demo", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "El recorrido completo se cubre una vez en escritorio.");
  await openApp(page);

  await page.getByRole("button", { name: "Morosidad y convenios", exact: true }).click();
  await page.getByLabel("Pago inicial").fill("400");
  await page.getByLabel("Número de cuotas").selectOption("4");
  await page.getByRole("button", { name: "Preparar propuesta" }).click();
  await expect(page.getByRole("status")).toContainText("no cambió la deuda");

  await page.getByRole("button", { name: "Proveedores", exact: true }).click();
  await page.getByRole("button", { name: "Preseleccionar", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Preseleccionado", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Portería", exact: true }).click();
  await page.getByLabel("Nombre o descripción").fill("Lucía Campos");
  await page.getByRole("button", { name: "Registrar en demo" }).click();
  await expect(page.getByText("Lucía Campos")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("solo en esta pestaña");
});

test("ofrece una demo diferenciada para cada rol", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "El recorrido de todos los roles se cubre en escritorio.");
  await openRoleHub(page);
  await expect(page.locator(".role-option")).toHaveCount(8);

  await page.getByRole("button", { name: "Abrir demo de Tesorero de la junta" }).click();
  await expect(page.getByRole("heading", { name: "Finanzas" })).toBeVisible();
  await expect(page.getByText("Carlos Vega").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Personas y accesos", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Cambiar demo" }).click();
  await page.getByRole("button", { name: "Abrir demo de Secretario de la junta" }).click();
  await expect(page.getByRole("heading", { name: "Asambleas y acuerdos" })).toBeVisible();

  await page.getByRole("button", { name: "Cambiar demo" }).click();
  await page.getByRole("button", { name: "Abrir demo de Administrador de condominio" }).click();
  await expect(page.getByRole("heading", { name: /Buenos días, Personal/ })).toBeVisible();

  await page.getByRole("button", { name: "Cambiar demo" }).click();
  await page.getByRole("button", { name: "Abrir demo de Conserje de turno" }).click();
  await expect(page.getByRole("heading", { name: "Portería" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Finanzas", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Cambiar demo" }).click();
  await page.getByRole("button", { name: "Abrir demo de Personal de mantenimiento" }).click();
  await expect(page.getByRole("heading", { name: "Mantenimiento e inventario" })).toBeVisible();

  await page.getByRole("button", { name: "Cambiar demo" }).click();
  await page.getByRole("button", { name: "Abrir demo de Super admin · Stoka Habita" }).click();
  await expect(page.getByRole("heading", { name: "Operación de Stoka Habita" })).toBeVisible();

  await page.getByRole("button", { name: "Cambiar demo" }).click();
  await page.getByRole("button", { name: "Abrir demo de Propietario" }).click();
  await expect(page.getByText("Hola, Ana")).toBeVisible();
});

test("portería móvil conserva solo su navegación operativa", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Validación específica del viewport móvil.");
  await openRoleHub(page);
  await page.getByRole("button", { name: "Abrir demo de Conserje de turno" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole("heading", { name: "Portería" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Navegación móvil" });
  await expect(nav.getByRole("button", { name: "Portería", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Incidencias", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Avisos", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Mi unidad", exact: true })).toHaveCount(0);
});

test("abre morosidad desde Más sin desborde móvil", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Validación específica del viewport móvil.");
  await openApp(page);
  await page.getByRole("button", { name: "Más", exact: true }).click();
  await page.getByRole("button", { name: "Morosidad y convenios", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Morosidad y convenios" })).toBeVisible();
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport);
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
