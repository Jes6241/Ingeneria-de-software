'use strict';

/**
 * Controlador de autenticación (RF09).
 * Delega la lógica de negocio en auth.service.
 */

const authService = require('../services/auth.service');

/**
 * POST /api/auth/register
 * @type {import('express').RequestHandler}
 */
async function register(req, res) {
  const { nombre, correo, password } = req.body;
  const result = await authService.register({ nombre, correo, password });
  res.status(201).json(result);
}

/**
 * POST /api/auth/login
 * @type {import('express').RequestHandler}
 */
async function login(req, res) {
  const { correo, password } = req.body;
  const result = await authService.login({ correo, password });
  res.status(200).json(result);
}

module.exports = { register, login };
