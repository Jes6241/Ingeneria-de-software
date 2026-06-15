'use strict';

/**
 * Controlador de notificaciones (RF06/RF07).
 */

const notificacionesService = require('../services/notificaciones.service');

/**
 * GET /api/notifications/me
 * Devuelve las notificaciones del usuario y el conteo de no leídas.
 * @type {import('express').RequestHandler}
 */
async function listMine(req, res) {
  const idUsuario = req.user.id_usuario;
  const [notificaciones, noLeidas] = await Promise.all([
    notificacionesService.listByUsuario(idUsuario),
    notificacionesService.contarNoLeidas(idUsuario),
  ]);
  res.status(200).json({ notificaciones, no_leidas: noLeidas });
}

/**
 * PATCH /api/notifications/:id/read
 * @type {import('express').RequestHandler}
 */
async function markRead(req, res) {
  const notificacion = await notificacionesService.marcarLeida(
    Number(req.params.id),
    req.user.id_usuario
  );
  res.status(200).json(notificacion);
}

/**
 * PATCH /api/notifications/read-all
 * @type {import('express').RequestHandler}
 */
async function markAllRead(req, res) {
  const result = await notificacionesService.marcarTodasLeidas(
    req.user.id_usuario
  );
  res.status(200).json(result);
}

module.exports = { listMine, markRead, markAllRead };
