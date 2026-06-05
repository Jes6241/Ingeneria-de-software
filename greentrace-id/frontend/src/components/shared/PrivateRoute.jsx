import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';

/**
 * Ruta protegida. Renderiza el <Outlet /> anidado cuando el usuario está
 * autenticado y, si se indica requiredRole, cuando además tiene ese rol.
 * El backend valida igualmente con RBAC; esto es solo UX en el cliente.
 *
 * @param {{ requiredRole?: string }} props
 */
export default function PrivateRoute({ requiredRole }) {
  const { isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="container page" style={{ textAlign: 'center', paddingTop: 64 }}>
        <div style={{ fontSize: '3rem' }} aria-hidden="true">
          �
        </div>
        <h1>Acceso restringido</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
          Esta sección es solo para {requiredRole}.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/home')}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return <Outlet />;
}

PrivateRoute.propTypes = {
  requiredRole: PropTypes.string,
};
