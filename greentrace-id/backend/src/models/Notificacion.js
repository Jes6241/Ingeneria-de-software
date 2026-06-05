'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo Notificacion → tabla "notificaciones".
 * Recordatorios y alertas enviados al usuario (RF06).
 */
module.exports = (sequelize) => {
  const Notificacion = sequelize.define(
    'Notificacion',
    {
      id_notificacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_adopcion: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Tipo de notificación (p. ej. 'RECORDATORIO', 'LIBERACION', 'ALERTA').
      tipo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mensaje: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      fecha_envio: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Indica si el correo/notificación ya fue enviado.
      enviado: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      // Indica si el usuario ya la leyó.
      leido: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    },
    {
      tableName: 'notificaciones',
      timestamps: false,
    }
  );

  return Notificacion;
};
