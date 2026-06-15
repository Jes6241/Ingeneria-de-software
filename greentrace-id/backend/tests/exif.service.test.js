'use strict';

/**
 * Pruebas unitarias del servicio de validación EXIF (RF04).
 *
 * `haversineDistance` se prueba como función pura. Para `validateExif` se
 * mockea la librería `exifr` y así controlar los metadatos devueltos.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

jest.mock('exifr', () => ({
  parse: jest.fn(),
}));

const exifr = require('exifr');
const {
  validateExif,
  haversineDistance,
  MAX_DISTANCE_METERS,
} = require('../src/services/exif.service');

// Árbol de referencia (ESCOM-IPN, Zacatenco).
const ARBOL = { latitud: 19.5046, longitud: -99.1469 };

describe('haversineDistance', () => {
  it('devuelve 0 entre dos coordenadas idénticas', () => {
    const d = haversineDistance(19.5046, -99.1469, 19.5046, -99.1469);
    expect(d).toBeCloseTo(0, 5);
  });

  it('calcula una distancia simétrica', () => {
    const a = haversineDistance(19.5046, -99.1469, 19.5051, -99.1465);
    const b = haversineDistance(19.5051, -99.1465, 19.5046, -99.1469);
    expect(a).toBeCloseTo(b, 6);
  });

  it('aproxima ~111 km por grado de latitud', () => {
    const d = haversineDistance(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });
});

describe('validateExif', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza una foto sin datos de GPS', async () => {
    exifr.parse.mockResolvedValue({ DateTimeOriginal: new Date() });
    const res = await validateExif(Buffer.from('x'), ARBOL);
    expect(res.valido).toBe(false);
    expect(res.motivo).toMatch(/GPS/i);
  });

  it('rechaza una foto sin fecha de captura', async () => {
    exifr.parse.mockResolvedValue({
      latitude: ARBOL.latitud,
      longitude: ARBOL.longitud,
    });
    const res = await validateExif(Buffer.from('x'), ARBOL);
    expect(res.valido).toBe(false);
    expect(res.motivo).toMatch(/fecha/i);
  });

  it('rechaza una foto demasiado antigua', async () => {
    const vieja = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // 30 días
    exifr.parse.mockResolvedValue({
      latitude: ARBOL.latitud,
      longitude: ARBOL.longitud,
      DateTimeOriginal: vieja,
    });
    const res = await validateExif(Buffer.from('x'), ARBOL);
    expect(res.valido).toBe(false);
    expect(res.motivo).toMatch(/reciente|inv[áa]lida/i);
  });

  it('rechaza una foto tomada lejos del árbol', async () => {
    exifr.parse.mockResolvedValue({
      latitude: 19.4326, // Centro de CDMX, a varios km
      longitude: -99.1332,
      DateTimeOriginal: new Date(),
    });
    const res = await validateExif(Buffer.from('x'), ARBOL);
    expect(res.valido).toBe(false);
    expect(res.motivo).toMatch(/m del árbol/i);
  });

  it('acepta una foto reciente, con GPS y cerca del árbol', async () => {
    exifr.parse.mockResolvedValue({
      latitude: ARBOL.latitud,
      longitude: ARBOL.longitud,
      DateTimeOriginal: new Date(),
    });
    const res = await validateExif(Buffer.from('x'), ARBOL);
    expect(res.valido).toBe(true);
    expect(res.gps).toEqual({ lat: ARBOL.latitud, lng: ARBOL.longitud });
  });

  it('devuelve un motivo si no se pueden leer los metadatos', async () => {
    exifr.parse.mockRejectedValue(new Error('corrupto'));
    const res = await validateExif(Buffer.from('x'), ARBOL);
    expect(res.valido).toBe(false);
    expect(res.motivo).toMatch(/EXIF/i);
  });

  it('expone un radio máximo configurado de 20 m', () => {
    expect(MAX_DISTANCE_METERS).toBe(20);
  });
});
