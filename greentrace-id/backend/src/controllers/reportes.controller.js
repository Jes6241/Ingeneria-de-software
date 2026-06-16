'use strict';

/**
 * Controlador de reportes mensuales (RF03/RF04).
 */

const reportesService = require('../services/reportes.service');

/**
 * GET /api/reports/admin
 * Lista todos los reportes — solo ADMINISTRADOR.
 * @type {import('express').RequestHandler}
 */
async function listAll(req, res) {
  const { page, limit } = req.query;
  const result = await reportesService.listReportes({ page, limit });
  res.status(200).json(result);
}

/**
 * POST /api/reports
 * Recibe multipart/form-data con el campo de archivo 'foto'.
 * @type {import('express').RequestHandler}
 */
async function create(req, res) {
  const {
    id_adopcion,
    nivel_riego,
    coloracion_hojas,
    presencia_plagas,
    detalle_plagas,
    estado_general,
    observaciones,
  } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });
  }

  const result = await reportesService.crearReporte({
    idUsuario: req.user.id_usuario,
    idAdopcion: Number(id_adopcion),
    datos: {
      nivel_riego,
      coloracion_hojas,
      presencia_plagas,
      detalle_plagas,
      estado_general,
      observaciones,
    },
    imagenBuffer: req.file.buffer,
  });

  res.status(201).json(result);
}

module.exports = { create, listAll };
