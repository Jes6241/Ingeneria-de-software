'use strict';

/**
 * Servicio de validación EXIF (RF04).
 * Extrae GPS y DateTimeOriginal de la imagen y valida que la foto fue tomada
 * cerca del árbol (radio ≤ 20 m) y en una fecha reciente.
 */

const exifr = require('exifr');

// Radio máximo permitido entre la foto y el árbol (metros).
const MAX_DISTANCE_METERS = 20;
// Antigüedad máxima admitida para la foto (días).
const MAX_PHOTO_AGE_DAYS = 7;

/**
 * Calcula la distancia en metros entre dos coordenadas (fórmula de Haversine).
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distancia en metros.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Radio de la Tierra en metros.
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Valida los metadatos EXIF de una imagen contra la ubicación del árbol.
 * @param {Buffer} buffer - Imagen original (con EXIF intacto).
 * @param {{ latitud: number, longitud: number }} arbol - Coordenadas del árbol.
 * @returns {Promise<{ valido: boolean, motivo?: string, gps?: object, fecha?: Date }>}
 */
async function validateExif(buffer, arbol) {
  let exif;
  try {
    exif = await exifr.parse(buffer, { gps: true });
  } catch (error) {
    return { valido: false, motivo: 'No se pudieron leer los metadatos EXIF.' };
  }

  if (!exif || exif.latitude == null || exif.longitude == null) {
    return {
      valido: false,
      motivo: 'La foto no contiene datos de GPS. Captura una foto en tiempo real.',
    };
  }

  const fecha = exif.DateTimeOriginal || exif.CreateDate;
  if (!fecha) {
    return {
      valido: false,
      motivo: 'La foto no contiene fecha de captura válida.',
    };
  }

  // Validar antigüedad de la foto.
  const ageDays = (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > MAX_PHOTO_AGE_DAYS || ageDays < 0) {
    return {
      valido: false,
      motivo: 'La fecha de la foto no es reciente o es inválida.',
      fecha,
    };
  }

  // Validar cercanía al árbol.
  if (arbol && arbol.latitud != null && arbol.longitud != null) {
    const distancia = haversineDistance(
      Number(exif.latitude),
      Number(exif.longitude),
      Number(arbol.latitud),
      Number(arbol.longitud)
    );

    if (distancia > MAX_DISTANCE_METERS) {
      return {
        valido: false,
        motivo: `La foto fue tomada a ${Math.round(distancia)} m del árbol (máx ${MAX_DISTANCE_METERS} m).`,
        gps: { lat: exif.latitude, lng: exif.longitude },
        fecha,
      };
    }
  }

  return {
    valido: true,
    gps: { lat: exif.latitude, lng: exif.longitude },
    fecha,
  };
}

module.exports = {
  validateExif,
  haversineDistance,
  MAX_DISTANCE_METERS,
  MAX_PHOTO_AGE_DAYS,
};
