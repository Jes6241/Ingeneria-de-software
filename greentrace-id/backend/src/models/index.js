'use strict';

/**
 * Punto de entrada de la capa de modelos.
 * Carga cada modelo, define las asociaciones y exporta la instancia de
 * Sequelize junto con todos los modelos.
 *
 * NOTA: No se ejecuta sequelize.sync(). La base de datos ya existe en Supabase.
 */

const { sequelize } = require('../config/database');

const Rol = require('./Rol')(sequelize);
const Usuario = require('./Usuario')(sequelize);
const Especie = require('./Especie')(sequelize);
const EcuacionAlometrica = require('./EcuacionAlometrica')(sequelize);
const Arbol = require('./Arbol')(sequelize);
const Adopcion = require('./Adopcion')(sequelize);
const Reporte = require('./Reporte')(sequelize);
const EvidenciaFotografica = require('./EvidenciaFotografica')(sequelize);
const ImpactoAmbiental = require('./ImpactoAmbiental')(sequelize);
const HistorialEstado = require('./HistorialEstado')(sequelize);
const Notificacion = require('./Notificacion')(sequelize);

/* ------------------------------------------------------------------ *
 *  Asociaciones                                                       *
 *  Claves foráneas con ON DELETE SET NULL (no CASCADE) en la BD (R8). *
 * ------------------------------------------------------------------ */

// Rol 1..N Usuario
Rol.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });

// Usuario 1..N Adopcion
Usuario.hasMany(Adopcion, { foreignKey: 'id_usuario' });
Adopcion.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// Arbol 1..N Adopcion
Arbol.hasMany(Adopcion, { foreignKey: 'id_arbol' });
Adopcion.belongsTo(Arbol, { foreignKey: 'id_arbol' });

// Adopcion 1..N Reporte
Adopcion.hasMany(Reporte, { foreignKey: 'id_adopcion' });
Reporte.belongsTo(Adopcion, { foreignKey: 'id_adopcion' });

// Reporte 1..N EvidenciaFotografica
Reporte.hasMany(EvidenciaFotografica, { foreignKey: 'id_reporte' });
EvidenciaFotografica.belongsTo(Reporte, { foreignKey: 'id_reporte' });

// Arbol 1..1 ImpactoAmbiental
Arbol.hasOne(ImpactoAmbiental, { foreignKey: 'id_arbol' });
ImpactoAmbiental.belongsTo(Arbol, { foreignKey: 'id_arbol' });

// Arbol 1..N HistorialEstado
Arbol.hasMany(HistorialEstado, { foreignKey: 'id_arbol' });
HistorialEstado.belongsTo(Arbol, { foreignKey: 'id_arbol' });

// Usuario 1..N Notificacion
Usuario.hasMany(Notificacion, { foreignKey: 'id_usuario' });
Notificacion.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// Adopcion 1..N Notificacion
Adopcion.hasMany(Notificacion, { foreignKey: 'id_adopcion' });
Notificacion.belongsTo(Adopcion, { foreignKey: 'id_adopcion' });

// Especie 1..N EcuacionAlometrica
Especie.hasMany(EcuacionAlometrica, { foreignKey: 'id_especie' });
EcuacionAlometrica.belongsTo(Especie, { foreignKey: 'id_especie' });

// Especie 1..N Arbol
Especie.hasMany(Arbol, { foreignKey: 'id_especie' });
Arbol.belongsTo(Especie, { foreignKey: 'id_especie' });

module.exports = {
  sequelize,
  Rol,
  Usuario,
  Especie,
  EcuacionAlometrica,
  Arbol,
  Adopcion,
  Reporte,
  EvidenciaFotografica,
  ImpactoAmbiental,
  HistorialEstado,
  Notificacion,
};
