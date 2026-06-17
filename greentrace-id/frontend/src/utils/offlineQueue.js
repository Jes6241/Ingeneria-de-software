/**
 * Cola offline mejorada sobre IndexedDB nativo (RNF03).
 * Guarda reportes pendientes cuando no hay conexión, con seguimiento de estado,
 * reintentos y mensajes de error para feedback del usuario.
 */

const DB_NAME = 'greentrace-offline';
const STORE = 'reportes-pendientes';
const DB_VERSION = 2; // Incrementado para migrar schema

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Guarda un reporte pendiente con estado PENDIENTE.
 * @param {Object} entry - { idAdopcion, blob, datos, fileName }
 * @returns {Promise<number>} id generado
 */
export async function guardarPendiente(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add({
      ...entry,
      estado: 'PENDIENTE',
      intentos: 0,
      errorMensaje: '',
      creado: Date.now(),
      ultimoIntento: null,
    });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Devuelve todos los reportes pendientes.
 * @returns {Promise<Array>} lista de reportes
 */
export async function listarPendientes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Obtiene un reporte pendiente específico.
 * @param {number} id
 * @returns {Promise<Object>} reporte o undefined
 */
export async function obtenerPendiente(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Actualiza el estado de un reporte pendiente.
 * @param {number} id
 * @param {string} nuevoEstado - PENDIENTE | SINCRONIZANDO | SINCRONIZADO | ERROR
 * @param {string} [errorMensaje] - Mensaje de error (si aplica)
 * @returns {Promise<void>}
 */
export async function actualizarEstado(id, nuevoEstado, errorMensaje = '') {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    const entry = await obtenerPendiente(id);
    if (!entry) {
      reject(new Error(`Reporte ${id} no encontrado`));
      return;
    }

    const actualizado = {
      ...entry,
      estado: nuevoEstado,
      ultimoIntento: Date.now(),
      errorMensaje,
    };

    if (nuevoEstado !== 'ERROR') {
      actualizado.intentos = entry.intentos + 1;
    }

    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put(actualizado);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Elimina un reporte pendiente por su id.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function eliminarPendiente(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Sincroniza todos los reportes pendientes con el backend.
 * Implementa retry logic (max 3 intentos por reporte).
 * @param {Function} sendFn - Función para enviar reporte: (formData) => Promise
 * @param {Function} onProgress - Callback para actualizar UI: (pendientes, sincronizado, errores) => void
 * @returns {Promise<{sincronizados: number, errores: number}>}
 */
export async function sincronizarTodos(sendFn, onProgress = () => {}) {
  const MAX_INTENTOS = 3;
  const pendientes = await listarPendientes();

  let sincronizados = 0;
  let errores = 0;
  const estadisticas = [];

  for (const entry of pendientes) {
    // Si ya tiene MAX_INTENTOS fallidos: marcar como ERROR permanente
    if (entry.intentos >= MAX_INTENTOS) {
      if (entry.estado !== 'ERROR') {
        await actualizarEstado(
          entry.id,
          'ERROR',
          'Máximo de intentos alcanzado (3/3)'
        );
        errores++;
      }
      continue;
    }

    try {
      // Marcar como SINCRONIZANDO
      await actualizarEstado(entry.id, 'SINCRONIZANDO');
      onProgress(pendientes.length, sincronizados, errores);

      // Recomprimir blob si es necesario (puede haberse degradado)
      const formData = new FormData();
      formData.append('foto', entry.blob, entry.fileName || 'photo.jpg');
      formData.append('id_adopcion', String(entry.idAdopcion));
      formData.append('nivel_riego', entry.datos.nivel_riego);
      formData.append('coloracion_hojas', entry.datos.coloracion_hojas);
      formData.append('presencia_plagas', entry.datos.presencia_plagas);
      formData.append('detalle_plagas', entry.datos.detalle_plagas || '');
      formData.append('severidad', entry.datos.severidad || 'baja');
      formData.append('estado_general', entry.datos.estado_general);
      formData.append('observaciones', entry.datos.observaciones || '');

      // Enviar al backend
      await sendFn(formData);

      // Si éxito: eliminar de IndexedDB
      await eliminarPendiente(entry.id);
      sincronizados++;
      estadisticas.push({ id: entry.id, resultado: 'éxito' });
    } catch (error) {
      // Si falla: guardar error + incrementar intentos
      const nuevoIntento = entry.intentos + 1;
      const msg =
        error.response?.data?.mensaje ||
        error.message ||
        'Error desconocido';

      if (nuevoIntento >= MAX_INTENTOS) {
        await actualizarEstado(entry.id, 'ERROR', msg);
      } else {
        await actualizarEstado(
          entry.id,
          'PENDIENTE',
          `${msg} (${nuevoIntento}/${MAX_INTENTOS})`
        );
      }

      errores++;
      estadisticas.push({
        id: entry.id,
        resultado: 'fallo',
        error: msg,
        intento: nuevoIntento,
      });
    }

    onProgress(pendientes.length, sincronizados, errores);
  }

  return { sincronizados, errores, estadisticas };
}

/**
 * Cuenta reportes en estado específico.
 * @param {string} estado - PENDIENTE | SINCRONIZANDO | ERROR
 * @returns {Promise<number>}
 */
export async function contarPorEstado(estado) {
  const todos = await listarPendientes();
  return todos.filter((entry) => entry.estado === estado).length;
}

/**
 * Limpia todos los reportes con estado ERROR.
 * @returns {Promise<number>} cantidad eliminada
 */
export async function limpiarErrores() {
  const todos = await listarPendientes();
  const conError = todos.filter((entry) => entry.estado === 'ERROR');

  for (const entry of conError) {
    await eliminarPendiente(entry.id);
  }

  return conError.length;
}
