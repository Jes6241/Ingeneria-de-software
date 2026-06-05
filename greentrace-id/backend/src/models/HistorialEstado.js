'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo HistorialEstado → tabla "historial_estados".
 * Registra la evolución del estado de salud del árbol (RF11, solo lectura).
 */
module.exports = (sequelize) => {
  const HistorialEstado = sequelize.define(
    'HistorialEstado',
    {
      id_historial: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_arbol: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Reporte que originó este cambio de estado.
      id_reporte_origen: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      estado_salud: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'historial_estados',
      timestamps: false,
    }
  );

  return HistorialEstado;
};
