'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo EcuacionAlometrica → tabla "ecuaciones_alometricas".
 * Almacena las fórmulas alométricas por especie usadas para el cálculo de
 * biomasa y captura de CO₂ (RF05, RF10).
 */
module.exports = (sequelize) => {
  const EcuacionAlometrica = sequelize.define(
    'EcuacionAlometrica',
    {
      id_ecuacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_especie: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Variable física de entrada (p. ej. 'DAP', 'altura', 'edad').
      variable: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Coeficientes de la ecuación: resultado = coef_a * (variable)^coef_b
      coef_a: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      coef_b: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      unidad_resultado: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fuente: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'ecuaciones_alometricas',
      timestamps: false,
    }
  );

  return EcuacionAlometrica;
};
