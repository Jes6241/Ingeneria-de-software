'use strict';

/**
 * Controlador de reportes mensuales (RF03/RF04).
 */

const reportesService = require('../services/reportes.service');

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

module.exports = { create };
