'use strict';

/**
 * Middleware que recopila los resultados de express-validator y responde con
 * HTTP 400 si alguna regla de validación falló.
 */

const { validationResult } = require('express-validator');

/**
 * @type {import('express').RequestHandler}
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación.',
      detalles: errors.array().map((e) => ({
        campo: e.path,
        mensaje: e.msg,
      })),
    });
  }
  return next();
}

module.exports = validate;
