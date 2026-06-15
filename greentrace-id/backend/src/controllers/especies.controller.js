'use strict';

/**
 * Controlador del catálogo de especies (RF10).
 */

const especiesService = require('../services/especies.service');

/**
 * GET /api/especies
 * @type {import('express').RequestHandler}
 */
async function list(req, res) {
  const soloActivas = req.query.activas === 'true';
  const especies = await especiesService.listEspecies({ soloActivas });
  res.status(200).json(especies);
}

/**
 * POST /api/especies  (solo Administrador)
 * @type {import('express').RequestHandler}
 */
async function create(req, res) {
  const especie = await especiesService.createEspecie(req.body);
  res.status(201).json(especie);
}

module.exports = { list, create };
