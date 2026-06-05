import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import toast from 'react-hot-toast';
import { dashboardAPI, adopcionesAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../constants/roles';
import { setupLeaflet } from '../utils/leafletSetup';
import Loader from '../components/shared/Loader';
import ArbolPlaceholder from '../components/shared/ArbolPlaceholder';
import SvgBarChart from '../components/shared/SvgBarChart';
import styles from './DetalleArbol.module.css';

setupLeaflet();

const TABS = ['Información', 'Historial', 'Impacto CO₂'];

const ESTADO_BADGE = {
  Bueno: 'badge-success',
  Excelente: 'badge-success',
  Regular: 'badge-warning',
  'Crítico': 'badge-danger',
};

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Detalle de un árbol con pestañas (Información / Historial / Impacto). */
export default function DetalleArbol() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isEstudiante = hasRole(ROLES.ESTUDIANTE);
  const isAdmin = hasRole(ROLES.ADMIN);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [visibles, setVisibles] = useState(10);
  const [adoptando, setAdoptando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.obtener(id);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copiarId = async () => {
    try {
      await navigator.clipboard.writeText(data.arbol.id_unico);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error('No se pudo copiar.');
    }
  };

  const adoptar = async () => {
    setAdoptando(true);
    try {
      const adopcion = await adopcionesAPI.adoptar(data.arbol.id_unico);
      toast.success('¡Árbol adoptado exitosamente! 🌱');
      navigate(`/dashboard/${adopcion.id_arbol}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdoptando(false);
    }
  };

  if (loading) return <Loader fullscreen mensaje="Cargando árbol…" />;

  if (error) {
    return (
      <div className="container page">
        <div className="card" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-outline" onClick={cargar}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { arbol, impacto, galeria = [], evolucion_salud = [] } = data;
  const ultimaFoto = galeria[0]?.url;
  // Sin campo de estado fiable, se asume disponible salvo que el backend lo indique.
  const disponible = arbol.estado ? arbol.estado === 'Disponible' : true;
  const tieneCoords = arbol.latitud != null && arbol.longitud != null;
  const position = tieneCoords
    ? [Number(arbol.latitud), Number(arbol.longitud)]
    : null;

  const serieImpacto = evolucion_salud.slice(-6).map((e, i) => ({
    label: new Date(e.fecha).toLocaleDateString('es-MX', { month: 'short' }),
    value: impacto?.captura_co2
      ? Number(((impacto.captura_co2 / evolucion_salud.length) * (i + 1)).toFixed(1))
      : 0,
  }));

  return (
    <div className="container page">
      <header className={styles.header}>
        <h1>{arbol.especie || arbol.id_unico}</h1>
        <span className="badge badge-info">🌳 Árbol</span>
      </header>

      {/* Foto principal */}
      <div className={styles.hero}>
        {ultimaFoto ? (
          <img src={ultimaFoto} alt="Última evidencia del árbol" />
        ) : (
          <ArbolPlaceholder size={120} />
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === i}
            className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Información */}
      {tab === 0 && (
        <section className="card">
          <dl className={styles.info}>
            <div>
              <dt>ID único</dt>
              <dd className={styles.idValue}>
                <code>{arbol.id_unico}</code>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={copiarId}
                  aria-label="Copiar ID"
                >
                  {copiado ? '✓' : '📋'}
                </button>
              </dd>
            </div>
            <div>
              <dt>Especie</dt>
              <dd>{arbol.especie || '—'}</dd>
            </div>
            <div>
              <dt>Fecha de plantación</dt>
              <dd>{formatFecha(arbol.fecha_plantacion)}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{arbol.ubicacion || '—'}</dd>
            </div>
            <div>
              <dt>Coordenadas</dt>
              <dd>
                {tieneCoords
                  ? `${Number(arbol.latitud).toFixed(5)}, ${Number(arbol.longitud).toFixed(5)}`
                  : '—'}
              </dd>
            </div>
          </dl>

          {position && (
            <div className={styles.miniMap}>
              <MapContainer
                center={position}
                zoom={16}
                dragging={false}
                zoomControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution="© OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position} />
              </MapContainer>
            </div>
          )}

          {/* Adoptar: solo ESTUDIANTE y si el árbol está disponible. */}
          {isEstudiante && disponible && (
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={adoptar}
              disabled={adoptando}
            >
              {adoptando ? <span className="spinner" /> : '🌱 Adoptar este árbol'}
            </button>
          )}

          {/* El administrador solo ve un indicador informativo. */}
          {isAdmin && disponible && (
            <div
              className="badge badge-info"
              style={{ display: 'block', textAlign: 'center', padding: '10px' }}
            >
              🔓 Disponible para adopción
            </div>
          )}
        </section>
      )}

      {/* Tab Historial */}
      {tab === 1 && (
        <section className="card">
          {evolucion_salud.length === 0 ? (
            <p className={styles.empty}>Sin reportes registrados.</p>
          ) : (
            <>
              <ul className={styles.timeline}>
                {[...evolucion_salud]
                  .reverse()
                  .slice(0, visibles)
                  .map((e, i) => (
                    <li key={i} className={styles.timelineItem}>
                      <span className={`badge ${ESTADO_BADGE[e.estado] || 'badge-neutral'}`}>
                        {e.estado}
                      </span>
                      <span className={styles.muted}>{formatFecha(e.fecha)}</span>
                    </li>
                  ))}
              </ul>
              {visibles < evolucion_salud.length && (
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  onClick={() => setVisibles((v) => v + 10)}
                >
                  Cargar más
                </button>
              )}
            </>
          )}
        </section>
      )}

      {/* Tab Impacto CO₂ */}
      {tab === 2 && (
        <section className="card">
          <div className={styles.impactKpis}>
            <div>
              <strong>{impacto?.captura_co2 ?? '—'}</strong>
              <span>kg CO₂ total</span>
            </div>
            <div>
              <strong>{impacto?.biomasa ?? '—'}</strong>
              <span>kg biomasa</span>
            </div>
          </div>
          <h3 className={styles.h3}>Evolución mensual de CO₂</h3>
          {serieImpacto.length >= 1 && impacto?.captura_co2 ? (
            <SvgBarChart data={serieImpacto} />
          ) : (
            <p className={styles.empty}>
              Aún no hay datos de impacto suficientes.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
