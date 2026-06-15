'use strict';

/**
 * Servicio de cálculo de CO₂ (RF05).
 * Usa ecuaciones alométricas por especie y la edad del árbol (en meses) para
 * estimar la biomasa y, a partir de ella, los kg de CO₂ capturados.
 *
 *   Biomasa (kg)      = coef_a * (edad_meses)^coef_b
 *   Carbono (kg)      = Biomasa * fracción_carbono   (≈ 0.47)
 *   CO₂ (kg)          = Carbono * 3.667              (relación PM CO₂ / C)
 */

const { Arbol, EcuacionAlometrica, ImpactoAmbiental } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Relación entre el peso molecular del CO₂ (44) y el del carbono (12).
const CO2_TO_CARBON_RATIO = 3.667;
// Fracción de carbono por defecto si la especie no la define.
const DEFAULT_CARBON_FRACTION = 0.47;

/**
 * Calcula la edad del árbol en meses a partir de su fecha de plantación.
 * @param {Date|string|null} fechaPlantacion
 * @returns {number} Edad en meses (mínimo 1).
 */
function calcularEdadMeses(fechaPlantacion) {
  if (!fechaPlantacion) return 1;
  const inicio = new Date(fechaPlantacion);
  const meses =
    (Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(1, Math.round(meses));
}

/**
 * Calcula la biomasa y el CO₂ capturado de un árbol según su edad.
 * @param {number} edadMeses - Edad del árbol en meses.
 * @param {object|null} ecuacion - Ecuación alométrica de la especie.
 * @returns {{ biomasa: number, co2: number }}
 */
function computeCO2(edadMeses, ecuacion) {
  if (!edadMeses || edadMeses <= 0) {
    throw new AppError('La edad del árbol no es válida para el cálculo.', 422);
  }

  const a = ecuacion && ecuacion.coef_a != null ? Number(ecuacion.coef_a) : 0.0673;
  const b = ecuacion && ecuacion.coef_b != null ? Number(ecuacion.coef_b) : 2.5;

  const biomasa = a * edadMeses ** b;
  const carbono = biomasa * DEFAULT_CARBON_FRACTION;
  const co2 = carbono * CO2_TO_CARBON_RATIO;

  return {
    biomasa: Number(biomasa.toFixed(3)),
    co2: Number(co2.toFixed(3)),
  };
}

/**
 * Calcula y persiste el impacto ambiental de un árbol.
 * @param {number} idArbol
 * @returns {Promise<object>} El registro de impacto creado/actualizado.
 */
async function calcularImpacto(idArbol) {
  const arbol = await Arbol.findByPk(idArbol);
  if (!arbol) {
    throw new AppError('Árbol no encontrado.', 404);
  }

  let ecuacion = null;
  if (arbol.id_especie) {
    ecuacion = await EcuacionAlometrica.findOne({
      where: { id_especie: arbol.id_especie },
    });
  }

  const edadMeses = calcularEdadMeses(arbol.fecha_plantacion);
  const { biomasa, co2 } = computeCO2(edadMeses, ecuacion);

  const valores = {
    id_arbol: idArbol,
    captura_co2_kg: co2,
    biomasa_kg: biomasa,
    edad_calc_meses: edadMeses,
    id_ecuacion_usada: ecuacion ? ecuacion.id_ecuacion : null,
    fecha_calculo: new Date(),
  };

  // Idempotente: cada árbol tiene un único registro de impacto (hasOne).
  // Si ya existe, se actualiza; si no, se crea.
  const existente = await ImpactoAmbiental.findOne({
    where: { id_arbol: idArbol },
  });

  if (existente) {
    await existente.update(valores);
    return existente;
  }

  return ImpactoAmbiental.create(valores);
}

module.exports = {
  computeCO2,
  calcularEdadMeses,
  calcularImpacto,
  CO2_TO_CARBON_RATIO,
  DEFAULT_CARBON_FRACTION,
};
