import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import { reportesAPI } from '../../services/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import ValidacionEXIF from './ValidacionEXIF';
import { guardarPendiente, listarPendientes, eliminarPendiente } from '../../utils/offlineQueue';
import styles from './FormularioReporte.module.css';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const PASOS = ['Evidencia', 'Datos', 'Revisión'];

const NIVELES_RIEGO = [
  { value: 'Bajo', label: '💧 Bajo' },
  { value: 'Medio', label: '💧💧 Medio' },
  { value: 'Alto', label: '💧💧💧 Alto' },
];
const COLORACIONES = [
  'Verde intenso',
  'Verde pálido',
  'Amarillo',
  'Café',
  'Sin hojas',
];
const ESTADOS = ['Excelente', 'Bueno', 'Regular', 'Crítico'];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

/** Construye el FormData de un reporte a partir de sus partes. */
function buildFormData({ idAdopcion, blob, fileName, datos }) {
  const fd = new FormData();
  fd.append('foto', blob, fileName);
  fd.append('id_adopcion', String(idAdopcion));
  fd.append('nivel_riego', datos.nivel_riego);
  fd.append('coloracion_hojas', datos.coloracion_hojas);
  fd.append('presencia_plagas', String(datos.presencia_plagas));
  fd.append('detalle_plagas', datos.detalle_plagas || '');
  fd.append('estado_general', datos.estado_general);
  fd.append('observaciones', datos.observaciones || '');
  return fd;
}

