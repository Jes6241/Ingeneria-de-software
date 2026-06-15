'use strict';

/**
 * Pruebas unitarias del servicio de cálculo de CO₂ (RF05).
 *
 * Se prueban las funciones puras `computeCO2` y `calcularEdadMeses`, que no
 * dependen de la base de datos. La capa de modelos se mockea porque el módulo
 * la importa al cargarse.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

// Mock mínimo de modelos: estas funciones puras no los usan.
jest.mock('../src/models', () => ({
  Arbol: {},
  EcuacionAlometrica: {},
  ImpactoAmbiental: {},
}));

const {
  computeCO2,
  calcularEdadMeses,
  CO2_TO_CARBON_RATIO,
  DEFAULT_CARBON_FRACTION,
} = require('../src/services/co2.service');

describe('calcularEdadMeses', () => {
  it('devuelve 1 cuando no hay fecha de plantación', () => {
    expect(calcularEdadMeses(null)).toBe(1);
    expect(calcularEdadMeses(undefined)).toBe(1);
  });

  it('devuelve al menos 1 para una fecha futura', () => {
    const futura = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60); // +60 días
    expect(calcularEdadMeses(futura)).toBe(1);
  });

  it('calcula ~12 meses para una fecha de hace un año', () => {
    const haceUnAnio = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365);
    const meses = calcularEdadMeses(haceUnAnio);
    expect(meses).toBeGreaterThanOrEqual(11);
    expect(meses).toBeLessThanOrEqual(13);
  });
});

describe('computeCO2', () => {
  it('lanza error (422) si la edad no es válida', () => {
    expect(() => computeCO2(0, null)).toThrow();
    try {
      computeCO2(0, null);
    } catch (err) {
      expect(err.statusCode).toBe(422);
    }
  });

  it('devuelve biomasa y co2 positivos con la ecuación por defecto', () => {
    const { biomasa, co2 } = computeCO2(12, null);
    expect(biomasa).toBeGreaterThan(0);
    expect(co2).toBeGreaterThan(0);
  });

  it('redondea los resultados a 3 decimales', () => {
    const { biomasa, co2 } = computeCO2(12, null);
    const decimales = (n) => (String(n).split('.')[1] || '').length;
    expect(decimales(biomasa)).toBeLessThanOrEqual(3);
    expect(decimales(co2)).toBeLessThanOrEqual(3);
  });

  it('el CO₂ crece de forma monótona con la edad', () => {
    const joven = computeCO2(6, null);
    const adulto = computeCO2(24, null);
    expect(adulto.co2).toBeGreaterThan(joven.co2);
    expect(adulto.biomasa).toBeGreaterThan(joven.biomasa);
  });

  it('respeta los coeficientes de la ecuación alométrica recibida', () => {
    const ecuacion = { coef_a: 0.1, coef_b: 2, id_ecuacion: 1 };
    const { biomasa } = computeCO2(10, ecuacion);
    // biomasa = 0.1 * 10^2 = 10
    expect(biomasa).toBeCloseTo(10, 3);
  });

  it('aplica la relación CO₂/carbono sobre la biomasa', () => {
    const { biomasa, co2 } = computeCO2(18, null);
    const esperado = Number(
      (biomasa * DEFAULT_CARBON_FRACTION * CO2_TO_CARBON_RATIO).toFixed(3)
    );
    expect(co2).toBeCloseTo(esperado, 2);
  });
});
