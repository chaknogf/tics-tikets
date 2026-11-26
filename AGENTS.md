# AGENTS.md — `tics-tikets` (frontend Angular)

## Qué es este proyecto

Cliente web de tickets/equipos del hospital. Es una app Angular 20 standalone que consume la API FastAPI del repo hermano `../itcrows_api`.

- Entrada: `src/main.ts:1-8` → `bootstrapApplication(AppComponent, { providers: [provideRouter(routes)] })`.
- Shell: `src/app/app.component.ts:11-18`, `app.component.html:1-14`.
- Rutas: `src/app/app.routes.ts:16-34`.
- Estilos: Bootstrap/Bootswatch en `src/styles.css` (generado desde `src/styles.full.css`).
- Base de datos/estado local: `localStorage` (`access_token`, `username`, `role`).

## Comandos (solo pnpm)

```bash
pnpm install
pnpm start          # ng serve -> http://localhost:4200
pnpm run purge      # postcss src/styles.full.css -o src/styles.css
pnpm run build      # purga + ng build --configuration production
pnpm test           # ng test (si se habilita; ver deuda técnica abajo)
```

No usar `npm` ni `yarn`. El script `build` usa `pnpm run purge`. Para pruebas no hay script `test` todavía; los `.spec.ts` actuales están obsoletos (ver "Trampas").

La skill de Google `modern-web-guidance` está instalada en `.agents/skills/modern-web-guidance`. Úsala (`skill modern-web-guidance`) antes de cambiar HTML/CSS/TS de UI, accesibilidad, compatibilidad de navegadores o rendimiento frontend. `pnpm run build` pasa, con warnings no bloqueantes de `canvg` CommonJS y browserslist desactualizado.

`src/environments` no existe. La URL de la API está fija en `src/app/services/api.service.ts:10`:

```ts
public readonly baseUrl = 'https://www.htecpan.com/tik';
// public readonly baseUrl = 'http://localhost:8000'; // :11 (local, comentada)
```

En local el backend real corre en `http://localhost:8006` (`../itcrows_api/comandos.txt:7,18`). Si cambias `baseUrl`, el WebSocket se deriva de ella (`notificaciones.service.ts:24`).

## Mapa de carpetas

```
src/app/
├── app.component.*            Shell; oculta navbar en / e /inicio (:38-51)
├── app.routes.ts              16 rutas + wildcard (:16-34)
├── guards/auth.guard.ts       CanActivate; solo revisa localStorage['username'] (:11-19)
├── interface/interfaces.ts    TODOS los modelos TS (235 líneas)
├── services/
│   ├── api.service.ts         Único cliente HTTP (Axios) + interceptor Bearer (:23-42)
│   ├── notificaciones.service.ts  WebSocket + BehaviorSubject + audio (:11-60)
│   ├── icon.service.ts        SVG sanitizados con bypassSecurityTrustHtml (:10-12)
│   └── modal.service.ts       Subject para abrir login-modal (:7-12)
├── shared/icons/icons.ts      ~56 constantes SVG
├── login/                     Form login; tras login conecta WS (:43-51)
├── navbar/                    Navegación + logout (:51-94)
├── notificador/               Toasts globales incluidos en app.component.html:12
├── solicitudUsuario/          Página pública: crear ticket, buscar, generar PDF
├── soporte/
│   ├── tikets/                Dashboard /dash (tabla + filtros + paginación)
│   ├── charts/                Gráficas CSS + /dashboard/solicitudes (:34-56)
│   ├── formulario/            Alta/edición de ticket (/ticket, /ticket/:id, /tiket/:origen)
│   ├── detalle/               Detalle/imprimir ticket
│   └── reporteria/            /resumen/ + /user/ (:30-87)
├── equipos/
│   ├── equipos/               Listado /equipos/
│   ├── formEquipo/            Alta/edición /equipo/crear, /equipo/actualizar/:id
│   ├── verEquipo/             Detalle /ver-equipo/:id
│   └── reporte/               /reporteEquipos (estado 'A', limit 200)
├── pdfTicket/                 html2canvas + jsPDF; ruta /ticketPdf/:id
└── usuarios/
    ├── editar-usuario/        /auth/allme + /user/actualizar/:id
    └── cambiarPassword/       Llama PATCH /user/:id/password, pero no está montado
```

## Grafo de relaciones con el backend (`itcrows_api`)

Convención: `ApiService.method()` → `BACKEND handler` → componentes que lo consumen.

