'use strict';

/**
 * Manejador central de errores.
 * Captura tanto los errores lanzados de forma síncrona como los de promesas
 * (gracias a express-async-errors) y produce una respuesta JSON consistente.
 */

const logger = require('../config/logger');

/**
 * Error de aplicación con código HTTP asociado.
 */
class AppError extends Error {
  /**
   * @param {string} message - Mensaje legible para el cliente.
   * @param {number} statusCode - Código HTTP (default 500).
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

/**
 * Middleware 404 para rutas no encontradas.
 * @type {import('express').RequestHandler}
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
}

/**
 * Middleware final de manejo de errores.
 * @type {import('express').ErrorRequestHandler}
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  // Errores de validación de Sequelize → 400.
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    logger.warn(`Validación BD: ${err.message}`);
    return res.status(400).json({
      error: 'Datos inválidos.',
      detalles: err.errors ? err.errors.map((e) => e.message) : undefined,
    });
  }

  // Errores de base de datos de Sequelize (columna inexistente, restricción FK, etc.)
  if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeForeignKeyConstraintError') {
    logger.error(`Error de BD: ${err.message}`);
    return res.status(500).json({ error: 'Error de base de datos. Por favor inténtalo de nuevo.' });
  }

  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`${statusCode} - ${err.message}`);
  }

  res.status(statusCode).json({
    error: err.isOperational ? err.message : 'Error interno del servidor.',
  });
}

module.exports = { AppError, notFoundHandler, errorHandler };
