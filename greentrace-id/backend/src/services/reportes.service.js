'use strict';

/**
 * Servicio de reportes mensuales (RF03).
 * Orquesta: validación EXIF → subida a Cloudinary → persistencia del reporte y
 * su evidencia fotográfica dentro de una transacción ACID.
 */

const { randomUUID } = require('crypto');

const {
  sequelize,
  Reporte,
  EvidenciaFotografica,
  Adopcion,
  Arbol,
} = require('../models');
const { uploadImage } = require('../config/cloudinary');
const { validateExif } = require('./exif.service');
const { calcularImpacto } = require('./co2.service');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../config/logger');

// Carpeta destino en Cloudinary.
const CLOUDINARY_FOLDER = 'greentrace/evidencias';

/**
 * Crea un reporte mensual con su evidencia fotográfica validada.
 * @param {object} params
 * @param {number} params.idUsuario - Usuario autenticado (dueño de la adopción).
 * @param {number} params.idAdopcion - Adopción a la que pertenece el reporte.
 * @param {object} params.datos - nivel_riego, estado_salud, observaciones.
 * @param {Buffer} params.imagenBuffer - Imagen original (con EXIF).
 * @returns {Promise<object>} Reporte con su evidencia.
 */
async function crearReporte({ idUsuario, idAdopcion, datos, imagenBuffer }) {
  const adopcion = await Adopcion.findOne({
    where: { id_adopcion: idAdopcion, id_usuario: idUsuario },
    include: [{ model: Arbol }],
  });

  if (!adopcion) {
    throw new AppError('Adopción no encontrada o no te pertenece.', 404);
  }

  // RF04: validar EXIF/GPS antes de aceptar el reporte.
  const exif = await validateExif(imagenBuffer, adopcion.Arbol);
  if (!exif.valido) {
    throw new AppError(exif.motivo || 'La evidencia fotográfica no es válida.', 422);
  }

  // R2: subir la imagen a Cloudinary (nunca al disco local).
  const publicId = randomUUID();
  let uploadResult;
  try {
    uploadResult = await uploadImage(imagenBuffer, CLOUDINARY_FOLDER, publicId);
  } catch (error) {
    logger.error(`Fallo al subir imagen a Cloudinary: ${error.message}`);
    throw new AppError('No se pudo almacenar la evidencia fotográfica.', 502);
  }

  const resultado = await sequelize.transaction(async (t) => {
    const reporte = await Reporte.create(
      {
        id_adopcion: idAdopcion,
        fecha_reporte: new Date(),
        nivel_riego: datos.nivel_riego,
        coloracion_hojas: datos.coloracion_hojas,
        presencia_plagas: datos.presencia_plagas === true || datos.presencia_plagas === 'true',
        detalle_plagas: datos.detalle_plagas,
        estado_general: datos.estado_general || datos.estado_salud,
        observaciones: datos.observaciones,
        lat_validacion: exif.gps ? exif.gps.lat : null,
        lng_validacion: exif.gps ? exif.gps.lng : null,
        geovalidado: true,
      },
      { transaction: t }
    );

    const evidencia = await EvidenciaFotografica.create(
      {
        id_reporte: reporte.id_reporte,
        url_imagen: uploadResult.secure_url,
        public_id_cloud: uploadResult.public_id,
        exif_lat: exif.gps ? exif.gps.lat : null,
        exif_lng: exif.gps ? exif.gps.lng : null,
        exif_timestamp: exif.fecha || null,
        exif_valido: true,
        fecha_subida: new Date(),
        mime_type: uploadResult.resource_type
          ? `image/${uploadResult.format}`
          : null,
        tamano_bytes: uploadResult.bytes || null,
      },
      { transaction: t }
    );

    logger.info(
      `Reporte ${reporte.id_reporte} creado para la adopción ${idAdopcion}.`
    );

    return { reporte, evidencia };
  });

  // Recalcula el impacto ambiental del árbol tras el nuevo reporte (RF05).
  // Va fuera de la transacción: un fallo aquí no debe revertir el reporte.
  try {
    await calcularImpacto(adopcion.Arbol.id_arbol);
  } catch (error) {
    logger.warn(
      `No se pudo recalcular el impacto del árbol ${adopcion.Arbol.id_arbol}: ${error.message}`
    );
  }

  return resultado;
}

module.exports = { crearReporte, CLOUDINARY_FOLDER };
