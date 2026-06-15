import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { arbolesAPI, especiesAPI } from '../../services/api';
import { setupLeaflet } from '../../utils/leafletSetup';
import styles from './RegistroArbol.module.css';

setupLeaflet();

// Centro por defecto: ESCOM-IPN, Zacatenco.
const DEFAULT_CENTER = [19.5046, -99.1469];

/** Marcador arrastrable que sincroniza su posición con el formulario. */
function MarcadorArrastrable({ position, onMove }) {
  const markerRef = useRef(null);
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current;
        if (m) {
          const { lat, lng } = m.getLatLng();
          onMove(lat, lng);
        }
      },
    }),
    [onMove]
  );
  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

/** Registro de árbol — solo Administrador (RF01). */
export default function RegistroArbol() {
  const navigate = useNavigate();
  const qrRef = useRef(null);
  const [form, setForm] = useState({
    id_especie: '',
    fecha_plantacion: '',
    altura: '',
    diametro: '',
    edad: '',
    estado_inicial: 'Bueno',
    latitud: DEFAULT_CENTER[0],
    longitud: DEFAULT_CENTER[1],
    ubicacion_descripcion: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [arbolCreado, setArbolCreado] = useState(null);
  // Catálogo de especies para el desplegable (RF10).
  const [especies, setEspecies] = useState([]);
  // UUID de previsualización del QR (el definitivo lo asigna el backend).
  const [previewId, setPreviewId] = useState(() => `GT-${crypto.randomUUID()}`);

  useEffect(() => {
    especiesAPI
      .listar({ activas: true })
      .then((data) => setEspecies(Array.isArray(data) ? data : []))
      .catch(() => setEspecies([]));
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const setCoords = useCallback((lat, lng) => {
    setForm((prev) => ({
      ...prev,
      latitud: Number(lat.toFixed(6)),
      longitud: Number(lng.toFixed(6)),
    }));
  }, []);

  const usarMiUbicacion = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocalización no disponible.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(pos.coords.latitude, pos.coords.longitude);
        toast.success('Ubicación actual aplicada.');
      },
      () => toast.error('No se pudo obtener tu ubicación.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validate = () => {
    const next = {};
    if (!form.fecha_plantacion) next.fecha_plantacion = 'Indica la fecha de plantación';
    if (form.latitud === '' || Number.isNaN(Number(form.latitud)))
      next.latitud = 'Latitud inválida';
    if (form.longitud === '' || Number.isNaN(Number(form.longitud)))
      next.longitud = 'Longitud inválida';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        id_especie: form.id_especie ? Number(form.id_especie) : undefined,
        fecha_plantacion: form.fecha_plantacion,
        latitud: Number(form.latitud),
        longitud: Number(form.longitud),
        ubicacion_descripcion: form.ubicacion_descripcion,
      };
      const arbol = await arbolesAPI.crear(payload);
      setArbolCreado(arbol);
      if (arbol.id_unico) setPreviewId(arbol.id_unico);
      toast.success('Árbol registrado correctamente.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const descargarQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${previewId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const position = [Number(form.latitud), Number(form.longitud)];

  return (
    <div className={`container page ${styles.wrapper}`}>
      <h1>Registrar nuevo árbol</h1>

      <form onSubmit={handleSubmit}>
        {/* Sección 1 — Identificación */}
        <fieldset className={`card ${styles.section}`}>
          <legend className={styles.legend}>1. Identificación</legend>

          <div className="form-group">
            <label className="form-label" htmlFor="previewId">
              ID único (auto-generado)
            </label>
            <div className={styles.idRow}>
              <input
                id="previewId"
                className="form-input"
                value={previewId}
                disabled
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPreviewId(`GT-${crypto.randomUUID()}`)}
                disabled={Boolean(arbolCreado)}
              >
                ↻
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="id_especie">
              Especie
            </label>
            <select
              id="id_especie"
              name="id_especie"
              className="form-input"
              value={form.id_especie}
              onChange={handleChange}
            >
              <option value="">Selecciona una especie (opcional)</option>
              {especies.map((e) => (
                <option key={e.id_especie} value={e.id_especie}>
                  {e.nombre_comun}
                  {e.nombre_cientifico ? ` (${e.nombre_cientifico})` : ''}
                </option>
              ))}
            </select>
            {especies.length === 0 && (
              <span className="form-hint">
                No hay especies registradas. Agrégalas en el catálogo.
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fecha_plantacion">
              Fecha de plantación
            </label>
            <input
              id="fecha_plantacion"
              name="fecha_plantacion"
              type="date"
              className={`form-input ${errors.fecha_plantacion ? 'is-invalid' : ''}`}
              value={form.fecha_plantacion}
              onChange={handleChange}
            />
            {errors.fecha_plantacion && (
              <span className="form-error" role="alert">
                {errors.fecha_plantacion}
              </span>
            )}
          </div>
        </fieldset>

        {/* Sección 2 — Datos físicos */}
        <fieldset className={`card ${styles.section}`}>
          <legend className={styles.legend}>2. Datos físicos</legend>
          <div className={styles.row3}>
            <div className="form-group">
              <label className="form-label" htmlFor="altura">
                Altura (m)
              </label>
              <input
                id="altura"
                name="altura"
                type="number"
                step="0.01"
                className="form-input"
                value={form.altura}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="diametro">
                DAP (cm)
              </label>
              <input
                id="diametro"
                name="diametro"
                type="number"
                step="0.01"
                className="form-input"
                value={form.diametro}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edad">
                Edad (años)
              </label>
              <input
                id="edad"
                name="edad"
                type="number"
                className="form-input"
                value={form.edad}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="estado_inicial">
              Estado de salud inicial
            </label>
            <select
              id="estado_inicial"
              name="estado_inicial"
              className="form-input"
              value={form.estado_inicial}
              onChange={handleChange}
            >
              <option>Bueno</option>
              <option>Regular</option>
              <option>Crítico</option>
            </select>
          </div>
        </fieldset>

        {/* Sección 3 — Ubicación */}
        <fieldset className={`card ${styles.section}`}>
          <legend className={styles.legend}>3. Ubicación</legend>
          <div className={styles.row2}>
            <div className="form-group">
              <label className="form-label" htmlFor="latitud">
                Latitud
              </label>
              <input
                id="latitud"
                name="latitud"
                type="number"
                step="any"
                className={`form-input ${errors.latitud ? 'is-invalid' : ''}`}
                value={form.latitud}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="longitud">
                Longitud
              </label>
              <input
                id="longitud"
                name="longitud"
                type="number"
                step="any"
                className={`form-input ${errors.longitud ? 'is-invalid' : ''}`}
                value={form.longitud}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={usarMiUbicacion}
          >
            📍 Usar mi ubicación actual
          </button>

          <div className={styles.map}>
            <MapContainer
              center={position}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MarcadorArrastrable position={position} onMove={setCoords} />
            </MapContainer>
          </div>
          <p className="form-hint">
            Arrastra el marcador o toca el mapa para ajustar la posición.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="ubicacion_descripcion">
              Descripción de ubicación
            </label>
            <textarea
              id="ubicacion_descripcion"
              name="ubicacion_descripcion"
              className="form-input"
              rows={2}
              value={form.ubicacion_descripcion}
              onChange={handleChange}
              placeholder="Ej. Jardín norte, frente al edificio 1"
            />
          </div>
        </fieldset>

        {/* Sección 4 — QR */}
        <fieldset className={`card ${styles.section}`}>
          <legend className={styles.legend}>4. Código QR</legend>
          <div className={styles.qrBox} ref={qrRef}>
            <QRCodeCanvas value={previewId} size={160} level="M" includeMargin />
          </div>
          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={descargarQR}
          >
            ⬇️ Descargar QR
          </button>
        </fieldset>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading || Boolean(arbolCreado)}
        >
          {loading ? <span className="spinner" /> : 'Registrar árbol'}
        </button>
      </form>

      {arbolCreado && (
        <div className={`card ${styles.success}`} role="status">
          <h3>✅ Árbol registrado</h3>
          <p>
            <strong>ID único:</strong> {arbolCreado.id_unico}
          </p>
          <p>Imprime y coloca el QR descargado en el árbol físico.</p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => navigate('/mapa')}
          >
            Ver en el mapa
          </button>
        </div>
      )}
    </div>
  );
}
