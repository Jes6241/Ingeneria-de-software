'use strict';

/**
 * Rutas de adopciones (RF02).
 *   POST /api/adoptions      → adoptar árbol vía QR (Estudiante)
 *   GET  /api/adoptions/me   → adopciones del usuario autenticado
 */

const { Router } = require('express');
const { body } = require('express-validator');

const adopcionesController = require('../controllers/adopciones.controller');
const authenticate = require('../middlewares/auth');
const { authorize, ROLES } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(ROLES.ESTUDIANTE, ROLES.ADMINISTRADOR),
  [body('idUnico').trim().notEmpty().withMessage('idUnico es obligatorio.')],
  validate,
  adopcionesController.adopt
);

router.get('/me', authenticate, adopcionesController.listMine);

module.exports = router;
