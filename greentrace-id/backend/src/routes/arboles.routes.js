'use strict';

/**
 * Rutas de árboles (RF01).
 *   GET  /api/arboles            → listado paginado (autenticado)
 *   GET  /api/arboles/qr/:idUnico → consulta por QR (autenticado)
 *   POST /api/arboles            → registro (solo Administrador)
 */

const { Router } = require('express');
const { body } = require('express-validator');

const arbolesController = require('../controllers/arboles.controller');
const authenticate = require('../middlewares/auth');
const { authorize, ROLES } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');

const router = Router();

router.get('/', authenticate, arbolesController.list);

router.get('/qr/:idUnico', authenticate, arbolesController.getByIdUnico);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMINISTRADOR),
  [
    body('id_especie').optional().isInt().withMessage('id_especie inválido.'),
    body('latitud').optional().isFloat().withMessage('latitud inválida.'),
    body('longitud').optional().isFloat().withMessage('longitud inválida.'),
  ],
  validate,
  arbolesController.create
);

module.exports = router;
