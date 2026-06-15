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
  // Indica que la cámara no pudo iniciarse (se usa el respaldo manual).
  const [camaraError, setCamaraError] = useState(false);
  // Código introducido manualmente como respaldo.
  const [codigoManual, setCodigoManual] = useState('');
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
      const estado =
        typeof scanner.getState === 'function' ? scanner.getState() : null;
      // Solo se puede detener si está escaneando (2) o en pausa (3).
      if (estado === 2 || estado === 3) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // Already stopped or not yet started — ignore.
    }
  };

  /** Valida distancia GPS y crea la adopción. Retorna true si tuvo éxito. */
  const adoptarConGeo = async (idUnico) => {
    setProcesando(true);
    try {
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
        setProcesando(false);
        return false;
      }

      const adopcion = await adopcionesAPI.adoptar(idUnico);
      toast.success('¡Árbol adoptado! 🌱');
      navigate(`/dashboard/${adopcion.id_arbol}`);
      return true;
    } catch (err) {
      if (err?.code === 1) {
        // GeolocationPositionError.PERMISSION_DENIED
        toast.error('❌ Geolocalización requerida para adoptar.');
      } else if (err?.status === 404) {
        toast.error('Árbol no encontrado.');
      } else {
        toast.error(err?.message || 'Error al procesar la adopción.');
      }
      setProcesando(false);
      return false;
    }
  };

  /** Adopta usando el código escrito a mano. */
  const adoptarManual = async (e) => {
    e.preventDefault();
    const match = codigoManual.match(UUID_RE);
    if (!match) {
      toast.error('El código no es válido. Revisa e inténtalo de nuevo.');
      return;
    }
    await detenerScanner();
    handledRef.current = true;
    const ok = await adoptarConGeo(match[0]);
    if (!ok) handledRef.current = false;
  };

  useEffect(() => {
    let activo = true;
    handledRef.current = false;
    setScannerReady(false);
    setPermisoDenegado(false);
    setCamaraError(false);

    // El acceso a la cámara requiere un contexto seguro (HTTPS o localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamaraError(true);
      return undefined;
    }

    let html5QrCode;
    try {
      html5QrCode = new Html5Qrcode(QR_REGION_ID);
    } catch {
      // El nodo del lector no está disponible: usar respaldo manual.
      setCamaraError(true);
      return undefined;
    }
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

      const ok = await adoptarConGeo(match[0]);
      if (!ok) {
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
          setCamaraError(true);
          toast.error('No se pudo acceder a la cámara. Usa el código manual.');
        }
      });

    // Cleanup: detener el scanner de forma silenciosa al desmontar.
    // En StrictMode el efecto se monta dos veces; stop() lanza una excepción
    // SÍNCRONA si el scanner aún no está escaneando, por eso se protege todo
    // con try/catch y se comprueba el estado antes de detener.
    return () => {
      activo = false;
      const scanner = scannerRef.current;
      if (!scanner) return;
      try {
        const estado =
          typeof scanner.getState === 'function' ? scanner.getState() : null;
        if (estado === 2 || estado === 3) {
          scanner
            .stop()
            .then(() => {
              try { scanner.clear(); } catch { /* ignorar */ }
            })
            .catch(() => {});
        } else {
          try { scanner.clear(); } catch { /* ignorar */ }
        }
      } catch {
        /* ignorar */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {!camaraError && (
          <div className={styles.reader} style={{ position: 'relative' }}>
            <div id={QR_REGION_ID} className={styles.region} />

            {/* Marco guía visible mientras la cámara está activa */}
            {scannerReady && !procesando && <div className={styles.frame} />}

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
        )}

        {/* Aviso si la cámara no está disponible */}
        {camaraError && (
          <div className="card" role="alert">
            <p style={{ margin: 0 }}>
              📷 No se pudo abrir la cámara en este dispositivo o navegador.
              Introduce el código del árbol manualmente más abajo.
            </p>
          </div>
        )}

        {geoCoords && !procesando && (
          <div
            className="card"
            style={{ background: '#e8f5e9', border: '2px solid #4caf50', padding: 12 }}
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
            style={{ background: '#fff3e0', border: '2px solid #ff9800', padding: 12 }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#e65100' }}>
              ⚠️ Geolocalización no disponible aún. Se solicitará al escanear.
            </p>
          </div>
        )}

        {/* Respaldo manual: introducir el código del árbol */}
        <div className={styles.divider}>— o introduce el código manualmente —</div>
        <form className={styles.manual} onSubmit={adoptarManual}>
          <p className={styles.manualHint}>
            Escribe o pega el identificador del árbol (por ejemplo,
            <code> GT-xxxxxxxx-...</code>) que aparece junto al código QR.
          </p>
          <input
            type="text"
            className="form-input"
            placeholder="GT-0000..."
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value)}
            disabled={procesando}
          />
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={procesando || !codigoManual.trim()}
          >
            Adoptar con este código
          </button>
        </form>

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