/** Formulario de reporte mensual de salud en 3 pasos (RF03/RF04). */
export default function FormularioReporte() {
  const { id } = useParams();
  const idAdopcion = Number(id);
  const navigate = useNavigate();
  const { coords, error: geoError } = useGeolocation();

  const [paso, setPaso] = useState(0);
  const [file, setFile] = useState(null);
  const [compressed, setCompressed] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [exifValido, setExifValido] = useState(false);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const [datos, setDatos] = useState({
    nivel_riego: 'Medio',
    coloracion_hojas: 'Verde intenso',
    presencia_plagas: false,
    detalle_plagas: '',
    severidad: 'Leve',
    estado_general: 'Bueno',
    observaciones: '',
  });

  const setCampo = (campo, valor) =>
    setDatos((prev) => ({ ...prev, [campo]: valor }));

  // --- Sincronización offline ---
  const sincronizar = useCallback(async () => {
    const pendientes = await listarPendientes();
    for (const p of pendientes) {
      try {
        await reportesAPI.enviar(
          buildFormData({
            idAdopcion: p.idAdopcion,
            blob: p.blob,
            fileName: p.fileName,
            datos: p.datos,
          })
        );
        await eliminarPendiente(p.id);
        toast.success('Reporte pendiente sincronizado.');
      } catch {
        // Se mantiene en la cola para el próximo intento.
      }
    }
  }, []);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      sincronizar();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    if (navigator.onLine) sincronizar();
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [sincronizar]);

  // --- Paso 1: selección y compresión de imagen ---
  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error('El archivo supera el límite de 10 MB');
      return;
    }
    setFile(f);
    setExifValido(false);
    setComprimiendo(true);
    try {
      const out = await imageCompression(f, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        preserveExif: true,
      });
      setCompressed(out);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(out));
    } catch {
      toast.error('No se pudo procesar la imagen.');
    } finally {
      setComprimiendo(false);
    }
  };

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const enviar = async () => {
    if (!compressed) return;
    setEnviando(true);
    const entry = {
      idAdopcion,
      blob: compressed,
      fileName: file?.name || 'evidencia.jpg',
      datos,
    };
    try {
      if (!navigator.onLine) {
        await guardarPendiente(entry);
        toast('📡 Sin conexión — el reporte se enviará al recuperar internet.', {
          icon: '💾',
        });
        navigate('/home');
        return;
      }
      await reportesAPI.enviar(buildFormData(entry));
      toast.success('¡Reporte enviado correctamente! 🌱');
      navigate('/home');
    } catch (err) {
      // Si falla la red, se guarda offline como respaldo.
      try {
        await guardarPendiente(entry);
        toast('Guardado offline: se reintentará automáticamente.', { icon: '💾' });
        navigate('/home');
      } catch {
        toast.error(err.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  const severidadSevera = datos.presencia_plagas && datos.severidad === 'Severa';

  return (
    <div className={`container page ${styles.wrapper}`}>
      <h1>Reporte mensual</h1>

      {!online && (
        <div className={styles.offlineBanner} role="status">
          📡 Sin conexión — el reporte se enviará cuando recuperes internet.
        </div>
      )}

      {/* Stepper */}
      <ol className={styles.stepper}>
        {PASOS.map((nombre, i) => (
          <li
            key={nombre}
            className={`${styles.step} ${i === paso ? styles.active : ''} ${
              i < paso ? styles.done : ''
            }`}
          >
            <span className={styles.stepNum}>{i < paso ? '✓' : i + 1}</span>
            {nombre}
          </li>
        ))}
      </ol>

      {/* Paso 1 — Evidencia */}
      {paso === 0 && (
        <section className="card">
          <h2 className={styles.h2}>1. Evidencia fotográfica</h2>
          <label className={styles.dropzone} htmlFor="foto">
            {previewUrl ? (
              <img src={previewUrl} alt="Vista previa de la evidencia" />
            ) : (
              <span>📁 Selecciona una imagen (.jpg/.png, máx 10 MB)</span>
            )}
            <input
              id="foto"
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              onChange={handleFile}
              hidden
            />
          </label>

          {comprimiendo && <p className="form-hint">Comprimiendo imagen…</p>}
          {compressed && !comprimiendo && (
            <p className="form-hint">
              Tamaño final: {formatBytes(compressed.size)}
            </p>
          )}

          {compressed && (
            <ValidacionEXIF
              file={compressed}
              targetLat={coords?.lat}
              targetLng={coords?.lng}
              onValidated={setExifValido}
              onRequestCamera={() => document.getElementById('foto')?.click()}
            />
          )}

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!exifValido}
            onClick={() => setPaso(1)}
          >
            Siguiente
          </button>
        </section>
      )}

      {/* Paso 2 — Datos */}
      {paso === 1 && (
        <section className="card">
          <h2 className={styles.h2}>2. Datos del reporte</h2>

          <div className="form-group">
            <span className="form-label">Nivel de riego</span>
            <div className={styles.radioRow}>
              {NIVELES_RIEGO.map((n) => (
                <label key={n.value} className={styles.radioChip}>
                  <input
                    type="radio"
                    name="nivel_riego"
                    value={n.value}
                    checked={datos.nivel_riego === n.value}
                    onChange={(e) => setCampo('nivel_riego', e.target.value)}
                  />
                  {n.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="coloracion">
              Coloración de hojas
            </label>
            <select
              id="coloracion"
              className="form-input"
              value={datos.coloracion_hojas}
              onChange={(e) => setCampo('coloracion_hojas', e.target.value)}
            >
              {COLORACIONES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <span className="form-label">Presencia de plagas</span>
            <div className={styles.toggle}>
              <button
                type="button"
                className={!datos.presencia_plagas ? styles.toggleOn : ''}
                onClick={() => setCampo('presencia_plagas', false)}
              >
                No
              </button>
              <button
                type="button"
                className={datos.presencia_plagas ? styles.toggleOn : ''}
                onClick={() => setCampo('presencia_plagas', true)}
              >
                Sí
              </button>
            </div>
          </div>

          {datos.presencia_plagas && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="detalle">
                  Describe el problema
                </label>
                <textarea
                  id="detalle"
                  className="form-input"
                  rows={2}
                  value={datos.detalle_plagas}
                  onChange={(e) => setCampo('detalle_plagas', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="severidad">
                  Severidad
                </label>
                <select
                  id="severidad"
                  className="form-input"
                  value={datos.severidad}
                  onChange={(e) => setCampo('severidad', e.target.value)}
                >
                  <option>Leve</option>
                  <option>Moderada</option>
                  <option>Severa</option>
                </select>
              </div>
              {severidadSevera && (
                <div className={styles.warnBanner} role="alert">
                  ⚠️ Se notificará al administrador automáticamente.
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <span className="form-label">Estado general</span>
            <div className={styles.radioRow}>
              {ESTADOS.map((s) => (
                <label key={s} className={styles.radioChip}>
                  <input
                    type="radio"
                    name="estado_general"
                    value={s}
                    checked={datos.estado_general === s}
                    onChange={(e) => setCampo('estado_general', e.target.value)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="obs">
              Observaciones ({datos.observaciones.length}/500)
            </label>
            <textarea
              id="obs"
              className="form-input"
              rows={3}
              maxLength={500}
              value={datos.observaciones}
              onChange={(e) => setCampo('observaciones', e.target.value)}
            />
          </div>

          <div className={styles.geoBadge}>
            {coords ? (
              <span className="badge badge-success">📍 Ubicación verificada</span>
            ) : geoError ? (
              <span className="badge badge-warning">
                ⚠️ {geoError} — pendiente revisión manual
              </span>
            ) : (
              <span className="badge badge-neutral">📍 Obteniendo ubicación…</span>
            )}
          </div>

          <div className={styles.navBtns}>
            <button type="button" className="btn btn-outline" onClick={() => setPaso(0)}>
              Atrás
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setPaso(2)}>
              Siguiente
            </button>
          </div>
        </section>
      )}

      {/* Paso 3 — Revisión */}
      {paso === 2 && (
        <section className="card">
          <h2 className={styles.h2}>3. Revisión y envío</h2>
          {previewUrl && (
            <img src={previewUrl} alt="Evidencia" className={styles.reviewImg} />
          )}
          <dl className={styles.review}>
            <div>
              <dt>Nivel de riego</dt>
              <dd>{datos.nivel_riego}</dd>
            </div>
            <div>
              <dt>Coloración de hojas</dt>
              <dd>{datos.coloracion_hojas}</dd>
            </div>
            <div>
              <dt>Plagas</dt>
              <dd>
                {datos.presencia_plagas
                  ? `Sí (${datos.severidad})`
                  : 'No'}
              </dd>
            </div>
            <div>
              <dt>Estado general</dt>
              <dd>{datos.estado_general}</dd>
            </div>
            <div>
              <dt>Observaciones</dt>
              <dd>{datos.observaciones || '—'}</dd>
            </div>
          </dl>

          <div className={styles.navBtns}>
            <button type="button" className="btn btn-outline" onClick={() => setPaso(1)}>
              Atrás
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={enviar}
              disabled={enviando}
            >
              {enviando ? <span className="spinner" /> : 'Enviar reporte'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