| Método TS (definición) | Endpoint efectivo | Handler FastAPI | Consumidores |
|---|---|---|---|
| `login()` `api.service.ts:50-66` | POST `/tik/auth/login` | `login()` `app/auth/login.py:18-39` | `login.component.ts:43` |
| `getCurrentUser()` `:72-104` | GET `/tik/auth/me` | `me()` `login.py:42-55` | `login.component.ts:43,65` |
| `meUser()` `:106-121` | GET `/tik/auth/allme` | `me()` `login.py:58-71` | `editar-usuario.ts:60` |
| `getUsers()` `:159-171` | GET `/tik/user/` | `get_users()` `routes/user.py:49-79` | `reporteria.component.ts:49` |
| `updateUser()` `:196-212` | PUT `/tik/user/actualizar/{userId}` | `update_user()` `user.py:106-122` | `editar-usuario.ts:49` |
| `cambiarPassword()` `:214-242` | PATCH `/tik/user/{id}/password` | `update_password()` `user.py:125-146` | `cambiarPassword.component.ts:44` (sin ruta) |
| `getTickets()` `:258-270` | GET `/tik/tickets/` | `get_tickets()` `routes/solicitudes.py:42-85` | `tikets.component.ts:83`, `solicitudUsuario.component.ts:274` |
| `getTicket()` `:274-285` | GET `/tik/tickets/?id=...` | `get_tickets()` `:42-85` | `detalle.component.ts:53`, `formulario.component.ts:95`, `pdfTicket.component.ts:38` |
| `createTicket()` `:299-315` | POST `/tik/ticket/crear/` | `create_ticket()` `solicitudes.py:100-135` | `solicitudUsuario.component.ts:131,166`, `formulario.component.ts:187` |
| `updateTicket()` `:334-349` | PUT `/tik/ticket/actualizar/{id}` | `update_ticket()` `:155-176` | `solicitudUsuario.component.ts:143`, `formulario.component.ts:198` |
| `getNotas()` `:288-296` | GET `/tik/ticketdata/{id}` | `get_ticket_data()` `:88-97` | sin consumidor |
| `createNota()` `:318-331` | POST `/tik/nota/crear/` | `create_seguimiento()` `:138-152` | sin consumidor |
| `getEquipos()` `:377-390` | GET `/tik/equipos/` | `get_equipos()` `routes/equipos.py:25-59` | `equipos.component.ts:57`, `reporte.component.ts:57` |
| `equipo()` `:392-403` | GET `/tik/equipos/?id=...` | `get_equipos()` `:25-59` | `formEquipo.component.ts:149`, `verEquipo.component.ts:82` |
| `createEquipo()` `:418-434` | POST `/tik/equipo/crear/` | `create_equipo()` `:75-89` | `formEquipo.component.ts:197` |
| `updateEquipo()` `:436-452` | PUT `/tik/equipo/actualizar/{id}` | `update_equipo()` `:91-111` | `formEquipo.component.ts:208` |
| `getDashboardSolicitudes()` `:465-474` | GET `/tik/dashboard/solicitudes` | `dashboard_solicitudes()` `solicitudes.py:215-290` | `charts.component.ts:37` |
| `getResumen()` `:476-494` | GET `/tik/resumen/` | `get_resumen_diario()` `solicitudes.py:293-324` | `reporteria.component.ts:58` |

Métodos declarados pero sin consumidor ni contraparte backend: `usuarioActual()` `:146-156`, `getUser()` `:173-183`, `createUser()` `:185-194`, `deleteUser()` `:244-253` (DELETE `/user/eliminar/:id` no existe), `getEquipo(nobien)` `:405-416`, `deleteTicket()` `:352-361`, `deleteNota()` `:364-373`, `deleteEquipo()` `:454-463`.

### Flujo de notificaciones

```
login.component.ts:43  → ApiService.login() → /auth/login
                       → ApiService.getCurrentUser() → /auth/me → user.id
login.component.ts:48  → NotificacionesService.conectar(user.id)
notificaciones.service.ts:24-25 → wss://www.htecpan.com/tik/ws/notificaciones/{user_id}
backend routes/ws.py:7-17 → manager.connect()
backend routes/solicitudes.py:117-126 → manager.broadcast({tipo:'ticket_creado', ticket, prioridad, ...})
notificador.ts:28-29 → notificaciones$ → notificador.html:2-8
```

`broadcast` ignora `user_id`; todos los sockets reciben todas las creaciones. No hay reconexión: si recargas la página, no se reconecta el WS.

## Contratos de datos (sincronizar con el backend)

Todos los tipos están en `src/app/interface/interfaces.ts`. Si cambias un campo, actualiza también el schema Pydantic correspondiente en `../itcrows_api/app/schemas/`.

| TS | Backend | Notas |
|---|---|---|
| `Usuarios` `:1-9` | `UserModel` `../itcrows_api/app/models/user.py:4-13` | `/auth/allme` devuelve `password`; `/auth/me` no |
| `Ticket` `:27-46` | `TicketModel` `../itcrows_api/app/models/models.py:19-39` | El backend sobrescribe `fecha_solicitud`/`hora` en `solicitudes.py:106-110` |
| `Seguimiento` `:48-54` | `SeguimientoModel` `models.py:43-53` | Sin uso en el frontend |
| `DatosTecnicos` `:56-97` | `app/schemas/equipo.py:6-47` | Espejo casi exacto; se guarda en JSONB |
| `SoftwareInstalado` `:99-104` | `equipo.py:49-53` | Claves `r0`, `r1`, ... |
| `Redes` `:106-111` | `equipo.py:55-59` | — |
| `Actualizacion` `:113-117` | `equipo.py:61-64` | Usuario hardcodeado `'Ronald Chacon'` en `formEquipo.component.ts:133-137` |
| `Equipo`/`EquipoCrear` `:118-138` | `models.py:7-17`, `equipo.py:66-92` | `EquipoUpdate` exige `id: int` |
| `Estados`/`DashboardSolicitudes` `:140-173,199-211` | `dashboard.py:4-29` | Ver desajustes abajo; hay tipos duplicados en el mismo archivo |
| `ResumenItem`/`ResumenResponse` `:214-235` | `models.py:56-102`, `solicitud.py:81-121` | Backend devuelve `diseño`; se renombra a `diseno` en `reporteria.component.ts:64-74` |

