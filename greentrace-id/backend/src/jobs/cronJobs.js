'use strict';

/**
 * Tareas programadas del servidor (node-cron).
 *   - verificar_fechas_corte():  cada hora, recordatorio 48 h antes del corte (RF06)
 *   - verificar_inactividad():   cada hora, libera el árbol si hay +5 días de mora (RF07)
 */

const cron = require('node-cron');
const { Op } = require('sequelize');

const { sequelize, Adopcion, Notificacion } = require('../models');
const logger = require('../config/logger');

// Margen de aviso previo al corte (horas).
const REMINDER_HOURS_BEFORE = 48;
// Días de mora tras la fecha límite antes de liberar el árbol (RF07).
const GRACE_DAYS = 5;

/**
 * RF06 — Envía un recordatorio 48 h antes de la fecha de corte.
 */
async function verificar_fechas_corte() {
  const ahora = new Date();
  const limiteSuperior = new Date(ahora.getTime() + REMINDER_HOURS_BEFORE * 3600 * 1000);

  const proximas = await Adopcion.findAll({
    where: {
      estado: 'ACTIVA',
      fecha_corte: { [Op.between]: [ahora, limiteSuperior] },
    },
  });

  for (const adopcion of proximas) {
    await Notificacion.create({
      id_usuario: adopcion.id_usuario,
      id_adopcion: adopcion.id_adopcion,
      tipo: 'RECORDATORIO',
      mensaje:
        'Recordatorio: tu reporte mensual vence en menos de 48 horas. ' +
        'No olvides registrar la evidencia de tu árbol.',
      fecha_envio: new Date(),
      enviado: true,
      leido: false,
    });
  }

  if (proximas.length > 0) {
    logger.info(`RF06: ${proximas.length} recordatorio(s) de corte enviados.`);
  }
}

/**
 * RF07 — Libera los árboles cuyo adoptante lleva más de 5 días en mora.
 * Soft delete de la adopción + árbol vuelve a "Disponible para adopción".
 */
async function verificar_inactividad() {
  const limite = new Date(Date.now() - GRACE_DAYS * 24 * 3600 * 1000);

  const morosas = await Adopcion.findAll({
    where: {
      estado: 'ACTIVA',
      fecha_corte: { [Op.lt]: limite },
    },
  });

  for (const adopcion of morosas) {
    await sequelize.transaction(async (t) => {
      // El árbol vuelve a estar disponible al liberar la adopción; el estado
      // se deriva de la ausencia de adopciones activas, por lo que basta con
      // marcar la adopción como liberada y aplicar el soft delete.
      adopcion.estado = 'LIBERADA';
      await adopcion.save({ transaction: t });
      // Soft delete (paranoid): marca deleted_at.
      await adopcion.destroy({ transaction: t });

      await Notificacion.create(
        {
          id_usuario: adopcion.id_usuario,
          id_adopcion: adopcion.id_adopcion,
          tipo: 'LIBERACION',
          mensaje:
            'Tu árbol ha sido liberado por inactividad (más de 5 días sin reporte).',
          fecha_envio: new Date(),
          enviado: true,
          leido: false,
        },
        { transaction: t }
      );
    });
  }

  if (morosas.length > 0) {
    logger.info(`RF07: ${morosas.length} árbol(es) liberados por inactividad.`);
  }
}

/**
 * Registra los cron jobs. Se invoca una vez al iniciar el servidor.
 */
function startCronJobs() {
  // Cada hora en punto.
  cron.schedule('0 * * * *', async () => {
    try {
      await verificar_fechas_corte();
    } catch (error) {
      logger.error(`Error en verificar_fechas_corte: ${error.message}`);
    }
  });

  cron.schedule('0 * * * *', async () => {
    try {
      await verificar_inactividad();
    } catch (error) {
      logger.error(`Error en verificar_inactividad: ${error.message}`);
    }
  });

  logger.info('Cron jobs registrados (RF06 y RF07).');
}

module.exports = {
  startCronJobs,
  verificar_fechas_corte,
  verificar_inactividad,
  REMINDER_HOURS_BEFORE,
  GRACE_DAYS,
};
