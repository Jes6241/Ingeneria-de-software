'use strict';

/**
 * Configuración del logger estructurado con Winston.
 * Niveles utilizados en el proyecto: INFO / WARNING (warn) / ERROR.
 * También se expone 'debug' para el logging SQL en desarrollo.
 */

const winston = require('winston');

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato legible: [2026-06-04 12:00:00] INFO: mensaje
const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `[${ts}] ${level.toUpperCase()}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
    // Persistencia de errores y eventos en archivos.
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
  exitOnError: false,
});

module.exports = logger;
