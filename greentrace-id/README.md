# GreenTrace ID 🌳

> **Trazabilidad ambiental respaldada por código.**

Plataforma web **mobile-first** de adopción y monitoreo digital de árboles reforestados en la Escuela Superior de Cómputo (ESCOM) IPN, Unidad Zacatenco. Cada árbol tiene un identificador único (`GT-UUID`) y un código QR físico vinculado a su perfil digital. Los estudiantes adoptan árboles escaneando el QR desde su celular, registran reportes mensuales con evidencia fotográfica validada por GPS y EXIF, y el sistema calcula la captura estimada de CO₂ mediante ecuaciones alométricas.

---

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Funcionalidades implementadas](#funcionalidades-implementadas)
- [Requisitos previos](#requisitos-previos)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts de base de datos](#scripts-de-base-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Modelos y tablas](#modelos-y-tablas)
- [API — Endpoints principales](#api--endpoints-principales)
- [Módulos de desarrollo](#módulos-de-desarrollo)
- [Convenciones](#convenciones)

---

## Arquitectura

Arquitectura de tres capas desplegada con servicios en la nube:

```
┌─────────────────────────────────────────────────────┐
│                  PRESENTACIÓN                       │
│         React.js + Vite  (Mobile-First)             │
│   html5-qrcode · leaflet · react-hot-toast          │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / REST (JSON + multipart)
┌────────────────────▼────────────────────────────────┐
│              LÓGICA DE NEGOCIO                      │
│           Node.js + Express.js                      │
│  Sequelize ORM · JWT · Multer · Cloudinary SDK      │
│  node-cron (recordatorios + liberación inactivos)   │
└───────────┬────────────────────────┬────────────────┘
            │                        │
┌───────────▼──────────┐  ┌──────────▼──────────────┐
│  PostgreSQL (Supabase)│  │  Cloudinary CDN         │
│  Tablas + soft-delete │  │  Evidencias fotográficas│
└──────────────────────┘  └─────────────────────────┘
```

> ⚠️ **La base de datos ya existe en Supabase.** Sequelize se usa **solo para consultas** (`timestamps: false`). **Nunca** ejecutes `sync()`, `alter` ni `force` — el esquema no se modifica desde el código.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite 5, React Router v6, CSS Modules |
| Escáner QR | `html5-qrcode` v2.3 |
| Mapa | Leaflet.js + react-leaflet + MarkerCluster |
| Backend | Node.js 18+, Express.js 4, Sequelize 6 |
| Base de datos | PostgreSQL (Supabase — Connection Pooler IPv4) |
| Almacenamiento | Cloudinary (evidencias fotográficas) |
| Auth | JWT en memoria (no localStorage), RBAC middleware |
| Offline | IndexedDB (`greentrace-offline`) + auto-sync |
| Correo | Nodemailer + SMTP (Gmail App Password) |
| Tareas cron | `node-cron` (recordatorios 48 h + liberación por inactividad) |
| Validación EXIF | `exifr` (GPS + timestamp en servidor) |
| Compresión imágenes | `browser-image-compression` (cliente, preserva EXIF) |
| Seguridad uploads | `file-type` (magic bytes) + Multer (10 MB límite) |
| Pruebas | Jest + @testing-library/react |

---

## Funcionalidades implementadas

### Rol Estudiante
- Registro con correo `@alumno.ipn.mx` — validación de dominio institucional
- Login con JWT almacenado **en memoria** (sin localStorage/sessionStorage)
- **Escaneo de QR** con cámara trasera via `html5-qrcode`
- Adopción de árbol con **validación de distancia GPS** (≤ 20 m, fórmula Haversine)
- **Reporte mensual** en 3 pasos: evidencia → datos → revisión
- Validación de foto por **metadatos EXIF**: GPS requerido, foto ≤ 24 h de antigüedad, distancia ≤ 20 m al árbol
- Compresión de imágenes en cliente (≤ 2 MB, EXIF preservado)
- **Modo offline**: reportes guardados en IndexedDB, sincronización automática al recuperar internet
- Dashboard personal: CO₂ capturado, biomasa, gráfica de evolución, galería de fotos
- Vista de historial de salud del árbol (cronológica)

### Rol Administrador
- Registro de árbol con mapa interactivo (Leaflet) para posicionar el marcador
- Generación y descarga de **código QR** (PNG) con prefijo `GT-UUID`
- Panel con métricas globales
- Recibe notificaciones por email cuando un reporte indica plaga **severa**

### Sistema automático (cron jobs)
- Recordatorio por email **48 horas antes** de la fecha límite de reporte mensual
- **Liberación automática** de árbol si el estudiante no reporta en 5 días tras el vencimiento
- Notificación al estudiante al liberarse su adopción

### Seguridad
- Validación de MIME type real (magic bytes via `file-type`), no solo extensión
- Subida de archivos limitada a `.jpg` / `.png`, máximo 10 MB
- CORS dinámico configurable por variable de entorno
- Soft delete (`paranoid: true`) — historial nunca se borra
- Coordenadas del árbol redondeadas (±0.001°) en respuestas públicas

---

## Requisitos previos

- **Node.js** ≥ 18
- Cuenta **Supabase** con base de datos PostgreSQL creada (esquema existente)
- Cuenta **Cloudinary** para almacenamiento de fotos
- Cuenta de **Gmail** con App Password habilitado (para emails SMTP)
- `gh` CLI instalado y autenticado (para crear PRs desde terminal)

---

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/Jes6241/Ingeneria-de-software.git
cd Ingeneria-de-software/greentrace-id
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # edita con tus credenciales
npm install
npm run dev               # escucha en http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # escucha en http://localhost:5173
```

### 4. Pruebas (Jest)

```bash
cd backend && npm test
```

---

## Variables de entorno

Archivo: `backend/.env` (copia de `.env.example`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión Supabase (usar el pooler IPv4) | `postgresql://postgres.REF:PASS@aws-0-REGION.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | Clave secreta JWT (mín. 64 caracteres hex) | `a1b2c3...` |
| `JWT_EXPIRES_IN` | Duración del token | `8h` |
| `CLOUDINARY_CLOUD_NAME` | Nombre de cuenta Cloudinary | `mi-cuenta` |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | `123456789` |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary | `abc...` |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Correo remitente | `noreply@gmail.com` |
| `SMTP_PASS` | App Password de Gmail | `xxxx xxxx xxxx xxxx` |
| `ADMIN_EMAIL` | Correo del administrador (recibe alertas) | `admin@escom.ipn.mx` |
| `MAIL_FROM` | Nombre visible en emails | `GreenTrace ID <noreply@...>` |
| `FRONTEND_URL` | URL del frontend (CORS) | `http://localhost:5173` |
| `PORT` | Puerto del servidor API | `3001` |
| `NODE_ENV` | Entorno | `development` |

---

## Scripts de base de datos

Todos los scripts viven en `backend/scripts/` y se ejecutan con `node`:

### Poblar árboles en ESCOM Zacatenco

```bash
cd backend
node scripts/seedTreesESCOM.js
```

**Qué hace:**
1. Elimina **todos** los árboles existentes y sus datos dependientes (`TRUNCATE ... CASCADE`)
2. Inserta **20 árboles** con ubicaciones reales dentro del campus ESCOM IPN Unidad Zacatenco (`19.5050° N, -99.1465° W`)
3. Asigna especies del catálogo existente y fechas de plantación distribuidas entre 2023-2026

### Generar Manual de Usuario (.docx)

```bash
cd backend
node scripts/generarManual.js
```

Convierte `Manual_de_Usuario.md` → `Manual_de_Usuario.docx` con formato profesional (tablas con encabezados verdes, bloqueos de código, notas destacadas).

### Poblar árboles genéricos (varios puntos CDMX)

```bash
cd backend
node scripts/seedTrees.js [cantidad]   # default: 10, máx: 100
```

---

## Estructura del proyecto

```
greentrace-id/
├── frontend/                     # React.js + Vite
│   └── src/
│       ├── components/
│       │   ├── arboles/          # EscanerQR, RegistroArbol
│       │   ├── reportes/         # FormularioReporte (3 pasos), ValidacionEXIF
│       │   └── shared/           # Navbar, Loader, etc.
│       ├── context/              # AuthContext (JWT en memoria)
│       ├── hooks/                # useGeolocation (Haversine + reintentos)
│       ├── pages/                # Home, DetalleArbol, DashboardCO2, MapaLeaflet
│       ├── services/             # api.js (axios + interceptor JWT)
│       └── utils/                # offlineQueue.js (IndexedDB)
│
├── backend/                      # Node.js + Express.js
│   └── src/
│       ├── config/               # database.js, cloudinary.js, logger.js
│       ├── controllers/          # arboles, adopciones, reportes, dashboard, auth
│       ├── jobs/                 # cronJobs.js (recordatorios + liberación)
│       ├── middlewares/          # auth.js, rbac.js, upload.js (magic bytes)
│       ├── models/               # 11 modelos Sequelize
│       ├── routes/               # Rutas REST por recurso
│       └── services/             # auth, arboles, adopciones, reportes, co2, exif, email
│   └── scripts/                  # seedTreesESCOM.js, seedTrees.js, generarManual.js
│
├── Manual_de_Usuario.md          # Manual completo (Markdown)
├── Manual_de_Usuario.docx        # Manual generado (Word)
└── README.md
```

---

## Modelos y tablas

| Modelo | Tabla |
|--------|-------|
| `Usuario` | `usuarios` |
| `Rol` | `roles` |
| `Especie` | `especies` |
| `EcuacionAlometrica` | `ecuaciones_alometricas` |
| `Arbol` | `arboles` |
| `Adopcion` | `adopciones` |
| `Reporte` | `informes` |
| `EvidenciaFotografica` | `evidencias_fotograficas` |
| `ImpactoAmbiental` | `impacto_ambiental` |
| `HistorialEstado` | `historico_estados` |
| `Notificacion` | `notificaciones` |

Las relaciones clave:
- `Arbol` 1:N `Adopcion` (solo una activa a la vez)
- `Adopcion` 1:N `Reporte`
- `Reporte` 1:N `EvidenciaFotografica`
- `Especie` 1:1 `EcuacionAlometrica` (coeficientes alométricos para CO₂)

---

## API — Endpoints principales

Base URL: `http://localhost:3001/api`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Registro (solo `@alumno.ipn.mx`) |
| `POST` | `/auth/login` | — | Login → JWT |
| `GET` | `/arboles` | JWT | Listado de árboles (paginado, máx 50) |
| `POST` | `/arboles` | ADMIN | Registrar árbol |
| `GET` | `/arboles/:id` | JWT | Detalle de árbol |
| `GET` | `/arboles/qr/:idUnico` | JWT | Buscar árbol por ID único (escáner QR) |
| `POST` | `/adopciones` | ESTUDIANTE | Adoptar árbol |
| `GET` | `/adopciones/mis-adopciones` | ESTUDIANTE | Adopciones del usuario |
| `POST` | `/reportes` | ESTUDIANTE | Enviar reporte mensual (multipart) |
| `GET` | `/dashboard/:idArbol` | JWT | Dashboard de árbol (KPIs + galería + CO₂) |
| `GET` | `/especies` | JWT | Catálogo de especies |

---

## Módulos de desarrollo

| Módulo | Descripción | Responsables |
|--------|-------------|--------------|
| H | Registro de árbol, validación QR, geolocalización | Brian, Axel |
| I | Dashboard CO₂, lógica de biomasa, ecuaciones alométricas | Diego, Marco |
| J | Evidencia fotográfica, validación EXIF, reportes de salud | Guadalupe, Jesús |
| K | Pruebas unitarias, integración y seguridad | Brian, Diego, Axel |

---

## Convenciones

- Código en **inglés**; comentarios y UI en **español**
- **Feature Branching** — todo cambio va en rama separada + Pull Request a `main`
- Force push a `main`: **prohibido**
- Paginación siempre del lado del servidor (máx **50** registros por petición)
- Soft delete con `deleted_at` — historial nunca se elimina físicamente
- JWT **nunca** en `localStorage` ni `sessionStorage`
- Validación de archivos por **magic bytes** (no solo extensión)
- Coordenadas exactas solo visibles para el rol `ADMINISTRADOR`
