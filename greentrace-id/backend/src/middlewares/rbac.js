'use strict';

/**
 * Middleware RBAC (Role-Based Access Control).
 * Restringe el acceso a rutas según el rol del usuario autenticado.
 * Debe usarse SIEMPRE después del middleware authenticate.
 */

// Roles soportados por el sistema.
const ROLES = Object.freeze({
  ADMINISTRADOR: 'ADMINISTRADOR',
  ESTUDIANTE: 'ESTUDIANTE',
});

/**
 * Crea un middleware que solo permite el acceso a los roles indicados.
 * @param {...string} allowedRoles - Roles autorizados.
 * @returns {import('express').RequestHandler}
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res
        .status(403)
        .json({ error: 'No tienes permisos para realizar esta acción.' });
    }

    return next();
  };
}

module.exports = { authorize, ROLES };
