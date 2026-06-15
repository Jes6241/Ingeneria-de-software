# Manual de Usuario — GreenTrace ID

**Versión 1.0 · ESCOM IPN Unidad Zacatenco**

---

## Tabla de contenidos

1. [Introducción](#1-introducción)
2. [Requisitos y acceso](#2-requisitos-y-acceso)
3. [Registro de cuenta](#3-registro-de-cuenta)
4. [Inicio de sesión y cierre de sesión](#4-inicio-de-sesión-y-cierre-de-sesión)
5. [Navegación general](#5-navegación-general)
6. [Módulo Estudiante](#6-módulo-estudiante)
   - 6.1 [Panel de inicio](#61-panel-de-inicio)
   - 6.2 [Escanear código QR y adoptar un árbol](#62-escanear-código-qr-y-adoptar-un-árbol)
   - 6.3 [Dashboard de mi árbol adoptado](#63-dashboard-de-mi-árbol-adoptado)
   - 6.4 [Enviar reporte mensual de salud](#64-enviar-reporte-mensual-de-salud)
   - 6.5 [Modo sin conexión (offline)](#65-modo-sin-conexión-offline)
7. [Módulo Administrador](#7-módulo-administrador)
   - 7.1 [Panel de inicio del administrador](#71-panel-de-inicio-del-administrador)
   - 7.2 [Registrar un nuevo árbol](#72-registrar-un-nuevo-árbol)
8. [Mapa de árboles](#8-mapa-de-árboles)
9. [Detalle de árbol](#9-detalle-de-árbol)
10. [Notificaciones](#10-notificaciones)
11. [Mensajes de error frecuentes](#11-mensajes-de-error-frecuentes)
12. [Preguntas frecuentes](#12-preguntas-frecuentes)

---

## 1. Introducción

**GreenTrace ID** es una plataforma de trazabilidad ambiental desarrollada para el campus ESCOM IPN Unidad Zacatenco. Su propósito es permitir a los estudiantes adoptar árboles del campus, realizar el seguimiento mensual de su salud y visualizar el impacto en captura de CO₂ a lo largo del tiempo.

### Roles de usuario

| Rol | Descripción |
|-----|-------------|
| **Estudiante** | Adopta árboles mediante escaneo de QR, envía reportes mensuales de salud y consulta el impacto ambiental de su árbol. |
| **Administrador** | Registra nuevos árboles en el sistema, genera sus códigos QR y tiene acceso de solo lectura a todos los dashboards. |

### Flujo general del sistema

```
ADMIN registra árbol → genera QR → imprime y coloca en el árbol físico
ESTUDIANTE escanea QR → adopta el árbol → envía reportes mensuales → visualiza impacto CO₂
```

---

## 2. Requisitos y acceso

### Dispositivos compatibles

- Teléfono o tablet con Android 8+ o iOS 14+
- Computadora de escritorio con Chrome 90+, Firefox 88+, Edge 90+ o Safari 14+

### Permisos necesarios

| Permiso | Para qué se usa |
|---------|----------------|
| **Cámara** | Escanear el código QR del árbol |
| **Ubicación (GPS)** | Validar que el estudiante está físicamente junto al árbol al adoptarlo y al enviar reportes fotográficos |

> **Importante:** Los permisos de cámara y GPS se solicitan en el momento que se necesitan. Sin ellos, no es posible adoptar árboles ni enviar reportes con validación de evidencia.

### URL de acceso

Abre tu navegador e ingresa la dirección que te proporcionó tu institución (por ejemplo, `http://localhost:5173` en entorno de desarrollo).

---

## 3. Registro de cuenta

Solo los estudiantes del IPN con correo institucional pueden registrarse.

### Pasos para registrarse

1. En la pantalla de inicio, toca o haz clic en **"¿No tienes cuenta? Regístrate"**.
2. Completa el formulario con los siguientes datos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre completo** | Tu nombre tal como aparece en tu credencial | `Ana García López` |
| **Boleta** | Número de boleta de 10 dígitos | `2021630001` |
| **Correo institucional** | Debe terminar en `@alumno.ipn.mx` | `agarcia@alumno.ipn.mx` |
| **Contraseña** | Mínimo 8 caracteres | `MiClave2024` |
| **Confirmar contraseña** | Debe ser idéntica a la contraseña | `MiClave2024` |
| **Términos de uso** | Marca la casilla para aceptar | ☑ |

3. Toca **"Crear cuenta"**.
4. Si el registro es exitoso, verás el mensaje **"¡Cuenta creada exitosamente! 🌱"** y serás redirigido automáticamente al panel de inicio.

### Errores comunes en el registro

| Mensaje | Causa | Solución |
|---------|-------|----------|
| "El nombre es obligatorio" | Campo vacío | Escribe tu nombre completo |
| "La boleta debe tener 10 dígitos" | Boleta incorrecta | Verifica que sean exactamente 10 números |
| "El correo debe terminar en @alumno.ipn.mx" | Correo no institucional | Usa tu correo `@alumno.ipn.mx` |
| "Mínimo 8 caracteres" | Contraseña muy corta | Usa al menos 8 caracteres |
| "Las contraseñas no coinciden" | Error de confirmación | Vuelve a escribir ambas contraseñas |
| "Debes aceptar los términos de uso" | Casilla sin marcar | Marca la casilla de términos |

---

## 4. Inicio de sesión y cierre de sesión

### Iniciar sesión

1. En la pantalla de inicio, ingresa:
   - **Correo institucional** (`usuario@alumno.ipn.mx`)
   - **Contraseña**
2. Toca el icono del ojo (👁) para mostrar u ocultar la contraseña si lo necesitas.
3. Toca **"Iniciar sesión"**.
4. Si las credenciales son correctas, verás **"¡Bienvenido, [tu nombre]!"** y serás dirigido al panel de inicio.

> **Nota de seguridad:** La sesión se guarda en memoria del navegador, no en almacenamiento local. Si cierras el navegador o la pestaña, tendrás que iniciar sesión de nuevo. Esto es intencional para proteger tu cuenta.

### Cerrar sesión

**En móvil:**
1. Toca el icono de menú (☰) en la esquina superior derecha.
2. En el menú lateral, toca **"Cerrar sesión"** (botón rojo al final).

**En escritorio:**
1. Haz clic en el círculo con tu inicial (avatar) en la esquina superior derecha.
2. En el menú desplegable, haz clic en **"Cerrar sesión"**.

---

## 5. Navegación general

### Barra de navegación

La barra de navegación superior siempre está visible y cambia según el rol:

**Estudiante:**

| Elemento | Destino |
|----------|---------|
| 🌳 GreenTrace ID (logo) | Página de inicio |
| Inicio | Panel del estudiante |
| Mapa | Mapa de árboles del campus |
| Escanear QR | Escáner de código QR |

**Administrador:**

| Elemento | Destino |
|----------|---------|
| 🌳 GreenTrace ID (logo) | Página de inicio |
| Inicio | Panel del administrador |
| Mapa | Mapa de árboles del campus |
| Registrar Árbol | Formulario de registro de árbol |

### Menú móvil

En dispositivos móviles, los enlaces de navegación se ocultan detrás del botón de menú (☰). Al tocarlo se abre un panel lateral que muestra:
- Tu nombre y correo
- Los enlaces de navegación según tu rol
- El botón de cierre de sesión

Toca la **✕** o cualquier zona fuera del panel para cerrarlo.

---

## 6. Módulo Estudiante

### 6.1 Panel de inicio

Al iniciar sesión como estudiante verás tu panel personal con:

**Estadísticas personales (tarjetas superiores):**

| Tarjeta | Qué muestra |
|---------|-------------|
| 🌳 Árboles adoptados | Cantidad de adopciones activas en este momento |
| 📸 Adopciones totales | Total histórico de árboles que has adoptado |
| 💨 kg CO₂ capturado | Carbono capturado acumulado (disponible próximamente) |

**Sección "Mis adopciones activas":**

- Si no tienes adopciones, verás un mensaje de bienvenida con un botón para escanear un QR.
- Si ya adoptaste árboles, cada árbol aparece como una tarjeta con:
  - El ID del árbol
  - Su estado actual (ACTIVA / EN MORA / LIBERADA)
  - Los días que lleva adoptado
  - Un botón **"Ver Dashboard"** para acceder al detalle del árbol

**Estados de adopción:**

| Estado | Color | Significado |
|--------|-------|-------------|
| ACTIVA | 🟢 Verde | Adopción vigente y al corriente con reportes |
| EN MORA | 🟠 Naranja | Tienes un reporte pendiente que no has enviado a tiempo |
| LIBERADA | ⚫ Gris | La adopción terminó (por inactividad o baja voluntaria) |

**Botón flotante (📷):**
En la esquina inferior derecha hay un botón circular que te lleva directamente al escáner QR para adoptar un nuevo árbol.

---

### 6.2 Escanear código QR y adoptar un árbol

Este proceso te permite vincular tu cuenta con un árbol físico del campus.

#### Antes de empezar

- Asegúrate de estar **físicamente junto al árbol** que quieres adoptar (la distancia máxima permitida es de 20 metros).
- Tu dispositivo debe tener **acceso a internet** y GPS activo.
- El árbol debe estar en estado **"Disponible"** (sin adoptante activo).

#### Pasos

1. Desde el panel de inicio, toca el botón flotante **📷** o el enlace **"Escanear QR"** en la barra de navegación.

2. El sistema solicitará permiso para acceder a tu **cámara** y a tu **ubicación GPS**. Acepta ambos permisos. Mientras la cámara se inicializa, verás el mensaje "Iniciando cámara…".

3. Cuando la cámara esté lista, aparece el visor de video con un recuadro guía. Apunta la cámara hacia el código QR del árbol.

4. El sistema detectará el QR automáticamente (sin necesidad de pulsar nada). Verás el mensaje **"✅ QR detectado"**.

5. El sistema verifica:
   - Que el árbol existe en el sistema
   - Que estás a 20 metros o menos del árbol
   - Que el árbol está disponible para adopción

6. Si todo es correcto, verás **"¡Árbol adoptado! 🌱"** y serás redirigido al dashboard de tu árbol.

#### Posibles problemas al escanear

| Mensaje | Causa | Solución |
|---------|-------|----------|
| "❌ Permiso de cámara denegado" | Bloqueaste el acceso a la cámara | Ve a la configuración de tu navegador y activa el permiso de cámara para este sitio |
| "Código QR no válido" | El QR escaneado no es un árbol de GreenTrace | Busca el código QR oficial pegado en el árbol |
| "📍 Estás demasiado lejos (Xm). Acércate a ≤20m." | Tu GPS indica que estás a más de 20 metros | Acércate más al árbol y vuelve a intentarlo |
| "Árbol no encontrado" | El QR no corresponde a ningún árbol registrado | Contacta al administrador |
| "⚠️ Geolocalización no disponible aún" | El GPS aún está calculando tu posición | Espera unos segundos a que el GPS se estabilice y vuelve a escanear |

#### Cancelar

Si deseas cancelar el proceso, toca el botón **"Cancelar"** en la parte inferior de la pantalla.

---

### 6.3 Dashboard de mi árbol adoptado

El dashboard muestra toda la información de tu árbol adoptado y su impacto ambiental.

**Para acceder:** En tu panel de inicio, toca **"Ver Dashboard"** en la tarjeta del árbol.

#### Cabecera del dashboard

Muestra el nombre de la especie del árbol, su ubicación en el campus y la fecha en que fue plantado.

#### Tarjetas de indicadores clave (KPIs)

| Indicador | Descripción |
|-----------|-------------|
| 💨 kg CO₂ capturado | Total de dióxido de carbono capturado por el árbol desde su plantación |
| 🌱 kg biomasa | Masa de materia orgánica estimada del árbol |
| 📅 Meses de edad | Tiempo transcurrido desde la fecha de plantación |
| 📸 Reportes | Número total de reportes de salud que has enviado |

> Los cálculos de CO₂ y biomasa usan ecuaciones alométricas basadas en la especie y la edad del árbol.

#### Gráfica de evolución de CO₂

Una gráfica de líneas que muestra cómo ha crecido la captura de CO₂ mes a mes. Requiere al menos 2 reportes para mostrar la evolución.

#### Galería de evidencias

Muestra miniaturas de todas las fotos que has enviado con tus reportes, ordenadas cronológicamente.
- Toca cualquier foto para verla en tamaño completo.
- Toca la **✕** o fuera de la imagen para cerrar.
- Si hay más de 9 fotos, toca **"Ver más"** para cargar las siguientes.

#### Historial de salud

Lista cronológica (más reciente primero) del estado general reportado en cada reporte:

| Estado | Color |
|--------|-------|
| Excelente | 🟢 Verde |
| Bueno | 🟢 Verde |
| Regular | 🟠 Naranja |
| Crítico | 🔴 Rojo |

#### Botón flotante "Enviar nuevo reporte" (📸)

Disponible solo si tienes una adopción activa de ese árbol. Te lleva al formulario de reporte mensual.

---

### 6.4 Enviar reporte mensual de salud

El reporte mensual es el mecanismo principal para documentar la salud de tu árbol. Debes enviarlo **una vez al mes**. Si no lo envías en los 5 días siguientes a la fecha límite, la adopción se libera automáticamente.

**Para acceder:** Desde el dashboard de tu árbol, toca el botón flotante **📸 "Enviar nuevo reporte"**.

#### Indicador de pasos

El formulario tiene 3 pasos que se muestran en la parte superior:

```
[1] Evidencia  →  [2] Datos  →  [3] Revisión
```

---

#### Paso 1: Evidencia fotográfica

**Objetivo:** Subir una foto actual del árbol que demuestre que lo visitaste físicamente.

1. Toca el área de carga (recuadro punteado con el texto "📁 Selecciona una imagen").
2. En móvil, se abrirá la cámara directamente para que tomes la foto en ese momento.
3. En computadora, se abrirá el explorador de archivos para seleccionar una imagen existente.

**Requisitos de la foto:**
- Formato: `.jpg` o `.png`
- Tamaño máximo antes de comprimir: 10 MB
- La foto **debe tener metadatos GPS** (EXIF): esto significa que debe ser tomada en ese momento con tu teléfono, no una foto guardada de internet o de otro lugar.
- La foto **no debe tener más de 24 horas de antigüedad**.
- La foto debe haber sido tomada a **20 metros o menos** del árbol.

**¿Qué pasa después de seleccionar la foto?**

El sistema comprime la imagen automáticamente (hasta 2 MB) preservando los metadatos. Luego valida los metadatos EXIF:

| Resultado | Significado |
|-----------|-------------|
| ✅ "Evidencia aprobada." | La foto cumple todos los requisitos |
| ❌ "No se encontraron datos GPS..." | La foto no tiene coordenadas GPS en sus metadatos |
| ❌ "La foto tiene más de 24 horas..." | La foto es demasiado antigua |
| ❌ "Estás a Xm del árbol..." | La foto fue tomada lejos del árbol |

Si la validación falla, toca **"📸 Tomar foto en tiempo real"** para abrir la cámara y tomar una nueva foto en ese instante.

5. Una vez que aparezca **"✅ Evidencia aprobada."**, toca **"Siguiente"**.

---

#### Paso 2: Datos del reporte

Registra el estado actual del árbol en los siguientes campos:

**Nivel de riego**

Selecciona cuánto agua ha recibido el árbol recientemente:

| Opción | Cuándo usarla |
|--------|---------------|
| 💧 Bajo | El suelo está seco, el árbol parece sediento |
| 💧💧 Medio | Condiciones normales |
| 💧💧💧 Alto | El árbol ha recibido riego abundante o hay humedad alta |

**Coloración de hojas**

Selecciona el color predominante de las hojas del árbol:

| Opción | Descripción |
|--------|-------------|
| Verde intenso | Color saludable y brillante |
| Verde pálido | Ligero amarillamiento, puede indicar falta de nutrientes |
| Amarillo | Hojas amarillas, posible estrés hídrico o enfermedad |
| Café | Hojas secas o quemadas |
| Sin hojas | El árbol está defoliado |

**Presencia de plagas**

Indica si observas insectos dañinos, hongos, manchas inusuales u otras anomalías:
- Toca **"No"** (opción por defecto) si el árbol se ve sano.
- Toca **"Sí"** si detectas algún problema.

Si seleccionas **"Sí"**, aparecerán dos campos adicionales:

- **Detalle de plagas:** Describe brevemente qué observas (ej. "Manchas negras en las hojas", "Insectos en el tronco").
- **Severidad:**
  - *Leve:* Afectación mínima, no compromete la salud general.
  - *Moderada:* Daño visible pero controlable.
  - *Severa:* El árbol necesita atención urgente. Al seleccionar esta opción, el sistema notificará automáticamente al administrador.

**Estado general**

Evaluación global del árbol en este momento:

| Estado | Cuándo usarlo |
|--------|---------------|
| Excelente | El árbol está perfectamente sano |
| Bueno | Buen estado con observaciones menores |
| Regular | Hay signos de deterioro pero no es crítico |
| Crítico | El árbol necesita intervención urgente |

**Observaciones (opcional)**

Escribe cualquier información adicional relevante (máx. 500 caracteres). Por ejemplo: "El árbol fue podado esta semana" o "Hay obras de construcción cercanas que generan polvo".

**Indicador de geolocalización**

En la parte inferior del paso 2 verás un pequeño indicador:
- ✅ "📍 Ubicación verificada" — Tu posición GPS está confirmada.
- ⚠️ "📍 Sin ubicación…" — El GPS no pudo obtenerse. El reporte puede enviarse igualmente, pero quedará pendiente de revisión manual.

Cuando termines, toca **"Siguiente"**.

---

#### Paso 3: Revisión y envío

Revisa un resumen completo del reporte antes de enviarlo:
- Vista previa de la foto seleccionada
- Resumen de todos los datos ingresados

Si algo está incorrecto, toca **"Atrás"** para corregirlo.

Si todo está correcto, toca **"Enviar reporte"**.

**Si tienes conexión a internet:**
- El reporte se sube con la foto a la nube.
- Verás el mensaje **"¡Reporte enviado correctamente! 🌱"**.
- Serás redirigido al panel de inicio.

**Si no tienes conexión (ver Sección 6.5):**
- El reporte se guarda localmente en tu dispositivo.
- Verás el mensaje **"📡 Sin conexión — el reporte se enviará al recuperar internet."**
- El reporte se enviará automáticamente cuando recuperes la conexión.

---

### 6.5 Modo sin conexión (offline)

GreenTrace ID puede guardar reportes aunque no tengas internet, y enviarlos automáticamente al reconectarte.

**¿Cuándo se activa?**

Cuando intentas enviar un reporte sin conexión a internet, el sistema detecta la situación y muestra la siguiente notificación en la parte superior del formulario:

> 📡 Sin conexión — el reporte se enviará cuando recuperes internet.

**¿Qué se guarda?**

La foto (comprimida) y todos los datos del formulario se guardan en el almacenamiento local del dispositivo (IndexedDB). El reporte no se pierde aunque cierres la aplicación.

**Sincronización automática**

Cuando el dispositivo recupera la conexión, el sistema intenta enviar automáticamente todos los reportes pendientes. No necesitas hacer nada.

**Sincronización manual**

Si deseas forzar el envío manualmente:
1. Abre el formulario de reporte de cualquier adopción.
2. En la parte superior, verás la sección **"📱 X reporte(s) en cola"**.
3. Toca el botón **"🔄 Sincronizar"**.

**Estados de los reportes en cola**

| Estado | Icono | Significado |
|--------|-------|-------------|
| Pendiente | ⏸️ | Esperando conexión |
| Sincronizando | ⏳ | En proceso de envío |
| Error | ❌ | Falló el intento (se reintentará, máx. 3 veces) |

> **Límite de reintentos:** Si un reporte falla 3 veces consecutivas, quedará en estado ERROR. Revisa tu conexión y vuelve a intentar la sincronización manual.

---

## 7. Módulo Administrador

### 7.1 Panel de inicio del administrador

El panel del administrador muestra métricas globales del sistema:

| Tarjeta | Descripción |
|---------|-------------|
| 🌳 Árboles registrados | Total de árboles en el sistema |
| 🤝 Árboles adoptados | Árboles con adoptante activo |
| 📋 Reportes recibidos | Total de reportes de salud recibidos |

**Accesos directos:**
- **"Registrar nuevo árbol"** → Formulario de registro
- **"Ver mapa de árboles"** → Mapa del campus
- **"Catálogo de especies"** → Próximamente disponible

---

### 7.2 Registrar un nuevo árbol

El proceso de registro genera el código QR único que se imprimirá y colocará en el árbol físico.

**Para acceder:** En la barra de navegación toca **"Registrar Árbol"**, o desde el panel de inicio toca el acceso directo.

El formulario está dividido en 4 secciones:

---

#### Sección 1: Identificación

| Campo | Descripción | Editable |
|-------|-------------|----------|
| ID único | Código UUID generado automáticamente con prefijo `GT-` | No (solo lectura) |
| ID de especie | Número identificador de la especie (opcional) | Sí |
| Fecha de plantación | Fecha en que se plantó el árbol en el campus | Sí (**obligatorio**) |

El botón **↻** junto al campo de ID único regenera un nuevo código si lo necesitas (solo disponible antes de guardar).

---

#### Sección 2: Datos físicos (opcionales)

| Campo | Descripción | Unidad |
|-------|-------------|--------|
| Altura | Altura actual del árbol | metros |
| DAP | Diámetro a la altura del pecho (1.3 m del suelo) | centímetros |
| Edad | Edad estimada del árbol | años |
| Estado de salud inicial | Condición general al registrarse | Bueno / Regular / Crítico |

---

#### Sección 3: Ubicación

1. **Latitud y Longitud:** Puedes ingresar las coordenadas manualmente o usar el botón **"📍 Usar mi ubicación actual"** para que el sistema capture automáticamente tu posición GPS. Esto es útil si estás junto al árbol en el momento del registro.

2. **Mapa interactivo:** Un mapa de Leaflet muestra la posición actual del marcador. Puedes:
   - **Tocar el mapa** en cualquier punto para mover el marcador a esa posición (los campos de latitud/longitud se actualizan automáticamente).
   - **Arrastrar el marcador** para ajustar la posición con mayor precisión.

3. **Descripción de ubicación:** Campo de texto libre para describir dónde está el árbol (ej. `ESCOM IPN — Patio central — zona de bancas`).

---

#### Sección 4: Código QR

Una vista previa del código QR se genera en tiempo real con el ID único del árbol. 

Para descargar el código QR:
1. Toca **"⬇️ Descargar QR"**.
2. Se descargará un archivo de imagen PNG con el nombre `qr-GT-[id].png`.

> **Paso importante después del registro:** Imprime el código QR en papel resistente al exterior (idealmente plastificado) y colócalo en el tronco del árbol o en un poste cercano en un lugar visible.

---

#### Guardar el árbol

1. Revisa que todos los campos obligatorios estén completos:
   - Fecha de plantación
   - Latitud y longitud

2. Toca **"Registrar árbol"**.

3. Si el registro es exitoso, verás una tarjeta de confirmación:
   > ✅ Árbol registrado  
   > ID único: GT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  
   > Imprime y coloca el QR descargado en el árbol físico.

4. Puedes tocar **"Ver en el mapa"** para confirmar que el árbol aparece en la posición correcta.

---

## 8. Mapa de árboles

El mapa muestra todos los árboles registrados en el campus con su estado actual.

**Para acceder:** Toca **"Mapa"** en la barra de navegación.

### Color de los marcadores

| Color | Estado | Significado |
|-------|--------|-------------|
| 🔵 Azul | Disponible | Sin adoptante, puedes adoptarlo |
| 🟢 Verde | Bueno | Árbol con adoptante activo y buena salud |
| 🟠 Naranja | Regular | Estado de salud moderado |
| 🔴 Rojo | Crítico | Requiere atención urgente |

### Interacción con el mapa

**Tocar un marcador:** Aparece un globo emergente (popup) con:
- Nombre de la especie (o ID del árbol)
- Estado actual del árbol
- Botón **"Ver árbol"** → Abre el detalle del árbol

**Botón 📍 (Mi ubicación):** Aparece en la esquina inferior izquierda. Tócalo para centrar el mapa en tu posición actual. Aparecerá un marcador verde con la etiqueta "Estás aquí".

### Panel de filtros

Toca el botón **"☰ Filtros"** en la esquina superior derecha para abrir el panel lateral:

- **Filtrar por estado:** Activa o desactiva cada estado para mostrar/ocultar los marcadores correspondientes. Los cambios se aplican en tiempo real.
- **Lista de árboles:** Debajo de los filtros aparece la lista de todos los árboles visibles. Toca cualquier nombre para ir directamente al detalle de ese árbol.

Toca **"✕ Filtros"** para cerrar el panel.

### Agrupación de marcadores

Cuando hay varios árboles muy cercanos entre sí, el mapa los agrupa en un solo marcador con un número. Al acercarte (aumentar el zoom) o al tocar el grupo, los marcadores individuales se separan.

---

## 9. Detalle de árbol

La página de detalle muestra información completa de cualquier árbol, independientemente de si lo tienes adoptado o no.

**Para acceder:**
- Desde el mapa: toca "Ver árbol" en el popup.
- Desde la lista de árboles en el mapa.

### Cabecera

Muestra el nombre de la especie y el estado del árbol (Disponible / Adoptado).

Si el árbol tiene fotos en su historial, la imagen más reciente aparece como cabecera visual.

### Pestañas de información

---

#### Pestaña "Información"

Muestra los datos principales del árbol:

| Campo | Descripción |
|-------|-------------|
| ID único | Código único del árbol. Botón 📋 para copiar al portapapeles |
| Especie | Nombre científico o común |
| Fecha de plantación | Cuándo fue plantado |
| Ubicación | Descripción textual de la ubicación |
| Coordenadas | Latitud y longitud |

**Mini mapa:** Si el árbol tiene coordenadas, aparece un mapa pequeño no interactivo mostrando la posición exacta del árbol en el campus.

**Botón de adopción (solo Estudiantes, solo si está Disponible):**
> 🌱 Adoptar este árbol

Al tocarlo, el sistema intenta crear la adopción directamente desde el detalle (sin necesidad de escanear el QR). Sin embargo, este método **no valida la distancia GPS**. Para la adopción con validación física completa, usa el escáner QR.

---

#### Pestaña "Historial"

Lista cronológica de todos los cambios de estado de salud del árbol, del más reciente al más antiguo.

Cada entrada muestra:
- El estado de salud reportado (con código de color)
- La fecha del reporte

Si hay más de 10 registros, aparece el botón **"Cargar más"** para ver los siguientes.

---

#### Pestaña "Impacto CO₂"

Muestra los indicadores ambientales del árbol:

| Métrica | Descripción |
|---------|-------------|
| Captura de CO₂ total | Kilogramos de CO₂ capturados desde la plantación |
| Biomasa | Masa orgánica estimada del árbol en kilogramos |

**Gráfica "Evolución mensual de CO₂":** Barras que muestran el crecimiento en captura de CO₂ a lo largo del tiempo. Requiere suficientes reportes históricos para desplegarse.

---

## 10. Notificaciones

GreenTrace ID envía notificaciones automáticas por correo electrónico para mantener el seguimiento de las adopciones:

### Tipos de notificaciones

| Tipo | Cuándo se envía | Destinatario |
|------|----------------|--------------|
| **Recordatorio de reporte** | 48 horas antes de la fecha límite mensual | Estudiante adoptante |
| **Liberación por inactividad** | Cuando la adopción se libera por no reportar en 5 días después del límite | Estudiante adoptante |
| **Alerta de plaga severa** | Cuando un reporte indica plaga con severidad "Severa" | Administrador |

### Fechas límite de reporte

El sistema asigna automáticamente una **fecha límite mensual** para el envío del reporte de salud. Si no recibes el recordatorio, revisa tu carpeta de spam.

### ¿Qué pasa si no envío mi reporte a tiempo?

1. **48 horas antes** del vencimiento: recibes un correo de recordatorio.
2. **Al vencerse** la fecha: tu adopción pasa a estado **EN MORA**.
3. **5 días después** del vencimiento sin reporte: tu adopción se libera automáticamente. El árbol vuelve a estar disponible para que otro estudiante lo adopte. Recibirás un correo notificándote.

> Tu historial de reportes anteriores se conserva siempre, aunque se libere la adopción.

---

## 11. Mensajes de error frecuentes

### Errores de autenticación

| Mensaje | Solución |
|---------|----------|
| "El correo debe terminar en @alumno.ipn.mx" | Usa únicamente tu correo institucional del IPN |
| "Credenciales inválidas" | Verifica que el correo y la contraseña sean correctos |
| "No autorizado" | Tu sesión expiró. Cierra sesión e inicia de nuevo |

### Errores del escáner QR

| Mensaje | Solución |
|---------|----------|
| "Permiso de cámara denegado" | Ve a la configuración de tu navegador → Permisos → Cámara → Permitir |
| "No se pudo acceder a la cámara" | Cierra otras apps que usen la cámara y vuelve a intentarlo |
| "Código QR no válido" | Asegúrate de estar apuntando al QR oficial del árbol |
| "Estás demasiado lejos" | Acércate físicamente al árbol (menos de 20 metros) |

### Errores en el reporte fotográfico

| Mensaje | Solución |
|---------|----------|
| "No se encontraron datos GPS en la foto" | Toma la foto en ese momento con tu teléfono. Asegúrate de que el GPS esté activo en la cámara |
| "La foto tiene más de 24 horas" | Toma una foto nueva en el momento del reporte |
| "Estás a Xm del árbol (máx. 20m)" | Toma la foto estando junto al árbol |
| "Solo se permiten imágenes (.jpg, .png)" | Selecciona un archivo de imagen válido |
| "Archivo muy grande (máx 10 MB)" | Selecciona una imagen más pequeña o toma una nueva foto |

### Errores de red

| Mensaje | Solución |
|---------|----------|
| "Sin conexión — el reporte se enviará al recuperar internet" | El reporte se guardó. Se enviará automáticamente al reconectarte |
| "Error al sincronizar" | Verifica tu conexión y toca "🔄 Sincronizar" de nuevo |

---

## 12. Preguntas frecuentes

**¿Puedo tener más de un árbol adoptado al mismo tiempo?**  
Sí. Puedes adoptar tantos árboles como estén disponibles en el campus. Cada uno tendrá su propio ciclo de reportes mensual.

**¿Puedo adoptar el mismo árbol que ya tiene otro adoptante?**  
No. Un árbol solo puede tener un adoptante activo a la vez. Si el árbol está en estado "Disponible" (sin adoptante), puedes adoptarlo.

**¿Qué pasa si tomo la foto del árbol desde mi galería en lugar de en ese momento?**  
El sistema rechazará la foto si no tiene metadatos GPS, si fue tomada hace más de 24 horas, o si las coordenadas GPS de la foto no corresponden a la ubicación del árbol. Siempre toma la foto en el momento del reporte, junto al árbol.

**¿Los datos de GPS de mis fotos son visibles para otros usuarios?**  
No. Las coordenadas exactas de las fotos no se exponen públicamente. El mapa muestra ubicaciones aproximadas para proteger la privacidad.

**¿Puedo registrarme con un correo que no sea @alumno.ipn.mx?**  
No. La plataforma está restringida a correos institucionales del IPN (`@alumno.ipn.mx`).

**¿Qué son las ecuaciones alométricas del CO₂?**  
Son fórmulas matemáticas que estiman la biomasa de un árbol basándose en su especie y edad. GreenTrace ID usa estas fórmulas para calcular cuánto CO₂ ha capturado el árbol a lo largo del tiempo: `Biomasa = a × (edad_meses)^b`, luego `CO₂ = Biomasa × 0.47 × 3.667`.

**¿Qué pasa con mis reportes si la adopción se libera?**  
Tu historial de reportes nunca se elimina. Puedes consultar el historial en la página de detalle del árbol aunque ya no seas el adoptante.

**¿Puedo usar la aplicación en computadora de escritorio?**  
Sí, la interfaz es completamente funcional en escritorio. Sin embargo, el escaneo de QR y el envío de reportes están optimizados para dispositivos móviles, ya que requieren cámara y GPS en tiempo real.

**¿Qué hago si el mapa no carga los árboles?**  
Verifica tu conexión a internet. Si el problema persiste, recarga la página. El mapa carga hasta 50 árboles en la vista inicial.

**¿Cuándo se actualiza el cálculo de CO₂?**  
El impacto se recalcula cada vez que accedes al dashboard de tu árbol, usando la fecha de plantación y las ecuaciones alométricas de la especie.

---

*Manual de Usuario — GreenTrace ID · ESCOM IPN Unidad Zacatenco*  
*Para soporte técnico, contacta al administrador del sistema.*
