'use strict';

/**
 * Controlador de árboles (RF01).
 */

const arbolesService = require('../services/arboles.service');

/**
 * GET /api/arboles?page=&limit=
 * @type {import('express').RequestHandler}
 */
async function list(req, res) {
  const { page, limit } = req.query;
  const result = await arbolesService.listArboles({ page, limit });
  res.status(200).json(result);
}

/**
 * POST /api/arboles  (solo Administrador)
 * @type {import('express').RequestHandler}
 */
async function create(req, res) {
  const arbol = await arbolesService.createArbol(req.body);
  res.status(201).json(arbol);
}

/**
 * GET /api/arboles/qr/:idUnico
 * @type {import('express').RequestHandler}
 */
async function getByIdUnico(req, res) {
  const arbol = await arbolesService.getArbolByIdUnico(req.params.idUnico);
  res.status(200).json(arbol);
}

module.exports = { list, create, getByIdUnico };
