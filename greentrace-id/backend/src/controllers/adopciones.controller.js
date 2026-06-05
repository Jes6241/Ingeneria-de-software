'use strict';

/**
 * Controlador de adopciones (RF02).
 */

const adopcionesService = require('../services/adopciones.service');

/**
 * POST /api/adoptions
 * @type {import('express').RequestHandler}
 */
async function adopt(req, res) {
  const { idUnico } = req.body;
  const adopcion = await adopcionesService.adoptArbol({
    idUsuario: req.user.id_usuario,
    idUnico,
  });
  res.status(201).json(adopcion);
}

/**
 * GET /api/adoptions/me
 * @type {import('express').RequestHandler}
 */
async function listMine(req, res) {
  const adopciones = await adopcionesService.listAdopcionesByUsuario(
    req.user.id_usuario
  );
  res.status(200).json(adopciones);
}

module.exports = { adopt, listMine };
