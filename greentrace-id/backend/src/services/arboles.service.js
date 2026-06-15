'use strict';

/**
 * Servicio de árboles.
 * Incluye el registro de árboles (RF01) con generación de ID único y la
 * consulta paginada del lado del servidor (máx 50 registros — R14).
 */

const { randomUUID } = require('crypto');

const { Arbol, Especie } = require('../models');
const { AppError } = require('../middlewares/errorHandler');
const { calcularImpacto } = require('./co2.service');
const logger = require('../config/logger');

// Límite máximo de paginación del lado del servidor (R14 / convención).
const MAX_PAGE_SIZE = 50;

/**
 * Lista árboles con paginación server-side.
 * @param {{ page?: number, limit?: number }} options
 * @returns {Promise<{ data: object[], page: number, limit: number, total: number }>}
 */
async function listArboles({ page = 1, limit = MAX_PAGE_SIZE } = {}) {
  const safeLimit = Math.min(Number(limit) || MAX_PAGE_SIZE, MAX_PAGE_SIZE);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const { rows, count } = await Arbol.findAndCountAll({
    limit: safeLimit,
    offset,
    order: [['id_arbol', 'ASC']],
    include: [{ model: Especie }],
  });

  return { data: rows, page: safePage, limit: safeLimit, total: count };
}

/**
 * Registra un nuevo árbol y genera su identificador único para el QR (RF01).
 * @param {object} data - Datos del árbol.
 * @returns {Promise<object>}
 */
async function createArbol(data) {
  const idUnico = `GT-${randomUUID()}`;

  // Solo se persisten columnas que existen en la tabla "arboles".
  // El estado (Disponible/Adoptado) se deriva de la tabla "adopciones".
  const arbol = await Arbol.create({
    id_unico: idUnico,
    id_especie: data.id_especie || null,
    fecha_plantacion: data.fecha_plantacion || null,
    latitud: data.latitud || null,
    longitud: data.longitud || null,
    ubicacion_descripcion: data.ubicacion_descripcion || data.ubicacion || null,
    activo: true,
  });

  // Cálculo inicial del impacto ambiental (RF05). No debe bloquear el
  // registro del árbol si algo falla, por eso se aísla en try/catch.
  try {
    await calcularImpacto(arbol.id_arbol);
  } catch (error) {
    logger.warn(
      `No se pudo calcular el impacto inicial del árbol ${arbol.id_arbol}: ${error.message}`
    );
  }

  return arbol;
}

/**
 * Busca un árbol por su identificador único (escaneo de QR).
 * @param {string} idUnico
 * @returns {Promise<object>}
 */
async function getArbolByIdUnico(idUnico) {
  const arbol = await Arbol.findOne({
    where: { id_unico: idUnico },
    include: [{ model: Especie }],
  });

  if (!arbol) {
    throw new AppError('Árbol no encontrado.', 404);
  }

  return arbol;
}

module.exports = {
  listArboles,
  createArbol,
  getArbolByIdUnico,
  MAX_PAGE_SIZE,
};
