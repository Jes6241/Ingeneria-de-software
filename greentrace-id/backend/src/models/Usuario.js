'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo Usuario → tabla "usuarios".
 * Solo se permiten correos del dominio @alumno.ipn.mx (RF09).
 * Soft delete mediante el campo deleted_at (R8).
 */
module.exports = (sequelize) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      correo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      id_rol: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha_registro: {
        type: DataTypes.DATE,
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
      tableName: 'usuarios',
      timestamps: false,
      // Soft delete: las consultas excluyen registros con deleted_at.
      paranoid: true,
      deletedAt: 'deleted_at',
      defaultScope: {
        // Nunca exponer el hash de contraseña por defecto.
        attributes: { exclude: ['password_hash'] },
      },
      scopes: {
        // Scope explícito para autenticación (incluye password_hash).
        withPassword: { attributes: {} },
      },
    }
  );

  return Usuario;
};
