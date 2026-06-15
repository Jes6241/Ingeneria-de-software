'use strict';

/**
 * Pruebas de integración de las rutas del catálogo de especies (RF10).
 * Verifican la autenticación JWT y el control de acceso por rol (RBAC).
 * La capa de modelos y los cron jobs se mockean para no tocar la BD real.
 */

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/postgres';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models', () => ({
  sequelize: { transaction: jest.fn() },
  Usuario: {},
  Rol: {},
  Arbol: {},
  Adopcion: {},
  Reporte: {},
  EvidenciaFotografica: {},
  ImpactoAmbiental: {},
  HistorialEstado: {},
  Notificacion: {},
  EcuacionAlometrica: {},
  Especie: {
    findAll: jest.fn().mockResolvedValue([
      { id_especie: 1, nombre_comun: 'Jacaranda' },
    ]),
    create: jest.fn().mockImplementation((data) =>
      Promise.resolve({ id_especie: 9, ...data })
    ),
  },
}));

jest.mock('../src/jobs/cronJobs', () => ({
  startCronJobs: jest.fn(),
  verificar_fechas_corte: jest.fn(),
  verificar_inactividad: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');

/** Genera un Bearer token válido para el rol indicado. */
function tokenPara(rol) {
  const payload = { id_usuario: 1, correo: 'admin@alumno.ipn.mx', rol };
  return `Bearer ${jwt.sign(payload, process.env.JWT_SECRET)}`;
}

describe('GET /api/especies', () => {
  it('rechaza la petición sin token con 401', async () => {
    const res = await request(app).get('/api/especies');
    expect(res.statusCode).toBe(401);
  });

  it('devuelve el catálogo a un usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/especies')
      .set('Authorization', tokenPara('ESTUDIANTE'));
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('nombre_comun', 'Jacaranda');
  });
});

describe('POST /api/especies', () => {
  it('rechaza a un estudiante con 403 (solo administrador)', async () => {
    const res = await request(app)
      .post('/api/especies')
      .set('Authorization', tokenPara('ESTUDIANTE'))
      .send({ nombre_comun: 'Encino' });
    expect(res.statusCode).toBe(403);
  });

  it('rechaza un cuerpo sin nombre común con 400', async () => {
    const res = await request(app)
      .post('/api/especies')
      .set('Authorization', tokenPara('ADMINISTRADOR'))
      .send({ nombre_cientifico: 'Quercus' });
    expect(res.statusCode).toBe(400);
  });

  it('crea una especie cuando el administrador envía datos válidos', async () => {
    const res = await request(app)
      .post('/api/especies')
      .set('Authorization', tokenPara('ADMINISTRADOR'))
      .send({ nombre_comun: 'Encino', necesidad_riego: 'MEDIA' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_especie');
    expect(res.body).toHaveProperty('nombre_comun', 'Encino');
  });
});
