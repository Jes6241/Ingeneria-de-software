'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo Adopcion → tabla "adopciones".
 * Soft delete con deleted_at: al liberar un árbol por inactividad (RF07) la
 * adopción se marca como eliminada pero los reportes históricos permanecen.
 */
module.exports = (sequelize) => {
  const Adopcion = sequelize.define(
    'Adopcion',
    {
      id_adopcion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_arbol: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha_adopcion: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      // Fecha de corte mensual para el reporte.
      fecha_corte: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      estado: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'adopciones',
      timestamps: false,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return Adopcion;
};
