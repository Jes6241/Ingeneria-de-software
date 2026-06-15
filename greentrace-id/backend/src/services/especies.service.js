'use strict';

/**
 * Servicio del catálogo de especies (RF10).
 * Lista las especies disponibles y permite al Administrador registrar nuevas.
 */

const { Especie } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Valores admitidos por los CHECK constraints de la tabla "especies".
const NECESIDAD_RIEGO = ['BAJA', 'MEDIA', 'ALTA'];
const EXPOSICION_SOLAR = ['SOMBRA', 'PARCIAL', 'PLENO_SOL'];

/**
 * Lista las especies del catálogo.
 * @param {{ soloActivas?: boolean }} [options]
 * @returns {Promise<object[]>}
 */
async function listEspecies({ soloActivas = false } = {}) {
  const where = soloActivas ? { activa: true } : undefined;
  return Especie.findAll({
    where,
    order: [['nombre_comun', 'ASC']],
  });
}

/**
 * Registra una nueva especie en el catálogo (solo Administrador).
 * @param {object} data
 * @returns {Promise<object>}
 */
async function createEspecie(data) {
  if (!data.nombre_comun || !data.nombre_comun.trim()) {
    throw new AppError('El nombre común es obligatorio.', 400);
  }

  const necesidadRiego = data.necesidad_riego || null;
  if (necesidadRiego && !NECESIDAD_RIEGO.includes(necesidadRiego)) {
    throw new AppError(
      `La necesidad de riego debe ser una de: ${NECESIDAD_RIEGO.join(', ')}.`,
      400
    );
  }

  const exposicionSolar = data.exposicion_solar || null;
  if (exposicionSolar && !EXPOSICION_SOLAR.includes(exposicionSolar)) {
    throw new AppError(
      `La exposición solar debe ser una de: ${EXPOSICION_SOLAR.join(', ')}.`,
      400
    );
  }

  const especie = await Especie.create({
    nombre_comun: data.nombre_comun.trim(),
    nombre_cientifico: data.nombre_cientifico
      ? data.nombre_cientifico.trim()
      : null,
    necesidad_riego: necesidadRiego,
    exposicion_solar: exposicionSolar,
    descripcion: data.descripcion || null,
    activa: true,
  });

  return especie;
}

module.exports = {
  listEspecies,
  createEspecie,
  NECESIDAD_RIEGO,
  EXPOSICION_SOLAR,
};
