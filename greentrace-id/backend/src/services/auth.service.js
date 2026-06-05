'use strict';

/**
 * Servicio de autenticación.
 * Lógica de negocio del registro y login, separada del controlador.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { Usuario, Rol } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Solo se permite el dominio institucional (RF09).
const ALLOWED_EMAIL_DOMAIN = '@alumno.ipn.mx';
const SALT_ROUNDS = 10;

/**
 * Valida que el correo pertenezca al dominio @alumno.ipn.mx.
 * @param {string} correo
 * @returns {boolean}
 */
function isInstitutionalEmail(correo) {
  return typeof correo === 'string' && correo.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}

/**
 * Genera un JWT firmado con el payload del usuario.
 * @param {{ id_usuario: number, correo: string, rol: string }} payload
 * @returns {string}
 */
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

/**
 * Registra un nuevo usuario adoptante.
 * @param {{ nombre: string, correo: string, password: string }} data
 * @returns {Promise<{ usuario: object, token: string }>}
 */
async function register({ nombre, correo, password }) {
  if (!isInstitutionalEmail(correo)) {
    throw new AppError(
      'El correo debe pertenecer al dominio @alumno.ipn.mx',
      400
    );
  }

  const existing = await Usuario.findOne({ where: { correo } });
  if (existing) {
    throw new AppError('El correo ya está registrado.', 409);
  }

  // Rol por defecto: ESTUDIANTE.
  const rolEstudiante = await Rol.findOne({ where: { nombre_rol: 'ESTUDIANTE' } });

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const usuario = await Usuario.create({
    nombre,
    correo,
    password_hash: hashedPassword,
    id_rol: rolEstudiante ? rolEstudiante.id_rol : null,
    fecha_registro: new Date(),
    activo: true,
  });

  const rolNombre = rolEstudiante ? rolEstudiante.nombre_rol : 'ESTUDIANTE';
  const token = generateToken({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    rol: rolNombre,
  });

  return {
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: rolNombre,
    },
    token,
  };
}

/**
 * Autentica a un usuario y devuelve un JWT.
 * @param {{ correo: string, password: string }} data
 * @returns {Promise<{ usuario: object, token: string }>}
 */
async function login({ correo, password }) {
  // Scope withPassword: incluye el hash para comparar.
  const usuario = await Usuario.scope('withPassword').findOne({
    where: { correo },
    include: [{ model: Rol }],
  });

  if (!usuario) {
    throw new AppError('Credenciales incorrectas.', 401);
  }

  const passwordMatch = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordMatch) {
    throw new AppError('Credenciales incorrectas.', 401);
  }

  const rolNombre = usuario.Rol ? usuario.Rol.nombre_rol : 'ESTUDIANTE';
  const token = generateToken({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    rol: rolNombre,
  });

  return {
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: rolNombre,
    },
    token,
  };
}

module.exports = {
  register,
  login,
  generateToken,
  isInstitutionalEmail,
  ALLOWED_EMAIL_DOMAIN,
};
