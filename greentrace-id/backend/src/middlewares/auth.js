'use strict';

/**
 * Middleware de autenticación JWT.
 * Verifica el token Bearer, extrae el payload (id_usuario, rol) y lo adjunta
 * a req.user para los middlewares y controladores posteriores.
 */

const jwt = require('jsonwebtoken');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res
      .status(401)
      .json({ error: 'Token de autenticación ausente o malformado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Datos disponibles en req.user para RBAC y controladores.
    req.user = {
      id_usuario: payload.id_usuario,
      correo: payload.correo,
      rol: payload.rol,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = authenticate;
