'use strict';

/**
 * Punto de entrada del backend de GreenTrace ID.
 * Configura Express, middlewares globales, rutas y arranca el servidor.
 */

require('dotenv').config();
require('express-async-errors'); // Captura errores en handlers async.

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const logger = require('./config/logger');
const { testConnection } = require('./config/database');
const { startCronJobs } = require('./jobs/cronJobs');

const authRoutes = require('./routes/auth.routes');
const arbolesRoutes = require('./routes/arboles.routes');
const adopcionesRoutes = require('./routes/adopciones.routes');
const reportesRoutes = require('./routes/reportes.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const especiesRoutes = require('./routes/especies.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');

const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

/* --------------------------- Middlewares globales ------------------------- */

// Lista de orígenes permitidos para CORS.
// Acepta localhost (dev) y cualquier puerto del subdominio de Codespaces.
const CODESPACES_ORIGIN_RE = /^https:\/\/[a-z0-9-]+-\d{4}\.app\.github\.dev$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // Peticiones sin origin (curl, mobile apps, etc.) → permitir.
      if (!origin) return callback(null, true);
      // Localhost (cualquier puerto).
      if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      // Subdominio de Codespaces (cualquier puerto).
      if (CODESPACES_ORIGIN_RE.test(origin)) return callback(null, true);
      // Origen explícito en variable de entorno.
      if (origin === process.env.FRONTEND_URL) return callback(null, true);
      callback(new Error(`Origen CORS no permitido: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging HTTP estructurado a través de winston.
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

/* -------------------------------- Rutas ----------------------------------- */

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'greentrace-id-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/arboles', arbolesRoutes);
app.use('/api/adoptions', adopcionesRoutes);
app.use('/api/reports', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/especies', especiesRoutes);
app.use('/api/notifications', notificacionesRoutes);

/* ----------------------- Manejo de errores (final) ------------------------ */

app.use(notFoundHandler);
app.use(errorHandler);

/* ------------------------------ Arranque ---------------------------------- */

const PORT = process.env.PORT || 3001;

/**
 * Inicializa la conexión a la BD, los cron jobs y levanta el servidor.
 * Se omite cuando el módulo se importa en pruebas (require directo de app).
 */
async function start() {
  try {
    await testConnection();
    startCronJobs();
    const server = app.listen(PORT, () => {
      logger.info(`Servidor escuchando en el puerto ${PORT}.`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Puerto ${PORT} en uso. Libéralo con: lsof -ti:${PORT} | xargs kill -9`);
      } else {
        logger.error(`Error del servidor: ${err.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error(`No se pudo iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
}

// Solo arranca si se ejecuta directamente (node src/app.js), no en tests.
if (require.main === module) {
  start();
}

module.exports = app;
