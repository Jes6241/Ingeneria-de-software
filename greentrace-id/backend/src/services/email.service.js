'use strict';

/**
 * Servicio de envío de emails para GreenTrace ID.
 * Maneja notificaciones de recordatorio de reportes y liberación de árboles.
 */

const nodemailer = require('nodemailer');
const logger = require('../config/logger');

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  logger.warn('⚠️  Variables SMTP no configuradas. Email disabled.');
}

// Crear transporter una sola vez (pool de conexiones)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía recordatorio 48 horas antes de la fecha límite de reporte.
 * @param {Object} usuario - Objeto usuario con { correo, nombre }
 * @param {Object} adopcion - Objeto adopción con { fecha_corte }
 * @param {Object} arbol - Objeto árbol con { id_unico, especie: { nombre_comun } }
 * @param {number} diasRestantes - Días hasta fecha_corte
 * @returns {Promise<void>}
 */
async function sendReminderEmail(usuario, adopcion, arbol, diasRestantes) {
  if (!process.env.SMTP_USER) {
    logger.warn('SMTP no configurado. Email no enviado.');
    return;
  }

  const asunto = `📋 Recordatorio: ${diasRestantes} días para reportar tu árbol`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2d6a4f; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { line-height: 1.6; }
        .button { display: inline-block; background: #2d6a4f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { color: #999; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 GreenTrace ID</h1>
        </div>
        <div class="content">
          <p>¡Hola ${usuario.nombre}!</p>
          <p>Este es un recordatorio de que tienes <strong>${diasRestantes} día(s)</strong> para reportar la salud de tu árbol adoptado.</p>

          <p><strong>Árbol:</strong> ${arbol.especie?.nombre_comun || 'Árbol'} (${arbol.id_unico})</p>
          <p><strong>Fecha límite:</strong> ${new Date(adopcion.fecha_corte).toLocaleDateString('es-MX')}</p>

          <p>Es importante mantener un registro actualizado de la salud de tu árbol. Esto nos ayuda a:</p>
          <ul>
            <li>Monitorear el crecimiento y bienestar</li>
            <li>Detectar problemas tempranamente</li>
            <li>Calcular el impacto ambiental acumulado</li>
          </ul>

          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/${arbol.id_arbol}" class="button">
              📱 Enviar Reporte
            </a>
          </p>

          <p>Si tienes dudas, contacta con el administrador.</p>
        </div>
        <div class="footer">
          <p>© 2026 GreenTrace ID - Equipo ESCOM IPN</p>
          <p>Este es un email automático. No responder a este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@greentrace.com',
      to: usuario.correo,
      cc: process.env.ADMIN_EMAIL || '',
      subject: asunto,
      html: htmlContent,
    });

    logger.info(`Email enviado: recordatorio a ${usuario.correo} (árbol ${arbol.id_unico})`);
  } catch (error) {
    logger.error(`Error enviando email a ${usuario.correo}: ${error.message}`);
    throw error;
  }
}

/**
 * Envía notificación cuando un árbol es liberado por inactividad.
 * @param {Object} usuario - Objeto usuario con { correo, nombre }
 * @param {Object} arbol - Objeto árbol con { id_unico, especie: { nombre_comun } }
 * @returns {Promise<void>}
 */
async function sendReleaseNotification(usuario, arbol) {
  if (!process.env.SMTP_USER) {
    logger.warn('SMTP no configurado. Email no enviado.');
    return;
  }

  const asunto = '⚠️ Tu árbol ha sido liberado por inactividad';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d62828; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { line-height: 1.6; }
        .footer { color: #999; font-size: 12px; margin-top: 30px; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 GreenTrace ID</h1>
        </div>
        <div class="content">
          <p>Hola ${usuario.nombre},</p>

          <div class="alert">
            <p><strong>⚠️ Tu árbol ha sido liberado</strong></p>
            <p>Tu adopción del árbol ${arbol.especie?.nombre_comun || 'Árbol'} (${arbol.id_unico}) ha sido cancelada por inactividad.</p>
          </div>

          <p>Esto ocurrió porque no se enviaron reportes de salud en los últimos días pasada la fecha límite.</p>

          <p><strong>¿Qué significa esto?</strong></p>
          <ul>
            <li>El árbol está nuevamente disponible para ser adoptado</li>
            <li>Tu historial de reportes se mantiene en tu perfil</li>
            <li>Puedes adoptar otro árbol en cualquier momento</li>
          </ul>

          <p>Si crees que esto es un error, contacta con el administrador.</p>
        </div>
        <div class="footer">
          <p>© 2026 GreenTrace ID - Equipo ESCOM IPN</p>
          <p>Este es un email automático. No responder a este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@greentrace.com',
      to: usuario.correo,
      cc: process.env.ADMIN_EMAIL || '',
      subject: asunto,
      html: htmlContent,
    });

    logger.info(`Email enviado: liberación a ${usuario.correo} (árbol ${arbol.id_unico})`);
  } catch (error) {
    logger.error(`Error enviando email de liberación a ${usuario.correo}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  sendReminderEmail,
  sendReleaseNotification,
};
