'use strict';

/**
 * Pruebas unitarias del servicio de notificaciones (RF06/RF07).
 * La capa de modelos se mockea para validar la lógica sin BD.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models', () => ({
  Notificacion: {
    findAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
}));

const { Notificacion } = require('../src/models');
const {
  listByUsuario,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
} = require('../src/services/notificaciones.service');

describe('listByUsuario', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devuelve las notificaciones del usuario más recientes primero', async () => {
    Notificacion.findAll.mockResolvedValue([{ id_notificacion: 1 }]);
    const res = await listByUsuario(7);
    expect(Notificacion.findAll).toHaveBeenCalledWith({
      where: { id_usuario: 7 },
      order: [['fecha_envio', 'DESC']],
    });
    expect(res).toHaveLength(1);
  });
});

describe('contarNoLeidas', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cuenta solo las no leídas del usuario', async () => {
    Notificacion.count.mockResolvedValue(3);
    const total = await contarNoLeidas(7);
    expect(Notificacion.count).toHaveBeenCalledWith({
      where: { id_usuario: 7, leido: false },
    });
    expect(total).toBe(3);
  });
});

describe('marcarLeida', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lanza 404 si la notificación no pertenece al usuario', async () => {
    Notificacion.findOne.mockResolvedValue(null);
    await expect(marcarLeida(1, 7)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('marca la notificación como leída y la guarda', async () => {
    const save = jest.fn().mockResolvedValue();
    Notificacion.findOne.mockResolvedValue({ id_notificacion: 1, leido: false, save });
    const res = await marcarLeida(1, 7);
    expect(res.leido).toBe(true);
    expect(save).toHaveBeenCalled();
  });
});

describe('marcarTodasLeidas', () => {
  beforeEach(() => jest.clearAllMocks());

  it('actualiza todas las no leídas y devuelve el conteo', async () => {
    Notificacion.update.mockResolvedValue([5]);
    const res = await marcarTodasLeidas(7);
    expect(Notificacion.update).toHaveBeenCalledWith(
      { leido: true },
      { where: { id_usuario: 7, leido: false } }
    );
    expect(res).toEqual({ actualizadas: 5 });
  });
});
