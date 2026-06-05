'use strict';

/**
 * Pipeline de carga de archivos (3 etapas obligatorias):
 *   1. Validar el tipo MIME REAL por magic bytes (no solo la extensión) — R7/RNF06
 *   2. (La compresión/redimensionado se aplica al subir a Cloudinary)
 *   3. Rechazar con HTTP 413 si el archivo supera 10 MB — RNF07
 *
 * Se usa multer con almacenamiento en memoria (Buffer): R7 exige NO escribir
 * archivos en el disco del servidor ni ejecutarlos.
 */

const multer = require('multer');
// file-type v16 (CommonJS) expone fromBuffer; v17+ es solo ESM.
const { fromBuffer } = require('file-type');

// Límite duro de 10 MB (RNF07).
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Solo se aceptan JPEG y PNG (RNF06).
const ALLOWED_MIME = Object.freeze(['image/jpeg', 'image/png']);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  // Filtro preliminar por MIME declarado (la validación real es por magic bytes).
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('TIPO_NO_PERMITIDO'));
    }
    return cb(null, true);
  },
});

/**
 * Middleware que valida los magic bytes reales del archivo subido.
 * Debe ejecutarse después de upload.single('foto').
 * @type {import('express').RequestHandler}
 */
async function validateMagicBytes(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  }

  try {
    const detected = await fromBuffer(req.file.buffer);

    if (!detected || !ALLOWED_MIME.includes(detected.mime)) {
      return res.status(415).json({
        error:
          'El contenido real del archivo no es una imagen JPEG o PNG válida.',
      });
    }

    // Adjunta el tipo verificado para etapas posteriores.
    req.file.detectedMime = detected.mime;
    req.file.detectedExt = detected.ext;
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Traduce los errores de multer a respuestas HTTP adecuadas.
 * En particular, LIMIT_FILE_SIZE → 413 (RNF07).
 * @type {import('express').ErrorRequestHandler}
 */
function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(413)
        .json({ error: 'El archivo supera el límite de 10 MB.' });
    }
    return res.status(400).json({ error: `Error de carga: ${err.message}` });
  }

  if (err && err.message === 'TIPO_NO_PERMITIDO') {
    return res
      .status(415)
      .json({ error: 'Solo se permiten archivos .jpg, .jpeg o .png.' });
  }

  return next(err);
}

module.exports = {
  upload,
  validateMagicBytes,
  handleUploadErrors,
  MAX_FILE_SIZE,
  ALLOWED_MIME,
};
