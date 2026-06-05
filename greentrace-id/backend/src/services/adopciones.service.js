'use strict';

/**
 * Servicio de adopciones (RF02).
 * Un estudiante escanea el QR de un árbol disponible y lo adopta. El árbol
 * cambia su estado a "Adoptado" dentro de una transacción ACID.
 */

const { sequelize, Arbol, Adopcion } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Plazo mensual estándar para entregar el reporte (en días).
const REPORT_DEADLINE_DAYS = 30;

/**
 * Adopta un árbol a partir de su id_unico (QR).
 * @param {{ idUsuario: number, idUnico: string }} params
 * @returns {Promise<object>} La adopción creada.
 */
async function adoptArbol({ idUsuario, idUnico }) {
  return sequelize.transaction(async (t) => {
    const arbol = await Arbol.findOne({
      where: { id_unico: idUnico },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!arbol) {
      throw new AppError('Árbol no encontrado.', 404);
    }

    // El estado "adoptado" se determina por la existencia de una adopción
    // activa (no eliminada) para ese árbol.
    const adopcionExistente = await Adopcion.findOne({
      where: { id_arbol: arbol.id_arbol, estado: 'ACTIVA' },
      transaction: t,
    });

    if (adopcionExistente) {
      throw new AppError('Este árbol ya ha sido adoptado.', 409);
    }

    const fechaCorte = new Date();
    fechaCorte.setDate(fechaCorte.getDate() + REPORT_DEADLINE_DAYS);

    const adopcion = await Adopcion.create(
      {
        id_usuario: idUsuario,
        id_arbol: arbol.id_arbol,
        fecha_adopcion: new Date(),
        fecha_corte: fechaCorte,
        estado: 'ACTIVA',
      },
      { transaction: t }
    );

    return adopcion;
  });
}

/**
 * Lista las adopciones activas de un usuario.
 * @param {number} idUsuario
 * @returns {Promise<object[]>}
 */
async function listAdopcionesByUsuario(idUsuario) {
  return Adopcion.findAll({
    where: { id_usuario: idUsuario },
    include: [{ model: Arbol }],
    order: [['fecha_adopcion', 'DESC']],
  });
}

module.exports = {
  adoptArbol,
  listAdopcionesByUsuario,
  REPORT_DEADLINE_DAYS,
};
