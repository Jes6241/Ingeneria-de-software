'use strict';

const reportesService = require('../services/reportes.service');

async function listAll(req, res) {
  const { page, limit } = req.query;
  const result = await reportesService.listReportes({ page, limit });
  res.status(200).json(result);
}

async function create(req, res) {
  const { id_adopcion, nivel_riego, coloracion_hojas, presencia_plagas, detalle_plagas, estado_general, observaciones } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });
  const result = await reportesService.crearReporte({
    idUsuario: req.user.id_usuario,
    idAdopcion: Number(id_adopcion),
    datos: { nivel_riego, coloracion_hojas, presencia_plagas, detalle_plagas, estado_general, observaciones },
    imagenBuffer: req.file.buffer,
  });
  res.status(201).json(result);
}

async function approve(req, res) {
  const result = await reportesService.aprobarReporte({ idReporte: Number(req.params.id) });
  res.status(200).json(result);
}

module.exports = { create, listAll, approve };
