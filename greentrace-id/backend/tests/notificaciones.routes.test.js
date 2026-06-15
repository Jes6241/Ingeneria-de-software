'use strict';

/**
 * Pruebas de integración de las rutas de notificaciones (RF06/RF07).
 * Verifican la autenticación y el flujo de marcar como leídas.
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
  EcuacionAlometrica: {},
  Especie: {},
  Notificacion: {
    findAll: jest.fn().mockResolvedValue([
      { id_notificacion: 1, mensaje: 'Fecha de corte próxima', leido: false },
    ]),
    count: jest.fn().mockResolvedValue(1),
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue([1]),
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
const { Notificacion } = require('../src/models');

const TOKEN = `Bearer ${jwt.sign(
  { id_usuario: 7, correo: 'ana@alumno.ipn.mx', rol: 'ESTUDIANTE' },
  process.env.JWT_SECRET
)}`;

describe('GET /api/notifications/me', () => {
  it('rechaza la petición sin token con 401', async () => {
    const res = await request(app).get('/api/notifications/me');
    expect(res.statusCode).toBe(401);
  });

  it('devuelve notificaciones y el conteo de no leídas', async () => {
    const res = await request(app)
      .get('/api/notifications/me')
      .set('Authorization', TOKEN);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('no_leidas', 1);
    expect(res.body.notificaciones).toHaveLength(1);
  });
});

describe('PATCH /api/notifications/read-all', () => {
  it('marca todas las notificaciones como leídas', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', TOKEN);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ actualizadas: 1 });
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devuelve 404 si la notificación no existe o no es del usuario', async () => {
    Notificacion.findOne.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/notifications/999/read')
      .set('Authorization', TOKEN);
    expect(res.statusCode).toBe(404);
  });

  it('marca una notificación propia como leída', async () => {
    const save = jest.fn().mockResolvedValue();
    Notificacion.findOne.mockResolvedValue({
      id_notificacion: 1,
      id_usuario: 7,
      leido: false,
      save,
    });
    const res = await request(app)
      .patch('/api/notifications/1/read')
      .set('Authorization', TOKEN);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('leido', true);
    expect(save).toHaveBeenCalled();
  });
});