## Convenciones para cambios

1. Componentes **standalone**; no crear NgModules. `selector: 'app-...'`, `imports` explícitos.
2. Todo HTTP pasa por `ApiService` (Axios, `async/await`, `try/catch`). No usar `HttpClient` en componentes.
3. Interceptor Bearer ya lee `localStorage['access_token']` (`api.service.ts:31-42`); no duplicarlo.
4. Formularios con `FormBuilder` + `Validators.required`; valores por defecto en español (`'Baja'`, `'Abierto'`, `'A'`).
5. IDs de ticket generados en cliente: ``TKT${yy}${MM}${crypto.randomUUID().slice(0,4).toUpperCase()}`` (`solicitudUsuario.component.ts:106-112`, `formulario.component.ts:117-123`).
6. Limpieza de payloads antes de PUT: `limpiarPayload()` recursivo (`solicitudUsuario.component.ts:114-125`, `formulario.component.ts:125-142`, `formEquipo.component.ts:160-177`).
7. Iconos SVG centralizados en `shared/icons/icons.ts` e inyectados vía `IconService`.
8. Idioma de logs/mensajes: español. `.editorconfig`: 2 espacios, comillas simples, UTF-8.
9. TypeScript estricto + `strictTemplates`: cualquier cambio de modelo debe actualizar `interfaces.ts` **y** el schema Pydantic del backend.

## Trampas conocidas (no asumir que está sano)

- `auth.guard.ts:11-19` solo revisa `localStorage['username']`; no valida JWT, expiración ni rol. El backend tampoco usa `get_current_admin_user`; **no hay autorización por rol real**.
- `cambiarPassword.component.ts` no está en ninguna ruta ni template.
- `deleteUser()` llama a un endpoint inexistente.
- `editar-usuario.ts:49` envía el objeto `Usuarios` completo, incluido el hash `password` de `/allme`; `update_user()` lo asigna crudo (`user.py:116-117`) y puede sobrescribir el hash.
- `ApiService.cambiarPassword()` envía `{password_actual, password_nueva}`; el backend espera `{new_password, confirm_password}` (`../itcrows_api/app/schemas/schemas.py:20-22`) y no verifica la actual.
- `getDashboardSolicitudes()` está tipado como `DashboardResumen[]` pero el backend devuelve un objeto; `charts.component.ts:40-42` castea.
- `Estados` en `interfaces.ts:140-147` usa `abiertos/en_proceso/cerrados`, backend usa `abierto/en_proceso/cerrado`.
- `tikets.component.ts:86` hardcodea `totalRegistros = 100`; el backend no devuelve total.
- `tikets.component.html:222,226` usa `icons['editorMini']`/`icons['detalleMini']` que no se inicializan (`tikets.component.ts:50-54`).
- Audio `/assets/sounds/lisa.mp3` (`notificaciones.service.ts:12`) es absoluto, pero deploy sirve bajo `/tics/` (`deploy.sh:9`).
- `detail/:id` y `ticketPdf/:id` no tienen `AuthGuard`.
- `app.config.ts` existe pero `main.ts` no lo usa.
- Tests rotos: `app.component.spec.ts` espera título inexistente; `auth.guard.spec.ts:4` importa `authGuard` (la clase es `AuthGuard`); `notificador.spec.ts:3` importa `Notificador`; `reporteria.component.spec.ts` y `cambiarPassword.component.spec.ts` usan `async()` obsoleto + `declarations` en standalone. No hay script `test` en `package.json`.
- `styles.cs` es un artefacto CSS con extensión `.cs`; `angular.json:37-39` usa `styles.css`.
- Hay `pnpm-lock.yaml` y `yarn.lock` a la vez; usar solo `pnpm-lock.yaml`.

## Checklist al tocar una feature

1. ¿El cambio toca un campo? → actualizar `interfaces.ts` + `../itcrows_api/app/schemas/` + cualquier `formGroup` que lo cargue.
2. ¿El cambio toca una URL? → actualizar `api.service.ts` **y** el handler en `../itcrows_api/main.py`/routers, recordando el prefijo `/tik`.
3. ¿El cambio toca notificaciones? → actualizar `notificaciones.service.ts` **y** el payload de `manager.broadcast()` en `../itcrows_api/app/routes/solicitudes.py:117-126`.
4. Ejecutar `pnpm run build` antes de terminar.
