'use strict';

/**
 * Servicio de notificaciones (RF06/RF07).
 * Las notificaciones las generan los cron jobs; aquí se exponen para que el
 * usuario las consulte y marque como leídas.
 */

const { Notificacion } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Lista las notificaciones de un usuario (más recientes primero).
 * @param {number} idUsuario
 * @returns {Promise<object[]>}
 */
async function listByUsuario(idUsuario) {
  return Notificacion.findAll({
    where: { id_usuario: idUsuario },
    order: [['fecha_envio', 'DESC']],
  });
}

/**
 * Cuenta las notificaciones no leídas de un usuario.
 * @param {number} idUsuario
 * @returns {Promise<number>}
 */
async function contarNoLeidas(idUsuario) {
  return Notificacion.count({
    where: { id_usuario: idUsuario, leido: false },
  });
}

/**
 * Marca una notificación como leída (validando la propiedad del usuario).
 * @param {number} idNotificacion
 * @param {number} idUsuario
 * @returns {Promise<object>}
 */
async function marcarLeida(idNotificacion, idUsuario) {
  const notificacion = await Notificacion.findOne({
    where: { id_notificacion: idNotificacion, id_usuario: idUsuario },
  });

  if (!notificacion) {
    throw new AppError('Notificación no encontrada.', 404);
  }

  notificacion.leido = true;
  await notificacion.save();
  return notificacion;
}

/**
 * Marca todas las notificaciones de un usuario como leídas.
 * @param {number} idUsuario
 * @returns {Promise<{ actualizadas: number }>}
 */
async function marcarTodasLeidas(idUsuario) {
  const [actualizadas] = await Notificacion.update(
    { leido: true },
    { where: { id_usuario: idUsuario, leido: false } }
  );
  return { actualizadas };
}

module.exports = {
  listByUsuario,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
};
