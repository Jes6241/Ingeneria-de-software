import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import exifr from 'exifr';
import { haversine, TOLERANCE_METERS } from '../../hooks/useGeolocation';
import styles from './ValidacionEXIF.module.css';

// Ventana temporal válida para la captura de la foto (24 horas).
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Validación EXIF en el cliente (RF04).
 * Verifica GPS, antigüedad (≤24 h) y cercanía al árbol (≤20 m) ANTES de
 * habilitar el envío. La validación definitiva la realiza el backend.
 *
 * @param {{
 *   file: File|null,
 *   targetLat?: number|null,
 *   targetLng?: number|null,
 *   onValidated: (valido: boolean, datos?: object) => void,
 *   onRequestCamera?: () => void
 * }} props
 */
export default function ValidacionEXIF({
  file,
  targetLat = null,
  targetLng = null,
  onValidated,
  onRequestCamera,
}) {
  const [estado, setEstado] = useState('idle'); // idle | validando | ok | error
  const [resumen, setResumen] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const onValidatedRef = useRef(onValidated);
  onValidatedRef.current = onValidated;

  useEffect(() => {
    if (!file) {
      setEstado('idle');
      setResumen(null);
      return;
    }

    let cancelado = false;
    const validar = async () => {
      setEstado('validando');
      setMensaje('Leyendo metadatos…');
      try {
        const data = await exifr.parse(file, { gps: true });
        if (cancelado) return;

        const lat = data?.latitude;
        const lng = data?.longitude;
        const fecha = data?.DateTimeOriginal || data?.CreateDate;

        if (lat == null || lng == null) {
          throw new Error('La foto no contiene coordenadas GPS.');
        }
        if (!fecha) {
          throw new Error('La foto no contiene fecha de captura.');
        }

        const edadMs = Date.now() - new Date(fecha).getTime();
        let distancia = null;
        if (targetLat != null && targetLng != null) {
          distancia = haversine(lat, lng, targetLat, targetLng);
        }

        const resumenDatos = {
          lat,
          lng,
          fecha: new Date(fecha),
          distancia,
        };
        setResumen(resumenDatos);

        if (edadMs > MAX_AGE_MS) {
          throw new Error('La foto tiene más de 24 horas de antigüedad.');
        }
        if (distancia != null && distancia > TOLERANCE_METERS) {
          throw new Error(
            `Estás a ${Math.round(distancia)} m del árbol (máx ${TOLERANCE_METERS} m).`
          );
        }

        setEstado('ok');
        setMensaje('Evidencia aprobada.');
        onValidatedRef.current(true, resumenDatos);
      } catch (err) {
        if (cancelado) return;
        setEstado('error');
        setMensaje(err.message || 'No se pudieron leer los metadatos EXIF.');
        onValidatedRef.current(false);
      }
    };

    validar();
    return () => {
      cancelado = true;
    };
  }, [file, targetLat, targetLng]);

  if (!file) return null;

  const icono =
    estado === 'validando' ? '⏳' : estado === 'ok' ? '✅' : estado === 'error' ? '❌' : '📷';

  return (
    <div
      className={`${styles.box} ${
        estado === 'ok' ? styles.ok : estado === 'error' ? styles.error : ''
      }`}
      role="alert"
    >
      <div className={styles.status}>
        <span className={estado === 'validando' ? styles.spin : ''} aria-hidden="true">
          {icono}
        </span>
        <strong>{mensaje}</strong>
      </div>

      {resumen && (
        <ul className={styles.summary}>
          <li>
            📍 GPS detectado: {resumen.lat.toFixed(5)}, {resumen.lng.toFixed(5)}
          </li>
          <li>📅 Fecha foto: {resumen.fecha.toLocaleString('es-MX')}</li>
          {resumen.distancia != null && (
            <li>📏 Distancia al árbol: {Math.round(resumen.distancia)} metros</li>
          )}
        </ul>
      )}

      {estado === 'error' && onRequestCamera && (
        <button type="button" className="btn btn-outline btn-block" onClick={onRequestCamera}>
          📸 Tomar foto en tiempo real
        </button>
      )}
    </div>
  );
}

ValidacionEXIF.propTypes = {
  file: PropTypes.instanceOf(File),
  targetLat: PropTypes.number,
  targetLng: PropTypes.number,
  onValidated: PropTypes.func.isRequired,
  onRequestCamera: PropTypes.func,
};
