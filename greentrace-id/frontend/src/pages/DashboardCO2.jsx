import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardAPI, adopcionesAPI } from '../services/api';
import Loader from '../components/shared/Loader';
import SvgLineChart from '../components/shared/SvgLineChart';
import styles from './DashboardCO2.module.css';

const ESTADO_BADGE = {
  Excelente: 'badge-success',
  Bueno: 'badge-success',
  Regular: 'badge-warning',
  'Crítico': 'badge-danger',
  Critico: 'badge-danger',
};

function formatFechaLarga(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Dashboard de impacto de CO₂ de un árbol adoptado (RF05). */
export default function DashboardCO2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibles, setVisibles] = useState(9);
  const [modal, setModal] = useState(null);
  const [idAdopcion, setIdAdopcion] = useState(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.obtener(id);
      setData(res);
      // Busca la adopción del usuario para este árbol (para crear reportes).
      try {
        const adopciones = await adopcionesAPI.misAdopciones();
        const propia = (adopciones || []).find(
          (a) => String(a.id_arbol) === String(id)
        );
        if (propia) setIdAdopcion(propia.id_adopcion);
      } catch {
        /* la adopción es opcional para visualizar el dashboard */
      }
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

  if (loading) return <Loader fullscreen mensaje="Cargando dashboard…" />;

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

  // Serie de CO₂: a falta de histórico mensual del backend, se grafica la
  // evolución de salud como proxy temporal de los reportes registrados.
  const serieCO2 = evolucion_salud
    .slice(-6)
    .map((e, i) => ({
      label: new Date(e.fecha).toLocaleDateString('es-MX', { month: 'short' }),
      value: impacto?.captura_co2
        ? Number(((impacto.captura_co2 / evolucion_salud.length) * (i + 1)).toFixed(1))
        : 0,
    }));

  return (
    <div className="container page">
      <header className={styles.header}>
        <div>
          <h1>{arbol.especie || arbol.id_unico}</h1>
          <p className={styles.muted}>{arbol.ubicacion || 'Ubicación no especificada'}</p>
        </div>
        <span className="badge badge-success">🌱 Adoptado</span>
      </header>
      <p className={styles.muted}>
        Plantado el {formatFechaLarga(arbol.fecha_plantacion)}
      </p>

      {/* KPIs */}
      <section className={styles.kpis}>
        <div className="card">
          <span className={styles.kpiIcon}>💨</span>
          <strong>{impacto?.captura_co2 != null ? `${impacto.captura_co2}` : '—'}</strong>
          <span className={styles.kpiLabel}>kg CO₂ capturado</span>
        </div>
        <div className="card">
          <span className={styles.kpiIcon}>🌱</span>
          <strong>{impacto?.biomasa != null ? `${impacto.biomasa}` : '—'}</strong>
          <span className={styles.kpiLabel}>kg biomasa</span>
        </div>
        <div className="card">
          <span className={styles.kpiIcon}>📅</span>
          <strong>{impacto?.edad_meses != null ? impacto.edad_meses : '—'}</strong>
          <span className={styles.kpiLabel}>meses de edad</span>
        </div>
        <div className="card">
          <span className={styles.kpiIcon}>📸</span>
          <strong>{data.total_reportes ?? galeria.length}</strong>
          <span className={styles.kpiLabel}>reportes</span>
        </div>
      </section>

      {/* Gráfica CO₂ */}
      <section className="card">
        <h2 className={styles.h2}>Evolución de captura de CO₂</h2>
        {serieCO2.length >= 2 ? (
          <SvgLineChart data={serieCO2} unidad="kg" />
        ) : (
          <p className={styles.empty}>
            Registra más reportes para ver la evolución.
          </p>
        )}
      </section>

      {/* Galería */}
      <section>
        <h2 className={styles.h2}>Galería de evidencias</h2>
        {galeria.length === 0 ? (
          <p className={styles.empty}>Aún no hay fotos registradas.</p>
        ) : (
          <>
            <div className={styles.gallery}>
              {galeria.slice(0, visibles).map((g, i) => (
                <button
                  key={`${g.url}-${i}`}
                  type="button"
                  className={styles.thumb}
                  onClick={() => setModal(g)}
                >
                  <img src={g.url} alt={`Evidencia ${i + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
            {visibles < galeria.length && (
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={() => setVisibles((v) => v + 9)}
              >
                Ver más
              </button>
            )}
          </>
        )}
      </section>

      {/* Historial de salud */}
      <section>
        <h2 className={styles.h2}>Historial de salud</h2>
        {evolucion_salud.length === 0 ? (
          <p className={styles.empty}>Sin actualizaciones de estado.</p>
        ) : (
          <ul className={styles.timeline}>
            {[...evolucion_salud].reverse().map((e, i) => (
              <li key={i} className={styles.timelineItem}>
                <span className={`badge ${ESTADO_BADGE[e.estado] || 'badge-neutral'}`}>
                  {e.estado}
                </span>
                <span className={styles.muted}>{formatFechaLarga(e.fecha)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* FAB nuevo reporte */}
      {idAdopcion && (
        <button
          type="button"
          className={styles.fab}
          onClick={() => navigate(`/adopciones/${idAdopcion}/reporte`)}
          aria-label="Enviar nuevo reporte"
        >
          📸
        </button>
      )}

      {/* Modal de imagen */}
      {modal && (
        <div className={styles.modal} role="dialog" onClick={() => setModal(null)}>
          <div className={styles.modalInner} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setModal(null)}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <img src={modal.url} alt="Evidencia ampliada" />
            <p className={styles.muted}>{formatFechaLarga(modal.fecha)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
