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
  await page.getByRole("button", { name: "Volver a las demos" }).first().click();
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

test("la junta envía alertas de pago a la app y simula el correo", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "El flujo multirrol se cubre una vez en escritorio.");
  await openRoleHub(page);

  for (const role of ["Presidente de la junta", "Tesorero de la junta", "Secretario de la junta"]) {
    await page.getByRole("button", { name: `Abrir demo de ${role}` }).click();
    await expect(page.getByRole("button", { name: "Alertas de pago", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Cambiar demo" }).click();
  }

  await page.getByRole("button", { name: "Abrir demo de Administrador de condominio" }).click();
  await expect(page.getByRole("button", { name: "Alertas de pago", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Cambiar demo" }).click();

  await page.getByRole("button", { name: "Abrir demo de Secretario de la junta" }).click();
  await page.getByRole("button", { name: "Alertas de pago", exact: true }).click();
  await page.getByRole("checkbox", { name: /A-203 · Ana Pérez/ }).check();
  await page.getByRole("button", { name: "Enviar alertas en demo" }).click();
  await expect(page.getByRole("status")).toContainText("la app demo y el correo simulado");
  await expect(page.getByText("App demo entregada")).toBeVisible();
  await expect(page.getByText("Correo simulado", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Cambiar demo" }).click();
  await page.getByRole("button", { name: "Abrir demo de Propietario" }).click();
  await expect(page.getByLabel("Nueva alerta de pago")).toContainText("Recordatorio de la junta");
  await expect(page.getByLabel("Nueva alerta de pago")).toContainText("también enviado por correo demo");
});

test("alertas de pago mantiene el flujo usable en móvil", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Validación específica del viewport móvil.");
  await openRoleHub(page);
  await page.getByRole("button", { name: "Abrir demo de Secretario de la junta" }).click();
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("button", { name: "Alertas de pago", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Alertas de pago" })).toBeVisible();
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport);
  await page.getByRole("checkbox", { name: /A-203 · Ana Pérez/ }).check();
  await expect(page.getByRole("button", { name: "Enviar alertas en demo" })).toBeEnabled();
});

test("conecta accesos, placas y reservas entre propietario, portería y junta", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "El flujo multirrol se cubre una vez en escritorio.");
  await openRoleHub(page);
  await page.getByRole("button", { name: "Abrir demo de Propietario" }).click();

  await page.getByRole("button", { name: "Accesos", exact: true }).click();
  await page.getByLabel("Una o más personas").fill("Elena Ruiz, Martín Ruiz");
  await page.getByLabel("Tipo de acceso").selectOption("Vehicular");
  await page.getByLabel("Placa visitante").fill("TST-909");
  await page.getByRole("button", { name: "Autorizar acceso" }).click();
  await expect(page.getByText("Elena Ruiz, Martín Ruiz")).toBeVisible();
  await expect(page.getByRole("button", { name: /Editar acceso de Elena Ruiz/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Eliminar/ })).toHaveCount(0);

  await page.getByLabel("Nueva placa").fill("NEW-456");
  await page.getByRole("button", { name: "Solicitar aprobación" }).click();
  await expect(page.getByText("NEW-456")).toBeVisible();
  await expect(page.getByText("Por aprobar").last()).toBeVisible();

  await page.getByRole("button", { name: "Reservas", exact: true }).click();
  await page.getByLabel("Área común").selectOption("cine");
  await page.getByRole("button", { name: "Solicitar reserva" }).click();
  await expect(page.getByRole("article").getByText("Sala de cine", { exact: true })).toBeVisible();
  await expect(page.getByText("Garantía reembolsable")).toBeVisible();

  await page.getByRole("button", { name: "Volver a las demos" }).first().click();
  await page.getByRole("button", { name: "Abrir demo de Conserje de turno" }).click();
  await expect(page.getByText("Elena Ruiz, Martín Ruiz")).toBeVisible();
  await expect(page.getByText("TST-909")).toBeVisible();
  await page.locator(".authorized-access article").filter({ hasText: "Elena Ruiz" }).getByRole("button", { name: "Registrar ingreso" }).click();

  await page.getByRole("button", { name: "Cambiar demo" }).click();
  await page.getByRole("button", { name: "Abrir demo de Presidente de la junta" }).click();
  await page.getByRole("button", { name: "Personas y accesos", exact: true }).click();
  await expect(page.getByText("NEW-456")).toBeVisible();
  await page.locator(".plate-review-list article").filter({ hasText: "NEW-456" }).getByRole("button", { name: "Aprobar", exact: true }).click();
  await expect(page.locator(".plate-review-list article").filter({ hasText: "NEW-456" }).getByText("Aprobó: María Torres")).toBeVisible();
  await expect(page.getByText("Sala de cine · unidad A-203")).toBeVisible();
});

test("documentos permanecen locales y la entrega exige todos los bloques", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "El recorrido amplio se cubre una vez en escritorio.");
  await openApp(page);

  await page.getByRole("button", { name: "Documentos", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "acta-demo.pdf", mimeType: "application/pdf", buffer: Buffer.from("demo") });
  await expect(page.getByText("acta-demo.pdf")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("No se subió");

  await page.getByRole("button", { name: "Entrega de gestión", exact: true }).click();
  await page.getByRole("button", { name: "Más información sobre Transferencia de junta de propietarios" }).hover();
  await expect(page.getByRole("tooltip").first()).toBeVisible();
  await expect(page.getByRole("tooltip").first()).toContainText("Para qué sirve");
  await page.getByRole("button", { name: "Elegir esta transferencia" }).first().click();
  const accept = page.getByRole("button", { name: "Aceptar transferencia demo" });
  await expect(accept).toBeDisabled();
  for (const checkbox of await page.getByRole("checkbox").all()) {
    if (!(await checkbox.isChecked())) await checkbox.check();
  }
  await expect(accept).toBeEnabled();
});

test("guarda cambios ficticios, recoge feedback y permite reiniciar la demo", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "El flujo persistente se cubre una vez en escritorio.");
  await openApp(page);
  await page.getByRole("button", { name: "Unidades", exact: true }).click();
  await page.getByRole("button", { name: "Nueva unidad" }).click();
  await page.getByLabel("Código").fill("A-999");
  await page.getByRole("button", { name: "Crear en demo" }).click();
  await expect(page.getByText("A-999", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Abrir demo de Presidente de la junta" }).click();
  await page.getByRole("button", { name: "Unidades", exact: true }).click();
  await expect(page.getByText("A-999", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Enviar feedback/ }).click();
  await page.getByLabel("Tipo de comentario").selectOption("Sugerencia");
  await page.getByRole("textbox", { name: "Comentario", exact: true }).fill("Agregar un filtro para distinguir unidades ocupadas y vacías.");
  await page.getByRole("button", { name: "Guardar feedback" }).click();
  await expect(page.getByRole("status")).toContainText("Feedback guardado");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reiniciar" }).click();
  await expect(page.getByRole("status")).toContainText("estado inicial");
  await expect(page.getByText("A-999", { exact: true })).toHaveCount(0);
});
