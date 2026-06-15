import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adopcionesAPI, arbolesAPI } from '../../services/api';
import { haversine, TOLERANCE_METERS, useGeolocation } from '../../hooks/useGeolocation';
import Loader from '../shared/Loader';
import styles from './EscanerQR.module.css';

const QR_REGION_ID = 'qr-reader';
const UUID_RE =
  /(GT-)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export default function EscanerQR() {
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const navigate = useNavigate();

  const [scannerReady, setScannerReady] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [intento, setIntento] = useState(0);

  // Geolocation requested at mount so it's ready when the QR is scanned.
  // Stored in a ref so the async onScanSuccess callback always reads the
  // latest value without depending on React state (avoids stale closure).
  const { coords: geoCoords, error: geoError } = useGeolocation({ auto: true });
  const geoCoordsRef = useRef(null);
  useEffect(() => {
    geoCoordsRef.current = geoCoords;
  }, [geoCoords]);

  const detenerScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      // Already stopped or not yet started — ignore.
    }
  };

  useEffect(() => {
    let activo = true;
    handledRef.current = false;
    setScannerReady(false);
    setPermisoDenegado(false);

    const html5QrCode = new Html5Qrcode(QR_REGION_ID);
    scannerRef.current = html5QrCode;

    const onScanSuccess = async (decodedText) => {
      if (handledRef.current) return;
      const match = decodedText.match(UUID_RE);
      if (!match) {
        toast.error('Código QR no válido.');
        return;
      }
      handledRef.current = true;
      await detenerScanner();
      toast.success('QR detectado');
      setProcesando(true);

      const idUnico = match[0];

      try {
        // Use cached coords or request fresh ones if not yet available.
        let coords = geoCoordsRef.current;
        if (!coords) {
          coords = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              reject,
              { enableHighAccuracy: true, timeout: 10000 }
            );
          });
          geoCoordsRef.current = coords;
        }

        const arbol = await arbolesAPI.obtenerPorQR(idUnico);
        const distancia = haversine(
          coords.lat,
          coords.lng,
          arbol.latitud,
          arbol.longitud
        );

        if (distancia > TOLERANCE_METERS) {
          toast.error(
            `📍 Estás demasiado lejos (${distancia.toFixed(1)}m). Acércate a ≤${TOLERANCE_METERS}m.`
          );
          handledRef.current = false;
          setIntento((n) => n + 1);
          return;
        }

        const adopcion = await adopcionesAPI.adoptar(idUnico);
        toast.success('¡Árbol adoptado! 🌱');
        navigate(`/dashboard/${adopcion.id_arbol}`);
      } catch (err) {
        if (err?.code === 1) {
          // GeolocationPositionError.PERMISSION_DENIED
          toast.error('❌ Geolocalización requerida para adoptar.');
        } else if (err?.status === 404) {
          toast.error('Árbol no encontrado.');
        } else {
          toast.error(err?.message || 'Error al procesar la adopción.');
        }
        handledRef.current = false;
        setIntento((n) => n + 1);
      }
    };

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      )
      .then(() => {
        if (activo) setScannerReady(true);
      })
      .catch((err) => {
        if (!activo) return;
        const msg = String(err?.message || err).toLowerCase();
        if (
          msg.includes('permission') ||
          msg.includes('denied') ||
          msg.includes('notallowed')
        ) {
          setPermisoDenegado(true);
        } else {
          toast.error('No se pudo acceder a la cámara.');
        }
      });

    return () => {
      activo = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [intento]);

  const cancelar = async () => {
    await detenerScanner();
    navigate('/home');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <div className={`container page ${styles.wrapper}`}>
        <h1 className={styles.title}>Escanear código QR del árbol</h1>
        <p className={styles.hint}>
          Apunta la cámara al código QR físico del árbol.
        </p>

        {permisoDenegado && (
          <div className="card" role="alert" style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16 }}>
              ❌ Permiso de cámara denegado. Actívalo en la configuración del
              navegador.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setPermisoDenegado(false);
                setIntento((n) => n + 1);
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Scanner container — always visible so html5-qrcode renders the
            video correctly. Overlays sit on top while loading/processing. */}
        <div className={styles.reader} style={{ position: 'relative' }}>
          <div id={QR_REGION_ID} className={styles.region} />

          {!scannerReady && !permisoDenegado && (
            <div className={styles.overlay}>
              <Loader size="md" mensaje="Iniciando cámara…" />
            </div>
          )}

          {procesando && (
            <div className={styles.overlay}>
              <Loader size="md" mensaje="Adoptando árbol…" />
            </div>
          )}
        </div>

        {geoCoords && !procesando && (
          <div
            className="card"
            style={{
              background: '#e8f5e9',
              border: '2px solid #4caf50',
              padding: 12,
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2e7d32' }}>
              📍 Ubicación detectada. Escanea el QR del árbol para validar la
              distancia.
            </p>
          </div>
        )}

        {geoError && !geoCoords && !procesando && (
          <div
            className="card"
            style={{
              background: '#fff3e0',
              border: '2px solid #ff9800',
              padding: 12,
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#e65100' }}>
              ⚠️ Geolocalización no disponible aún. Se solicitará al escanear.
            </p>
          </div>
        )}

        <button
          type="button"
          className="btn btn-outline btn-block"
          onClick={cancelar}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
