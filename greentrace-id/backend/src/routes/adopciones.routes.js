'use strict';

const { Router } = require('express');
const { body } = require('express-validator');

const adopcionesController = require('../controllers/adopciones.controller');
const authenticate = require('../middlewares/auth');
const { authorize, ROLES } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');

const router = Router();

router.get('/admin', authenticate, authorize(ROLES.ADMINISTRADOR), adopcionesController.listAll);
router.delete('/admin/:id', authenticate, authorize(ROLES.ADMINISTRADOR), adopcionesController.unadoptAdmin);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ESTUDIANTE, ROLES.ADMINISTRADOR),
  [body('idUnico').trim().notEmpty().withMessage('idUnico es obligatorio.')],
  validate,
  adopcionesController.adopt
);

router.get('/me', authenticate, adopcionesController.listMine);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ESTUDIANTE, ROLES.ADMINISTRADOR),
  adopcionesController.unadopt
);

module.exports = router;
