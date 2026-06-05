import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adopcionesAPI } from '../../services/api';
import Loader from '../shared/Loader';
import styles from './EscanerQR.module.css';

const QR_REGION_ID = 'qr-reader';
// Acepta UUID con o sin prefijo "GT-".
const UUID_RE =
  /(GT-)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

/**
 * Escáner de código QR para adoptar un árbol (RF02).
 * Lee el id_unico codificado en el QR y crea la adopción.
 *
 * El nodo del lector (id="qr-reader") nunca se desmonta condicionalmente:
 * html5-qrcode inserta DOM fuera de React, por lo que ocultarlo con
 * `visibility` evita que React pierda el nodo y deje la pantalla en blanco.
 */
export default function EscanerQR() {
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const navigate = useNavigate();
  const [scannerReady, setScannerReady] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  // Se incrementa para volver a arrancar la cámara (reintentos).
  const [intento, setIntento] = useState(0);

  /** Detiene y limpia el scanner de forma silenciosa. */
  const detenerScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      // Ya estaba detenido o aún no había arrancado: ignorar.
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
      const idUnico = match[0];

      // 1) Detener el scanner ANTES de tocar el estado o navegar.
      await detenerScanner();
      toast.success('QR detectado');
      setProcesando(true);

      // 2) Crear la adopción y navegar al dashboard del árbol.
      try {
        const adopcion = await adopcionesAPI.adoptar(idUnico);
        toast.success('¡Árbol adoptado! 🌱');
        navigate(`/dashboard/${adopcion.id_arbol}`);
      } catch (err) {
        if (err.status === 404) {
          toast.error('Árbol no encontrado');
        } else {
          // 409 (ya adoptado) y demás: mensaje del backend.
          toast.error(err.message);
        }
        setProcesando(false);
        handledRef.current = false;
        // Reintentar el escaneo arrancando de nuevo la cámara.
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

    // Cleanup: detener el scanner de forma silenciosa al desmontar.
    return () => {
      activo = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current.clear();
          })
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  const cancelar = async () => {
    await detenerScanner();
    navigate('/home');
  };

  const reintentarPermiso = () => {
    setPermisoDenegado(false);
    setIntento((n) => n + 1);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <div className={`container page ${styles.wrapper}`}>
        <h1 className={styles.title}>Escanear código QR del árbol</h1>
        <p className={styles.hint}>
          Apunta la cámara al código QR físico del árbol.
        </p>

        {/* Permiso de cámara denegado */}
        {permisoDenegado && (
          <div className="card" role="alert" style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16 }}>
              ❌ Permiso de cámara denegado. Actívalo en la configuración del
              navegador.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={reintentarPermiso}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Visor — el nodo del lector permanece SIEMPRE montado */}
        <div className={styles.reader} style={{ position: 'relative' }}>
          <div
            id={QR_REGION_ID}
            className={styles.region}
            style={{
              visibility: scannerReady && !procesando ? 'visible' : 'hidden',
            }}
          />

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
