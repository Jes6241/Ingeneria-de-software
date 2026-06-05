'use strict';

/**
 * Servicio del dashboard de impacto (RF05).
 * SOLO LECTURA: agrega datos de evolución, galería histórica y captura de CO₂.
 */

const {
  Arbol,
  Especie,
  Adopcion,
  Reporte,
  EvidenciaFotografica,
  ImpactoAmbiental,
  HistorialEstado,
} = require('../models');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Obtiene los datos consolidados del dashboard de un árbol.
 * @param {number} idArbol
 * @returns {Promise<object>}
 */
async function getDashboard(idArbol) {
  const arbol = await Arbol.findByPk(idArbol, {
    include: [
      { model: Especie },
      { model: ImpactoAmbiental },
      { model: HistorialEstado },
    ],
  });

  if (!arbol) {
    throw new AppError('Árbol no encontrado.', 404);
  }

  // Reportes y evidencias a través de las adopciones del árbol.
  const adopciones = await Adopcion.findAll({
    where: { id_arbol: idArbol },
    include: [
      {
        model: Reporte,
        include: [{ model: EvidenciaFotografica }],
      },
    ],
    order: [['fecha_adopcion', 'DESC']],
  });

  const reportes = adopciones.flatMap((a) => a.Reportes || []);
  const galeria = reportes
    .flatMap((r) => r.EvidenciaFotograficas || [])
    .map((e) => ({
      url: e.url_imagen,
      fecha: e.fecha_subida,
    }));

  const evolucionSalud = (arbol.HistorialEstados || [])
    .map((h) => ({
      estado: h.estado_salud,
      fecha: h.fecha_actualizacion,
    }))
    .sort((x, y) => new Date(x.fecha) - new Date(y.fecha));

  return {
    arbol: {
      id_arbol: arbol.id_arbol,
      id_unico: arbol.id_unico,
      especie: arbol.Especie ? arbol.Especie.nombre_comun : null,
      latitud: arbol.latitud,
      longitud: arbol.longitud,
      ubicacion: arbol.ubicacion_descripcion,
      fecha_plantacion: arbol.fecha_plantacion,
    },
    impacto: arbol.ImpactoAmbiental
      ? {
          captura_co2: arbol.ImpactoAmbiental.captura_co2_kg,
          biomasa: arbol.ImpactoAmbiental.biomasa_kg,
          edad_meses: arbol.ImpactoAmbiental.edad_calc_meses,
          fecha_calculo: arbol.ImpactoAmbiental.fecha_calculo,
        }
      : null,
    total_reportes: reportes.length,
    galeria,
    evolucion_salud: evolucionSalud,
  };
}

module.exports = { getDashboard };
