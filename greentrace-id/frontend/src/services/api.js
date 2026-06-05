import axios from 'axios';

/**
 * Instancia centralizada de Axios.
 *
 * El JWT se mantiene EN MEMORIA (variable de módulo), nunca en localStorage ni
 * sessionStorage, para mitigar ataques XSS. El AuthContext registra el token
 * mediante setAuthToken al iniciar sesión y lo limpia al cerrar sesión.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token JWT en memoria (no persistente).
let authToken = null;

/**
 * Registra el token JWT que usará el interceptor de peticiones.
 * @param {string|null} token
 */
export function setAuthToken(token) {
  authToken = token;
}

/** Devuelve el token JWT actual en memoria. */
export function getAuthToken() {
  return authToken;
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de petición: adjunta el Bearer token si existe.
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Interceptor de respuesta: normaliza errores y maneja expiración de sesión.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Sesión inválida o expirada: limpia el token y redirige al login.
      authToken = null;
      if (onUnauthorized) onUnauthorized();
    }
    const message =
      error.response?.data?.error || 'Ocurrió un error de conexión.';
    const normalized = new Error(message);
    // Adjuntamos el código HTTP para que la UI distinga 404/409, etc.
    normalized.status = error.response?.status ?? null;
    return Promise.reject(normalized);
  }
);

// Callback opcional para cerrar la sesión global ante un 401.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/* =========================================================================
   APIs agrupadas por dominio.
   ========================================================================= */

export const authAPI = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
};

export const arbolesAPI = {
  listar: (params) => api.get('/arboles', { params }).then((r) => r.data),
  obtenerPorQR: (idUnico) =>
    api.get(`/arboles/qr/${idUnico}`).then((r) => r.data),
  crear: (payload) => api.post('/arboles', payload).then((r) => r.data),
};

export const adopcionesAPI = {
  adoptar: (idUnico) => api.post('/adoptions', { idUnico }).then((r) => r.data),
  misAdopciones: () => api.get('/adoptions/me').then((r) => r.data),
};

export const reportesAPI = {
  // formData: FormData con campo 'foto' y campos del reporte.
  enviar: (formData) =>
    api
      .post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
};

export const dashboardAPI = {
  obtener: (idArbol) => api.get(`/dashboard/${idArbol}`).then((r) => r.data),
  recalcular: (idArbol) =>
    api.post(`/dashboard/${idArbol}/calcular`).then((r) => r.data),
};

export default api;
