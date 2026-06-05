'use strict';

/**
 * Configuración del SDK de Cloudinary v2.
 *
 * Riesgo R2 mitigado: TODAS las imágenes se almacenan en Cloudinary (CDN),
 * nunca en el sistema de archivos local del servidor.
 */

const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  logger.warn(
    'Cloudinary no está configurado: faltan variables de entorno CLOUDINARY_*'
  );
}

/**
 * Sube un buffer de imagen a Cloudinary aplicando compresión automática.
 * La imagen final en la nube debe pesar como máximo 2 MB (RNF07).
 *
 * @param {Buffer} buffer - Contenido binario de la imagen ya validada.
 * @param {string} folder - Carpeta destino en Cloudinary.
 * @param {string} publicId - Identificador único (UUID) del archivo.
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
function uploadImage(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        // Compresión y redimensionado para no exceder 2 MB en la nube.
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

module.exports = { cloudinary, uploadImage };
