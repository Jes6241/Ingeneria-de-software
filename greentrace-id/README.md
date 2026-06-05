# GreenTrace ID 🌳

> **Trazabilidad ambiental respaldada por código.**

Plataforma web de adopción y monitoreo digital de árboles reforestados en la
Escuela Superior de Cómputo (ESCOM) del IPN. Cada árbol tiene un identificador
único y un código QR físico vinculado a su perfil digital. Los adoptantes
registran reportes mensuales con evidencia fotográfica y el sistema calcula la
captura estimada de CO₂ mediante ecuaciones alométricas.

---

## Arquitectura — Three-Tier

| Capa | Tecnología | Carpeta |
|------|------------|---------|
| Presentación | React.js + Vite (Mobile-First) | `frontend/` |
| Lógica de negocio | Node.js + Express.js | `backend/` |
| Persistencia | PostgreSQL en **Supabase** + Cloudinary | (externa) |

> ⚠️ **La base de datos ya existe en Supabase.** Sequelize se usa **solo para
> consultas** (modelos con `timestamps: false`). **Nunca** se ejecuta `sync()`,
> `alter` ni `force`: el esquema no se modifica desde el código.

---

## Requisitos previos

- Node.js >= 18
- Cuenta de Supabase (cadena `DATABASE_URL`)
- Cuenta de Cloudinary (credenciales)

---

## Puesta en marcha

### Backend

```bash
cd backend
cp .env.example .env      # rellena las variables
npm install
npm run dev               # http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env      # rellena VITE_API_URL
npm install
npm run dev               # http://localhost:5173
```

### Pruebas (Jest)

```bash
cd backend && npm test
```

---

## Estructura del proyecto

```
greentrace-id/
├── frontend/   → React.js (Vite)
├── backend/    → Node.js + Express.js
├── .gitignore
└── README.md
```

---

## Modelos Sequelize ↔ Tablas Supabase

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

> Los nombres de columnas en los modelos reflejan el esquema documentado. Si la
> BD real difiere en algún campo, ajusta el `field:` del atributo correspondiente
> en `backend/src/models/`.

---

## Módulos de desarrollo

| Módulo | Descripción | Responsables |
|--------|-------------|--------------|
| H | Registro y Validación de Integridad | Brian, Axel |
| I | Dashboard CO₂ y Lógica de Biomasa | Diego, Marco |
| J | Evidencia y Seguimiento | Guadalupe, Jesús |
| K | Pruebas Unitarias, Integración y Seguridad | Brian, Diego, Axel |

---

## Convenciones

- Código en **inglés**; comentarios y UI en **español**.
- **Feature Branching** + Pull Request obligatorio para `main`.
- Force push a `main`: **prohibido**.
- Paginación siempre del lado del servidor (máx **50** registros).
- Soft delete con `deleted_at` en `adopciones` y `usuarios`.
