'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo Rol → tabla "roles".
 * Catálogo de roles del sistema (ADMINISTRADOR / ESTUDIANTE).
 */
module.exports = (sequelize) => {
  const Rol = sequelize.define(
    'Rol',
    {
      id_rol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre_rol: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'roles',
      timestamps: false,
    }
  );

  return Rol;
};
