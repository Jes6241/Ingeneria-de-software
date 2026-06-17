'use strict';

/**
 * Servicio de adopciones (RF02).
 * Un estudiante escanea el QR de un árbol disponible y lo adopta. El árbol
 * cambia su estado a "Adoptado" dentro de una transacción ACID.
 */

const { sequelize, Arbol, Adopcion, Usuario, Especie, Reporte } = require('../models');
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

/**
 * Desadopta un árbol — libera la adopción activa del usuario de forma voluntaria.
 * La adopción se marca como LIBERADA y se aplica soft delete.
 * @param {{ idUsuario: number, idAdopcion: number }} params
 */
async function unadoptArbol({ idUsuario, idAdopcion }) {
  return sequelize.transaction(async (t) => {
    const adopcion = await Adopcion.findOne({
      where: { id_adopcion: idAdopcion, id_usuario: idUsuario, estado: 'ACTIVA' },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!adopcion) {
      throw new AppError('Adopción no encontrada o no te pertenece.', 404);
    }

    adopcion.estado = 'LIBERADA';
    await adopcion.save({ transaction: t });
    await adopcion.destroy({ transaction: t });

    return { mensaje: 'Árbol desadoptado correctamente.' };
  });
}

/**
 * Lista todas las adopciones activas con info del usuario, árbol y conteo de reportes (solo admin).
 * @returns {Promise<object[]>}
 */
async function listAllAdopciones() {
  const adopciones = await Adopcion.findAll({
    where: { estado: 'ACTIVA' },
    include: [
      { model: Usuario, attributes: ['id_usuario', 'nombre', 'correo'] },
      { model: Arbol, include: [{ model: Especie, attributes: ['nombre_comun'] }] },
    ],
    order: [['fecha_adopcion', 'DESC']],
  });

  return Promise.all(
    adopciones.map(async (a) => {
      const json = a.toJSON();
      json.num_reportes = await Reporte.count({ where: { id_adopcion: a.id_adopcion } });
      return json;
    })
  );
}

/**
 * Libera cualquier adopción activa — acción de administrador sin verificar propietario.
 * @param {{ idAdopcion: number }} params
 */
async function unadoptArbolAdmin({ idAdopcion }) {
  return sequelize.transaction(async (t) => {
    const adopcion = await Adopcion.findOne({
      where: { id_adopcion: idAdopcion, estado: 'ACTIVA' },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!adopcion) throw new AppError('Adopción no encontrada o ya no está activa.', 404);
    adopcion.estado = 'LIBERADA';
    await adopcion.save({ transaction: t });
    await adopcion.destroy({ transaction: t });
    return { mensaje: 'Árbol liberado correctamente.' };
  });
}

module.exports = {
  adoptArbol,
  unadoptArbol,
  unadoptArbolAdmin,
  listAdopcionesByUsuario,
  listAllAdopciones,
  REPORT_DEADLINE_DAYS,
};
