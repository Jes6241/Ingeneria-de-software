'use strict';

/**
 * Pruebas de integración del módulo de autenticación (RF09).
 *
 * Se mockea la capa de modelos para que las pruebas no dependan de una
 * conexión viva a Supabase. La construcción de Sequelize no abre conexión,
 * así que basta con definir variables de entorno ficticias.
 */

// Variables de entorno mínimas requeridas al importar la app.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/postgres';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

// Mock de la capa de modelos.
jest.mock('../src/models', () => {
  const Usuario = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    scope: jest.fn().mockReturnValue({
      // Login con credenciales incorrectas: no existe el usuario → null.
      findOne: jest.fn().mockResolvedValue(null),
    }),
  };
  const Rol = { findOne: jest.fn().mockResolvedValue({ id_rol: 2, nombre: 'ESTUDIANTE' }) };

  return {
    sequelize: { transaction: jest.fn() },
    Usuario,
    Rol,
    Arbol: {},
    Adopcion: {},
    Reporte: {},
    EvidenciaFotografica: {},
    ImpactoAmbiental: {},
    HistorialEstado: {},
    Notificacion: {},
    Especie: {},
    EcuacionAlometrica: {},
  };
});

// Evita que los cron jobs se registren durante las pruebas.
jest.mock('../src/jobs/cronJobs', () => ({
  startCronJobs: jest.fn(),
  verificar_fechas_corte: jest.fn(),
  verificar_inactividad: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');

describe('POST /api/auth/register', () => {
  it('rechaza un correo fuera del dominio @alumno.ipn.mx con 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Juan Pérez',
      correo: 'juan@gmail.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/login', () => {
  it('rechaza credenciales incorrectas con 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      correo: 'inexistente@alumno.ipn.mx',
      password: 'wrongpassword',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
