import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { setAuthToken } from '../services/api';

/**
 * Contexto de autenticación.
 *
 * El JWT se guarda ÚNICAMENTE en memoria (estado de React + variable de módulo
 * en services/api.js). Al recargar la página se pierde la sesión: es el
 * comportamiento esperado para mitigar XSS (nunca se usa localStorage).
 */
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  /**
   * Guarda la sesión en memoria.
   * @param {object} userData - { id_usuario, nombre, correo, rol }
   * @param {string} jwt - Token JWT emitido por el backend.
   */
  const login = useCallback((userData, jwt) => {
    setAuthToken(jwt);
    setToken(jwt);
    setUser(userData);
  }, []);

  /** Cierra la sesión y limpia el token en memoria. */
  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  /** @returns {boolean} true si hay una sesión activa. */
  const isAuthenticated = useCallback(() => Boolean(token), [token]);

  /**
   * @param {string} role - Rol requerido (ej. 'ADMINISTRADOR').
   * @returns {boolean} true si el usuario tiene ese rol.
   */
  const hasRole = useCallback((role) => user?.rol === role, [user]);

  const value = useMemo(
    () => ({ user, token, login, logout, isAuthenticated, hasRole }),
    [user, token, login, logout, isAuthenticated, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/** Hook de acceso al contexto de autenticación. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}
