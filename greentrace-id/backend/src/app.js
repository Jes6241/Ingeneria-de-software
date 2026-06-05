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

const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

/* --------------------------- Middlewares globales ------------------------- */

// CORS: solo el origen del frontend (variable de entorno).
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
