'use strict';

/**
 * Rutas de notificaciones (RF06/RF07).
 *   GET   /api/notifications/me        → notificaciones del usuario
 *   PATCH /api/notifications/read-all   → marcar todas como leídas
 *   PATCH /api/notifications/:id/read   → marcar una como leída
 */

const { Router } = require('express');

const notificacionesController = require('../controllers/notificaciones.controller');
const authenticate = require('../middlewares/auth');

const router = Router();

router.get('/me', authenticate, notificacionesController.listMine);
router.patch('/read-all', authenticate, notificacionesController.markAllRead);
router.patch('/:id/read', authenticate, notificacionesController.markRead);

module.exports = router;
