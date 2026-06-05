'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo Reporte → tabla "reportes".
 * Reporte mensual de salud del árbol (RF03). Nunca se elimina físicamente.
 */
module.exports = (sequelize) => {
  const Reporte = sequelize.define(
    'Reporte',
    {
      id_reporte: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_adopcion: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha_reporte: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      nivel_riego: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      coloracion_hojas: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      presencia_plagas: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      detalle_plagas: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estado_general: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lat_validacion: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      lng_validacion: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      geovalidado: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
    },
    {
      tableName: 'reportes',
      timestamps: false,
    }
  );

  return Reporte;
};
