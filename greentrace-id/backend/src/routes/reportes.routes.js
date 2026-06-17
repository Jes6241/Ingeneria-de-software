'use strict';

/**
 * Rutas de reportes mensuales (RF03/RF04).
 *   POST /api/reports  → multipart/form-data, campo de archivo 'foto'
 *
 * Pipeline de carga (3 etapas): magic bytes → compresión en Cloudinary → 413.
 */

const { Router } = require('express');
const { body } = require('express-validator');

const reportesController = require('../controllers/reportes.controller');
const authenticate = require('../middlewares/auth');
const { authorize, ROLES } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const {
  upload,
  validateMagicBytes,
  handleUploadErrors,
} = require('../middlewares/upload');

const router = Router();

router.get('/admin', authenticate, authorize(ROLES.ADMINISTRADOR), reportesController.listAll);
router.patch('/:id/approve', authenticate, authorize(ROLES.ADMINISTRADOR), reportesController.approve);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ESTUDIANTE, ROLES.ADMINISTRADOR),
  upload.single('foto'),
  handleUploadErrors,
  validateMagicBytes,
  [
    body('id_adopcion').isInt().withMessage('id_adopcion es obligatorio.'),
    body('nivel_riego').optional().isString(),
    body('estado_salud').optional().isString(),
    body('observaciones').optional().isString(),
  ],
  validate,
  reportesController.create
);

module.exports = router;
