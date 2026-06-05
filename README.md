# 🌳 GreenTrace ID

> **Trazabilidad ambiental respaldada por código.**

Sistema de seguimiento y adopción de árboles urbanos desarrollado para el campus ESCOM del Instituto Politécnico Nacional. Permite a estudiantes adoptar árboles mediante QR, registrar reportes fotográficos mensuales y visualizar el impacto ambiental (CO₂, biomasa) de cada árbol.

---

## Tabla de contenidos

- [Descripción del proyecto](#descripción-del-proyecto)
- [Tecnologías](#tecnologías)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos previos](#requisitos-previos)
- [Instalación y configuración](#instalación-y-configuración)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Variables de entorno](#variables-de-entorno)
- [Uso en desarrollo](#uso-en-desarrollo)
- [Rutas de la API](#rutas-de-la-api)
- [Vistas del frontend](#vistas-del-frontend)
- [Roles y permisos](#roles-y-permisos)
- [Arquitectura](#arquitectura)
- [Autores](#autores)

---

## Descripción del proyecto

GreenTrace ID digitaliza el ciclo de vida de los árboles en el campus:

1. **Administradores** registran árboles con geolocalización y generan códigos QR físicos.
2. **Estudiantes** escanean el QR con la app para adoptar un árbol.
3. Cada mes, el estudiante envía un reporte fotográfico con datos de salud (riego, coloración, plagas).
4. El sistema calcula el impacto ambiental acumulado (captura de CO₂, biomasa) usando ecuaciones alométricas.
5. Un mapa interactivo muestra el estado de todos los árboles en tiempo real.

---

## Tecnologías

| Capa | Stack |
|---|---|
| **Frontend** | React 18 + Vite, React Router v6, CSS Modules (Mobile-First 360 px), Leaflet + react-leaflet, html5-qrcode, qrcode.react, react-hot-toast, axios, IndexedDB (cola offline) |
| **Backend** | Node.js + Express 4, Sequelize v6, PostgreSQL (Supabase), JWT (jsonwebtoken), bcrypt, Multer + Cloudinary (fotos), node-cron, Winston, express-validator |
| **Base de datos** | PostgreSQL en Supabase (Connection Pooler IPv4) |
| **Almacenamiento** | Cloudinary (evidencias fotográficas) |
| **Testing** | Jest + Supertest (backend), Testing Library (frontend) |

---

## Estructura del repositorio

```
Ingeneria-de-software/
└── greentrace-id/
    ├── backend/
    │   ├── src/
    │   │   ├── app.js               # Punto de entrada Express
    │   │   ├── config/              # DB, logger, cloudinary
    │   │   ├── controllers/         # auth, arboles, adopciones, reportes, dashboard
    │   │   ├── jobs/                # Cron: cálculo de impacto ambiental
    │   │   ├── middlewares/         # auth (JWT), errorHandler, upload
    │   │   ├── models/              # Sequelize: Usuario, Arbol, Especie, Adopcion,
    │   │   │                        #   Reporte, EvidenciaFotografica, ImpactoAmbiental,
    │   │   │                        #   HistorialEstado, EcuacionAlometrica, Notificacion, Rol
    │   │   ├── routes/              # auth, arboles, adopciones, reportes, dashboard
    │   │   └── services/            # Lógica de negocio desacoplada
    │   ├── tests/                   # Tests de integración con supertest
    │   ├── .env.example
    │   └── package.json
    │
    └── frontend/
        ├── src/
        │   ├── App.jsx              # Router principal + Navbar
        │   ├── main.jsx             # Punto de entrada React
        │   ├── index.css            # Sistema de diseño (variables, utilidades)
        │   ├── constants/
        │   │   └── roles.js         # ROLES.ADMIN / ROLES.ESTUDIANTE
        │   ├── context/
        │   │   └── AuthContext.jsx  # JWT en memoria, login/logout/hasRole
        │   ├── hooks/
        │   │   ├── useAuth.js
        │   │   └── useGeolocation.js
        │   ├── services/
        │   │   └── api.js           # Axios + interceptores + APIs agrupadas
        │   ├── utils/
        │   │   ├── leafletSetup.js  # Iconos Leaflet + coloredIcon
        │   │   └── offlineQueue.js  # Cola offline con IndexedDB
        │   ├── components/
        │   │   ├── arboles/         # EscanerQR, RegistroArbol
        │   │   ├── auth/            # Login, Register
        │   │   ├── reportes/        # FormularioReporte (3 pasos), ValidacionEXIF
        │   │   └── shared/          # Navbar, Loader, PrivateRoute, ArbolPlaceholder,
        │   │                        #   SvgLineChart, SvgBarChart
        │   └── pages/
        │       ├── Home.jsx         # Panel estudiante / panel administrador
        │       ├── DetalleArbol.jsx # 3 tabs: Información, Historial, Impacto CO₂
        │       ├── DashboardCO2.jsx # KPIs + gráficas + galería fotográfica
        │       ├── MapaLeaflet.jsx  # Mapa interactivo con clustering y filtros
        │       └── NotFound.jsx
        └── package.json
```

---

## Requisitos previos

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Cuenta en **Supabase** con la base de datos creada (schema provisto por el equipo)
- Cuenta en **Cloudinary** (plan gratuito es suficiente)

---

## Instalación y configuración

### Backend

```bash
cd greentrace-id/backend
npm install
cp .env.example .env
# Edita .env con tus credenciales (ver sección Variables de entorno)
npm run dev
```

El servidor arranca en `http://localhost:3001`.

### Frontend

```bash
cd greentrace-id/frontend
npm install
# Crea el archivo .env en la carpeta frontend:
echo "VITE_API_URL=http://localhost:3001/api" > .env
npm run dev
```

La app arranca en `http://localhost:5173`.

> **En GitHub Codespaces** los puertos deben ser públicos y las URLs tendrán el formato  
> `https://<codespace-name>-<port>.app.github.dev`.  
> Actualiza `VITE_API_URL` en `frontend/.env` y `FRONTEND_URL` en `backend/.env` con esas URLs,  
> y ejecuta: `gh codespace ports visibility 3001:public 5173:public`

---

## Variables de entorno

### `backend/.env`

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión Supabase **pooler** (IPv4) | `postgresql://postgres.ref:pass@aws-0-us-west-2.pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | Clave secreta para firmar los tokens JWT | `clave-super-secreta` |
| `JWT_EXPIRES_IN` | Duración del token | `8h` |
| `CLOUDINARY_CLOUD_NAME` | Nombre de tu cloud en Cloudinary | `mi-cloud` |
| `CLOUDINARY_API_KEY` | API key de Cloudinary | `123456789` |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary | `abc...xyz` |
| `FRONTEND_URL` | URL del frontend para CORS | `http://localhost:5173` |
| `PORT` | Puerto del servidor | `3001` |
| `NODE_ENV` | Entorno | `development` |

> ⚠️ Usa la cadena del **Connection Pooler** (no la directa). La conexión directa usa IPv6 y falla en Codespaces con `ENETUNREACH`.

### `frontend/.env`

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:3001/api` |

---

## Uso en desarrollo

```bash
# Terminal 1 — Backend
cd greentrace-id/backend && npm run dev

# Terminal 2 — Frontend
cd greentrace-id/frontend && npm run dev

# Tests backend
cd greentrace-id/backend && npm test
```

---

## Rutas de la API

Base URL: `/api`

### Autenticación

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Registrar usuario (`nombre`, `correo`, `password`) | No |
| `POST` | `/auth/login` | Iniciar sesión | No |

> Solo se aceptan correos `@alumno.ipn.mx`.

### Árboles

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/arboles?page&limit` | Listar árboles (máx. 50) | Sí |
| `GET` | `/arboles/qr/:idUnico` | Obtener árbol por su ID único | Sí |
| `POST` | `/arboles` | Registrar árbol nuevo | Admin |

### Adopciones

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/adoptions` | Adoptar árbol `{ idUnico }` | Estudiante |
| `GET` | `/adoptions/me` | Mis adopciones | Sí |

### Reportes

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/reports` | Enviar reporte mensual (multipart) | Estudiante |

Campos: `id_adopcion`, `nivel_riego`, `coloracion_hojas`, `presencia_plagas`, `detalle_plagas`, `estado_general`, `observaciones`, `foto` (archivo).

### Dashboard

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/dashboard/:id` | Datos de impacto del árbol | Sí |
| `POST` | `/dashboard/:id/calcular` | Recalcular impacto ambiental | Admin |

---

## Vistas del frontend

| Ruta | Componente | Rol |
|---|---|---|
| `/login` | Login | Público |
| `/register` | Register | Público |
| `/home` | Home | Ambos |
| `/arboles/:id` | DetalleArbol | Ambos |
| `/dashboard/:id` | DashboardCO2 | Ambos |
| `/mapa` | MapaLeaflet | Ambos |
| `/escanear` | EscanerQR | Estudiante |
| `/adopciones/:id/reporte` | FormularioReporte | Estudiante |
| `/admin/arboles/nuevo` | RegistroArbol | Administrador |

---

## Roles y permisos

| Acción | Estudiante | Administrador |
|---|---|---|
| Escanear QR y adoptar árbol | ✅ | ❌ |
| Enviar reporte mensual | ✅ | ❌ |
| Ver Dashboard CO₂ | ✅ | ✅ |
| Ver Mapa de árboles | ✅ | ✅ |
| Registrar árbol nuevo | ❌ | ✅ |
| Panel de administración (Home) | ❌ | ✅ |

El JWT se mantiene **solo en memoria** (nunca en `localStorage` ni `sessionStorage`) para mitigar ataques XSS. Las rutas privadas están protegidas tanto en el cliente (PrivateRoute) como en el servidor (middleware JWT + RBAC).

---

## Arquitectura

```
┌─────────────────────┐        HTTPS        ┌──────────────────────┐
│   React 18 + Vite   │ ──────────────────▶ │  Express 4 + Node.js │
│   (Mobile-First)    │ ◀────────────────── │   Puerto 3001        │
└─────────────────────┘      JSON / JWT      └──────────┬───────────┘
                                                         │ Sequelize v6
                                                         ▼
                                              ┌──────────────────────┐
                                              │  PostgreSQL          │
                                              │  (Supabase Pooler)   │
                                              └──────────────────────┘
                                                         │
                                              ┌──────────┴───────────┐
                                              │  Cloudinary CDN      │
                                              │  (fotos reportes)    │
                                              └──────────────────────┘
```

**Decisiones de diseño relevantes:**
- **JWT en memoria** en el cliente: sin riesgo de XSS vía `localStorage`.
- **Pooler de Supabase** (IPv4): necesario en entornos sin IPv6 como Codespaces.
- **IndexedDB (cola offline)**: reportes se guardan localmente si no hay red y se sincronizan al reconectar.
- **SVG nativo** para gráficas: sin dependencias externas (recharts, chart.js), sin aumento de bundle.
- **CSS Modules** por componente: sin Tailwind, Bootstrap ni MUI.
- **EXIF validation** en cliente: la foto del reporte debe tener GPS y fecha ≤ 24 h para garantizar autenticidad.

---

## Autores

Equipo GreenTrace ID — Ingeniería de Software · ESCOM, Instituto Politécnico Nacional (2026)
