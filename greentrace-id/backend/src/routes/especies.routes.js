'use strict';

/**
 * Rutas del catálogo de especies (RF10).
 *   GET  /api/especies        → listado (autenticado)
 *   POST /api/especies        → registro (solo Administrador)
 */

const { Router } = require('express');
const { body } = require('express-validator');

const especiesController = require('../controllers/especies.controller');
const authenticate = require('../middlewares/auth');
const { authorize, ROLES } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');

const router = Router();

router.get('/', authenticate, especiesController.list);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRADOR),
  [
    body('nombre_comun')
      .trim()
      .notEmpty()
      .withMessage('El nombre común es obligatorio.'),
    body('nombre_cientifico').optional().isString(),
    body('necesidad_riego').optional().isString(),
    body('exposicion_solar').optional().isString(),
    body('descripcion').optional().isString(),
  ],
  validate,
  especiesController.create
);

module.exports = router;
