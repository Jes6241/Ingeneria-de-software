'use strict';

/**
 * Elimina TODOS los árboles (y datos dependientes en cascada) y genera
 * 20 árboles nuevos con ubicaciones reales dentro del campus ESCOM IPN
 * Unidad Zacatenco, CDMX.
 *
 * Uso:
 *   node scripts/seedTreesESCOM.js
 */

const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { sequelize, Arbol, Especie } = require('../src/models');
const logger = require('../src/config/logger');

// ─── Ubicaciones reales dentro de ESCOM IPN Unidad Zacatenco ──────────────────
// Centro del campus: 19.5050° N, -99.1465° W
// Cada punto está verificado para quedar dentro del predio escolar.
const ARBOLES_ESCOM = [
  // Acceso principal
  { desc: 'Puerta principal — acceso peatonal norte',   lat: 19.50448, lng: -99.14685 },
  { desc: 'Puerta principal — acceso vehicular sur',    lat: 19.50431, lng: -99.14693 },
  // Jardín frontal
  { desc: 'Jardín frontal — camellón central',          lat: 19.50467, lng: -99.14672 },
  { desc: 'Jardín frontal — lateral izquierdo',         lat: 19.50472, lng: -99.14660 },
  { desc: 'Jardín frontal — lateral derecho',           lat: 19.50459, lng: -99.14695 },
  // Patio central
  { desc: 'Patio central — esquina noreste',            lat: 19.50505, lng: -99.14640 },
  { desc: 'Patio central — esquina noroeste',           lat: 19.50508, lng: -99.14662 },
  { desc: 'Patio central — zona de bancas',             lat: 19.50498, lng: -99.14650 },
  // Edificios
  { desc: 'Edificio A — entrada lateral',               lat: 19.50521, lng: -99.14628 },
  { desc: 'Edificio B — corredor exterior',             lat: 19.50535, lng: -99.14647 },
  { desc: 'Edificio C — patio trasero',                 lat: 19.50549, lng: -99.14631 },
  // Área de descanso y cafetería
  { desc: 'Área de descanso — junto a bancas',          lat: 19.50514, lng: -99.14608 },
  { desc: 'Cafetería — terraza exterior',               lat: 19.50527, lng: -99.14592 },
  // Biblioteca
  { desc: 'Biblioteca — acceso norte',                  lat: 19.50482, lng: -99.14595 },
  { desc: 'Biblioteca — acceso sur',                    lat: 19.50468, lng: -99.14587 },
  // Auditorio
  { desc: 'Auditorio — acceso principal',               lat: 19.50489, lng: -99.14670 },
  { desc: 'Auditorio — lateral este',                   lat: 19.50496, lng: -99.14682 },
  // Zona deportiva y jardín trasero
  { desc: 'Zona deportiva — borde norte',               lat: 19.50558, lng: -99.14668 },
  { desc: 'Jardín trasero — sector este',               lat: 19.50543, lng: -99.14612 },
  { desc: 'Jardín trasero — sector oeste',              lat: 19.50556, lng: -99.14693 },
];

async function resetAndSeed() {
  try {
    console.log('🔗 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // ── 1. Borrar todos los árboles y datos dependientes ────────────────────
    console.log('🗑️  Eliminando todos los árboles y datos relacionados...');
    // CASCADE elimina adopciones, reportes, evidencias, notificaciones, etc.
    await sequelize.query('TRUNCATE TABLE arboles CASCADE');
    console.log('✅ Tablas limpiadas\n');

    // ── 2. Cargar especies disponibles ──────────────────────────────────────
    console.log('📚 Obteniendo catálogo de especies...');
    const especies = await Especie.findAll({ where: { activa: true } });

    if (especies.length === 0) {
      console.error('❌ No hay especies activas. Agrega especies primero.');
      process.exit(1);
    }
    console.log(`✅ ${especies.length} especie(s) disponibles\n`);

    // ── 3. Construir los 20 registros ────────────────────────────────────────
    console.log('🌱 Generando 20 árboles en ESCOM IPN Zacatenco...\n');

    const hoy = new Date();
    const arboles = ARBOLES_ESCOM.map((ubicacion, i) => {
      const especie = especies[i % especies.length];

      // Fecha de plantación distribuida entre hace 3 años y hace 2 meses
      const diasAtras = 60 + Math.floor((i / ARBOLES_ESCOM.length) * 1035);
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - diasAtras);

      return {
        id_unico: `GT-${uuidv4()}`,
        id_especie: especie.id_especie,
        fecha_plantacion: fecha.toISOString().split('T')[0],
        latitud: ubicacion.lat.toFixed(6),
        longitud: ubicacion.lng.toFixed(6),
        ubicacion_descripcion: `ESCOM IPN — ${ubicacion.desc}`,
        activo: true,
      };
    });

    // ── 4. Insertar en BD ────────────────────────────────────────────────────
    console.log('📝 Insertando en la base de datos...');
    const resultado = await Arbol.bulkCreate(arboles);
    console.log(`✅ ${resultado.length} árboles creados\n`);

    // ── 5. Resumen ───────────────────────────────────────────────────────────
    console.log('📊 Resumen:');
    console.log(`   Campus: ESCOM IPN Unidad Zacatenco, CDMX`);
    console.log(`   Centro: 19.5050° N, -99.1465° W`);
    console.log(`   Total:  ${resultado.length} árboles\n`);

    console.log('🌳 Listado de árboles creados:');
    resultado.forEach((arbol, idx) => {
      console.log(`\n   ${String(idx + 1).padStart(2, ' ')}. ${arbol.ubicacion_descripcion}`);
      console.log(`       ID:          ${arbol.id_unico}`);
      console.log(`       Coordenadas: ${arbol.latitud}, ${arbol.longitud}`);
      console.log(`       Plantado:    ${arbol.fecha_plantacion}`);
    });

    console.log('\n✨ ¡Listo! Los árboles ya están disponibles para ser adoptados.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    logger.error(`seedTreesESCOM: ${error.message}`);
    process.exit(1);
  }
}

resetAndSeed();
