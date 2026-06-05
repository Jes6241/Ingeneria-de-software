'use strict';

/**
 * Rutas de autenticación (RF09).
 *   POST /api/auth/register
 *   POST /api/auth/login
 */

const { Router } = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');

const router = Router();

router.post(
  '/register',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
    body('correo')
      .isEmail()
      .withMessage('Correo inválido.')
      .bail()
      .custom((value) => value.toLowerCase().endsWith('@alumno.ipn.mx'))
      .withMessage('El correo debe ser del dominio @alumno.ipn.mx.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres.'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('correo').isEmail().withMessage('Correo inválido.'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  ],
  validate,
  authController.login
);

module.exports = router;
