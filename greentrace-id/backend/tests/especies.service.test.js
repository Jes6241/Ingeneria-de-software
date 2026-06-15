'use strict';

/**
 * Pruebas unitarias del servicio del catálogo de especies (RF10).
 * La capa de modelos se mockea para validar la lógica de negocio sin BD.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

jest.mock('../src/models', () => ({
  Especie: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
}));

const { Especie } = require('../src/models');
const {
  listEspecies,
  createEspecie,
  NECESIDAD_RIEGO,
  EXPOSICION_SOLAR,
} = require('../src/services/especies.service');

describe('listEspecies', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lista todas las especies ordenadas por nombre común', async () => {
    Especie.findAll.mockResolvedValue([{ nombre_comun: 'Jacaranda' }]);
    const res = await listEspecies();
    expect(Especie.findAll).toHaveBeenCalledWith({
      where: undefined,
      order: [['nombre_comun', 'ASC']],
    });
    expect(res).toHaveLength(1);
  });

  it('filtra solo las activas cuando se solicita', async () => {
    Especie.findAll.mockResolvedValue([]);
    await listEspecies({ soloActivas: true });
    expect(Especie.findAll).toHaveBeenCalledWith({
      where: { activa: true },
      order: [['nombre_comun', 'ASC']],
    });
  });
});

describe('createEspecie', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rechaza una especie sin nombre común', async () => {
    await expect(createEspecie({ nombre_comun: '  ' })).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(Especie.create).not.toHaveBeenCalled();
  });

  it('rechaza una necesidad de riego inválida', async () => {
    await expect(
      createEspecie({ nombre_comun: 'Pino', necesidad_riego: 'MODERADA' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rechaza una exposición solar inválida', async () => {
    await expect(
      createEspecie({ nombre_comun: 'Pino', exposicion_solar: 'PLENO SOL' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('crea la especie con valores válidos y activa por defecto', async () => {
    Especie.create.mockImplementation((data) => Promise.resolve({ id_especie: 1, ...data }));
    const res = await createEspecie({
      nombre_comun: '  Jacaranda  ',
      nombre_cientifico: '  Jacaranda mimosifolia ',
      necesidad_riego: 'MEDIA',
      exposicion_solar: 'PLENO_SOL',
      descripcion: 'Árbol ornamental',
    });

    expect(Especie.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_comun: 'Jacaranda',
        nombre_cientifico: 'Jacaranda mimosifolia',
        necesidad_riego: 'MEDIA',
        exposicion_solar: 'PLENO_SOL',
        activa: true,
      })
    );
    expect(res.id_especie).toBe(1);
  });

  it('permite campos opcionales nulos', async () => {
    Especie.create.mockResolvedValue({ id_especie: 2 });
    await createEspecie({ nombre_comun: 'Encino' });
    expect(Especie.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre_comun: 'Encino',
        nombre_cientifico: null,
        necesidad_riego: null,
        exposicion_solar: null,
      })
    );
  });

  it('expone los valores admitidos por la base de datos', () => {
    expect(NECESIDAD_RIEGO).toEqual(['BAJA', 'MEDIA', 'ALTA']);
    expect(EXPOSICION_SOLAR).toEqual(['SOMBRA', 'PARCIAL', 'PLENO_SOL']);
  });
});
