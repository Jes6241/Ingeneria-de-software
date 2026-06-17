'use strict';

const multer = require('multer');

function detectMime(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  return null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = Object.freeze(['image/jpeg', 'image/png']);
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) return cb(new Error('TIPO_NO_PERMITIDO'));
    return cb(null, true);
  },
});

function validateMagicBytes(req, res, next) {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  const mime = detectMime(req.file.buffer);
  if (!mime) return res.status(415).json({ error: 'El contenido real del archivo no es una imagen JPEG o PNG válida.' });
  req.file.detectedMime = mime;
  req.file.detectedExt = mime === 'image/jpeg' ? 'jpg' : 'png';
  return next();
}

function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'El archivo supera el límite de 10 MB.' });
    return res.status(400).json({ error: `Error de carga: ${err.message}` });
  }
  if (err && err.message === 'TIPO_NO_PERMITIDO') return res.status(415).json({ error: 'Solo se permiten archivos .jpg, .jpeg o .png.' });
  return next(err);
}

module.exports = { upload, validateMagicBytes, handleUploadErrors, MAX_FILE_SIZE, ALLOWED_MIME };
