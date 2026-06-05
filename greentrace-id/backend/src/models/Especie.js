'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo Especie → tabla "especies".
 * Catálogo de especies botánicas (RF10). Solo el Administrador da de alta.
 */
module.exports = (sequelize) => {
  const Especie = sequelize.define(
    'Especie',
    {
      id_especie: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre_cientifico: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nombre_comun: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      necesidad_riego: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      exposicion_solar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      activa: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
    },
    {
      tableName: 'especies',
      timestamps: false,
    }
  );

  return Especie;
};
