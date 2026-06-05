'use strict';

/**
 * Controlador del dashboard de impacto (RF05).
 */

const dashboardService = require('../services/dashboard.service');
const co2Service = require('../services/co2.service');

/**
 * GET /api/dashboard/:id
 * @type {import('express').RequestHandler}
 */
async function getById(req, res) {
  const data = await dashboardService.getDashboard(Number(req.params.id));
  res.status(200).json(data);
}

/**
 * POST /api/dashboard/:id/calcular  (recalcula el impacto del árbol)
 * @type {import('express').RequestHandler}
 */
async function recalcular(req, res) {
  const impacto = await co2Service.calcularImpacto(Number(req.params.id));
  res.status(201).json(impacto);
}

module.exports = { getById, recalcular };
