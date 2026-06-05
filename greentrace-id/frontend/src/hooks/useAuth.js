import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook de acceso al contexto de autenticación.
 * @returns {{
 *   user: object|null,
 *   token: string|null,
 *   login: (userData: object, token: string) => void,
 *   logout: () => void,
 *   isAuthenticated: () => boolean,
 *   hasRole: (role: string) => boolean
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return context;
}
