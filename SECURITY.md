# Seguridad y límites operativos

- El modo `demo` es público, ficticio y en memoria. No representa autenticación ni persistencia.
- El modo `database` exige `DATABASE_URL` y `SESSION_PASSWORD`; el acceso sembrado funciona solo fuera de producción.
- Las cookies son `httpOnly`, `sameSite=lax`, tienen vigencia de 8 horas y usan `secure` en producción.
- Toda operación persistente debe resolver una membresía vigente en servidor, comprobar el permiso y fijar `app.tenant_id` antes de consultar.
- PostgreSQL fuerza RLS en tablas de tenant mediante el rol `stoka_app`, que no tiene `BYPASSRLS`.
- Los eventos de auditoría no admiten actualización ni eliminación mediante la aplicación.
- No se almacenan secretos reales en este repositorio. `.env.local` permanece ignorado.

Antes de producción hacen falta un proveedor de identidad, MFA para roles sensibles, rotación de secretos, límites de solicitudes, almacenamiento privado, monitoreo, backups restaurables y revisión de amenazas.
