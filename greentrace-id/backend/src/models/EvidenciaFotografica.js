'use strict';

const { DataTypes } = require('sequelize');

/**
 * Modelo EvidenciaFotografica → tabla "evidencias_fotograficas".
 * Guarda la URL de Cloudinary de cada foto y los datos EXIF validados (RF04).
 * RNF04: las coordenadas del estudiante no se exponen públicamente en la API.
 */
module.exports = (sequelize) => {
  const EvidenciaFotografica = sequelize.define(
    'EvidenciaFotografica',
    {
      id_evidencia: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_reporte: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      url_imagen: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // ID público en Cloudinary (para gestión/borrado).
      public_id_cloud: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      exif_lat: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      exif_lng: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      exif_timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Resultado de la validación EXIF/geolocalización (RF04).
      exif_valido: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      fecha_subida: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      mime_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tamano_bytes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'evidencias_fotograficas',
      timestamps: false,
    }
  );

  return EvidenciaFotografica;
};
