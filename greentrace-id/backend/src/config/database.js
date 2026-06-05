'use strict';

/**
 * Conexión Sequelize a la base de datos PostgreSQL alojada en Supabase.
 *
 * IMPORTANTE: La base de datos YA EXISTE. Este módulo SOLO establece la
 * conexión para ejecutar consultas. Nunca se invoca sequelize.sync(),
 * ni se usa { alter } o { force }. El esquema no se modifica desde el código.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const logger = require('./logger');

if (!process.env.DATABASE_URL) {
  // Falla rápido si falta la cadena de conexión.
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

// La conexión DIRECTA de Supabase (db.<ref>.supabase.co) solo resuelve por
// IPv6. Muchos entornos (GitHub Codespaces / devcontainers) no tienen salida
// IPv6, lo que produce ENETUNREACH. En esos casos usa la cadena del
// "Connection Pooler" (host *.pooler.supabase.com), que sí ofrece IPv4 y es
// gratuita en todos los planes.
const USING_DIRECT_CONNECTION = /db\.[a-z0-9]+\.supabase\.co/i.test(
  process.env.DATABASE_URL
);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  // Registra las consultas SQL solo en desarrollo.
  logging:
    process.env.NODE_ENV === 'development'
      ? (msg) => logger.debug(msg)
      : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    // Las tablas existentes NO usan columnas createdAt/updatedAt automáticas.
    timestamps: false,
    freezeTableName: true,
  },
});

/**
 * Verifica la conexión sin alterar el esquema.
 * @returns {Promise<void>}
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a Supabase (PostgreSQL) establecida correctamente.');
  } catch (error) {
    logger.error(`No se pudo conectar a la base de datos: ${error.message}`);

    // Diagnóstico específico del problema IPv6 con la conexión directa.
    if (error.message.includes('ENETUNREACH') && USING_DIRECT_CONNECTION) {
      logger.error(
        'Estás usando la conexión DIRECTA de Supabase, que solo soporta IPv6 ' +
          'y este entorno no tiene salida IPv6. Cambia DATABASE_URL por la ' +
          'cadena del Connection Pooler (host *.pooler.supabase.com, ' +
          'puerto 6543). Es gratuita y resuelve por IPv4.'
      );
    }

    throw error;
  }
}

module.exports = { sequelize, testConnection };
