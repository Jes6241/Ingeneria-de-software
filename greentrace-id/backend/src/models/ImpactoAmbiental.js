'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo ImpactoAmbiental → tabla "impacto_ambiental".
 * Almacena la captura de CO₂ y la biomasa calculadas por árbol (RF05).
 */
module.exports = (sequelize) => {
  const ImpactoAmbiental = sequelize.define(
    'ImpactoAmbiental',
    {
      id_impacto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_arbol: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Captura estimada de CO₂ en kg.
      captura_co2_kg: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      // Biomasa estimada en kg.
      biomasa_kg: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      // Edad del árbol (en meses) usada en el cálculo.
      edad_calc_meses: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Ecuación alométrica utilizada en este cálculo.
      id_ecuacion_usada: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fecha_calculo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'impacto_ambiental',
      timestamps: false,
    }
  );

  return ImpactoAmbiental;
};
