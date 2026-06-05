'use strict';

/**
 * Rutas del dashboard de impacto (RF05).
 *   GET  /api/dashboard/:id           → datos de impacto (solo lectura)
 *   POST /api/dashboard/:id/calcular   → recalcular CO₂ (solo Administrador)
 */

const { Router } = require('express');

const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middlewares/auth');
const { authorize, ROLES } = require('../middlewares/rbac');

const router = Router();

router.get('/:id', authenticate, dashboardController.getById);

router.post(
  '/:id/calcular',
  authenticate,
  authorize(ROLES.ADMINISTRADOR),
  dashboardController.recalcular
);

module.exports = router;
