'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo Arbol → tabla "arboles".
 * Cada árbol tiene un identificador único (id_unico) vinculado a su código QR.
 * Los árboles NUNCA se eliminan físicamente (R8).
 */
module.exports = (sequelize) => {
  const Arbol = sequelize.define(
    'Arbol',
    {
      id_arbol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_unico: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      id_especie: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fecha_plantacion: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      latitud: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      longitud: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      ubicacion_descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'arboles',
      timestamps: false,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return Arbol;
};
