# Stoka Habita

Versión local funcional de la plataforma SaaS para juntas de condominios de Perú. Incluye una demo navegable del incremento inicial y una base PostgreSQL preparada para continuar hacia producción sin confundir simulaciones con seguridad real.

## Inicio rápido: demo sin credenciales

```powershell
npm install
npm run dev
```

Abre `http://localhost:3000`. La portada usa únicamente datos ficticios. Las acciones demostrativas se guardan en el almacenamiento local del navegador y pueden eliminarse con `Reiniciar`.

Para una evaluación ordenada, usa `Cómo probar` y recorre los cinco casos sugeridos cambiando de perfil. `Enviar feedback` guarda cada comentario con el condominio, perfil y módulo actuales. Desde ese panel la junta puede compartir, copiar o descargar el archivo `feedback-stoka-habita.json` para enviarlo al equipo.

## PostgreSQL local y aislamiento

```powershell
docker compose up -d postgres
Copy-Item .env.example .env.local
```

En `.env.local`, conserva `APP_MODE=database`, usa la URL local del contenedor y reemplaza `SESSION_PASSWORD` por un valor local de 32 caracteres o más. No compartas ese archivo ni secretos en el chat.

```powershell
npm run db:migrate
npm run db:seed
npm run dev -- -p 3002
```

Abre `http://localhost:3002/database`. El acceso de desarrollo permite probar las dos membresías sembradas; queda desactivado automáticamente en producción. Esa pantalla sí usa cookie cifrada, membresía resuelta en servidor, rol PostgreSQL restringido y RLS. No es el mecanismo de inicio de sesión definitivo.

## Funciones comprobables

- Los Jardines con 3 torres, 96 unidades y vista comparativa.
- Parque del Sol con 1 edificio, 24 unidades y vista simplificada.
- Panel de junta, unidades, personas/permisos, finanzas, morosidad y convenios, proveedores y concursos, portería, conciliación, mantenimiento, reservas, incidencias, asambleas, documentos, comunicados, transferencia de gestión, operador y portal móvil.
- Alertas de pago desde las demos de presidente, tesorero y secretario: selección múltiple de responsables, entrega visible en el portal demo del propietario y simulación explícita del canal correo.
- Portada con ocho demos independientes para presidente, tesorero y secretario de junta; propietario; administrador de condominio; conserje de turno; personal de mantenimiento; y super admin de Stoka Habita. Cada perfil abre su propio espacio y permite volver con `Cambiar demo`; esta selección no sustituye autenticación ni autorización de servidor.
- Interacciones demo persistentes en el navegador, reinicio controlado, recorridos guiados y feedback exportable.
- Formularios ficticios para unidades, emisiones, activos, convocatorias, incidencias y pagos reportados; vistas de documentos, recibos, inventario, consumibles y garantías.
- Esquema PostgreSQL para 21 entidades, migraciones, datos semilla, RLS por tenant y auditoría inmutable.
- Confirmación persistente de pagos con permiso de servidor, bloqueo de duplicados, transacción y registro de auditoría.
- Sesión cifrada local y verificación negativa de cruce entre tenants.

## Verificación

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

Con PostgreSQL y el servidor de modo `database` activos:

```powershell
npm run db:verify
npm run auth:verify
npm run payments:verify
```

`npm run qa:capture` genera capturas locales de escritorio y móvil en una carpeta ignorada por Git.

## Límites antes de publicar

No están conectados un proveedor real de identidad, correo, almacenamiento privado, banco, pasarela, reuniones, facturación electrónica ni monitoreo. Las automatizaciones jurídicas —intereses, multas, quórum y voto formal— requieren validación legal peruana. El backlog y el contrato visual se conservan como documentación local no versionada.

El código se versiona en GitHub. El despliegue y los servicios externos se configuran por separado.
