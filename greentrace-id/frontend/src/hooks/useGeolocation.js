import { useState, useCallback, useEffect, useRef } from 'react';

// Radio de tolerancia de geolocalización (metros) — RF08.
export const TOLERANCE_METERS = 20;
// Número máximo de reintentos antes de modo manual — RF08.
export const MAX_RETRIES = 3;

/**
 * Calcula la distancia en metros entre dos coordenadas (Haversine).
 */
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Hook de geolocalización del navegador (RF08).
 *
 * Realiza hasta 3 intentos automáticos. Si todos fallan, expone un error de
 * "Validación manual requerida". Devuelve { coords, error, loading, retry }.
 *
 * @param {{ auto?: boolean }} [options] - auto: inicia la captura al montar.
 */
export function useGeolocation({ auto = true } = {}) {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const attemptsRef = useRef(0);

  const attempt = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('La geolocalización no está disponible en este dispositivo.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        attemptsRef.current = 0;
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      () => {
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_RETRIES) {
          setLoading(false);
          setError('Validación manual requerida');
        } else {
          // Reintento automático.
          attempt();
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  /** Reinicia el contador y vuelve a intentar la geolocalización. */
  const retry = useCallback(() => {
    attemptsRef.current = 0;
    setCoords(null);
    attempt();
  }, [attempt]);

  useEffect(() => {
    if (auto) attempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coords, error, loading, retry };
}
