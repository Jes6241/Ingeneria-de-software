import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { adopcionesAPI, arbolesAPI, reportesAPI } from '../services/api';
import { ROLES } from '../constants/roles';
import toast from 'react-hot-toast';
import Loader from '../components/shared/Loader';
import ArbolPlaceholder from '../components/shared/ArbolPlaceholder';
import styles from './Home.module.css';

/** Devuelve el saludo según la hora del día. */
function saludoHora() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Días transcurridos desde una fecha ISO. */
function diasDesde(fechaIso) {
  if (!fechaIso) return null;
  const ms = Date.now() - new Date(fechaIso).getTime();
  return Math.floor(ms / 86400000);
}

const ESTADO_BADGE = {
  ACTIVA: 'badge-success',
  EN_MORA: 'badge-warning',
  LIBERADA: 'badge-neutral',
};

/** Vista principal tras iniciar sesión. */
export default function Home() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole(ROLES.ADMIN);
  const isEstudiante = hasRole(ROLES.ESTUDIANTE);

  const [adopciones, setAdopciones] = useState([]);
  const [totalArboles, setTotalArboles] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [adopcionesAdmin, setAdopcionesAdmin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const [arbolesData, reportesData, adopcionesData] = await Promise.all([
          arbolesAPI.listar({ limit: 1 }),
          reportesAPI.listarTodos({ limit: 20 }),
          adopcionesAPI.listarTodas(),
        ]);
        setTotalArboles(arbolesData?.total ?? 0);
        setReportes(reportesData?.data ?? []);
        setAdopcionesAdmin(Array.isArray(adopcionesData) ? adopcionesData : []);
      } else {
        const data = await adopcionesAPI.misAdopciones();
        setAdopciones(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const desadoptar = useCallback(async (idAdopcion) => {
    if (!window.confirm('¿Estás seguro de que deseas desadoptar este árbol?')) return;
    try {
      await adopcionesAPI.desadoptar(idAdopcion);
      toast.success('Árbol desadoptado correctamente.');
      cargar();
    } catch (err) {
      toast.error(err.message || 'No se pudo desadoptar el árbol.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liberarArbolAdmin = useCallback(async (idAdopcion, nombre) => {
    if (!window.confirm(`¿Liberar el árbol adoptado por ${nombre}?`)) return;
    try {
      await adopcionesAPI.desadoptarAdmin(idAdopcion);
      toast.success('Árbol liberado correctamente.');
      cargar();
    } catch (err) {
      toast.error(err.message || 'No se pudo liberar el árbol.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aprobarReporte = useCallback(async (idReporte) => {
    try {
      await reportesAPI.aprobar(idReporte);
      toast.success('Reporte aprobado.');
      setReportes((prev) => prev.map((r) => r.id_reporte === idReporte ? { ...r, aprobado: true } : r));
    } catch (err) {
      toast.error(err.message || 'No se pudo aprobar el reporte.');
    }
  }, []);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const activas = useMemo(
    () => adopciones.filter((a) => a.estado === 'ACTIVA'),
    [adopciones]
  );

  if (loading) return <Loader fullscreen mensaje="Cargando tu huella verde…" />;

  return (
    <div className="container page">
      <header className={styles.header}>
        <h1>
          {saludoHora()}, {user?.nombre?.split(' ')[0] || 'estudiante'}
        </h1>
        <p className={styles.subtitle}>
          {isAdmin ? 'Panel de administración' : 'Tu huella verde en ESCOM'}
        </p>
      </header>

      {error && (
        <div className="card" role="alert" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <p>{error}</p>
          <button type="button" className="btn btn-outline" onClick={cargar}>
            Reintentar
          </button>
        </div>
      )}

      {/* ============================ ADMINISTRADOR ============================ */}
      {isAdmin && (
        <>
          {/* Estadísticas globales */}
          <section className={styles.stats} aria-label="Estadísticas globales">
            <div className="card">
              <span className={styles.statIcon} aria-hidden="true">🌳</span>
              <strong className={styles.statValue}>{totalArboles ?? '—'}</strong>
              <span className={styles.statLabel}>Árboles registrados</span>
            </div>
            <div className="card">
              <span className={styles.statIcon} aria-hidden="true">🤝</span>
              <strong className={styles.statValue}>—</strong>
              <span className={styles.statLabel}>Árboles adoptados</span>
            </div>
            <div className="card">
              <span className={styles.statIcon} aria-hidden="true">📋</span>
              <strong className={styles.statValue}>{reportes.length}</strong>
              <span className={styles.statLabel}>Reportes recibidos</span>
            </div>
          </section>

          {/* Accesos directos */}
          <section className={styles.adminSection}>
            <h2 className={styles.sectionTitle}>Accesos directos</h2>
            <div className={styles.grid}>
              <button
                type="button"
                className={`card ${styles.adminCard}`}
                onClick={() => navigate('/admin/arboles/nuevo')}
              >
                <span aria-hidden="true">🌳</span> Registrar nuevo árbol
              </button>
              <button
                type="button"
                className={`card ${styles.adminCard}`}
                onClick={() => navigate('/mapa')}
              >
                <span aria-hidden="true">🗺️</span> Ver mapa de árboles
              </button>
              <button
                type="button"
                className={`card ${styles.adminCard}`}
                onClick={() => navigate('/admin/especies')}
              >
                <span aria-hidden="true">📋</span> Catálogo de especies
              </button>
            </div>
          </section>

          {/* Árboles adoptados */}
          <section className={styles.adminSection}>
            <h2 className={styles.sectionTitle}>Árboles adoptados ({adopcionesAdmin.length})</h2>
            {adopcionesAdmin.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                <p>No hay árboles adoptados actualmente.</p>
              </div>
            ) : (
              <div className={styles.adopcionesTable}>
                {adopcionesAdmin.map((a) => (
                  <article key={a.id_adopcion} className={`card ${styles.adopcionRow}`}>
                    <div className={styles.adopcionInfo}>
                      <strong>{a.Arbol?.Especie?.nombre_comun || a.Arbol?.id_unico || `Árbol #${a.id_arbol}`}</strong>
                      <span className={styles.adopcionMeta}>👤 {a.Usuario?.nombre || '—'} &bull; {a.Usuario?.correo || ''}</span>
                      <span className={styles.adopcionMeta}>
                        📅 {a.fecha_adopcion ? new Date(a.fecha_adopcion).toLocaleDateString('es-MX') : '—'}
                        &bull; 📋 {a.num_reportes} reporte{a.num_reportes !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`btn ${styles.btnLiberar}`}
                      onClick={() => liberarArbolAdmin(a.id_adopcion, a.Usuario?.nombre || 'este usuario')}
                    >
                      Liberar árbol
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Panel de reportes */}
          <section className={styles.adminSection}>
            <h2 className={styles.sectionTitle}>Reportes recientes</h2>
            {reportes.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                <p>No hay reportes aún.</p>
              </div>
            ) : (
              <div className={styles.reportesList}>
                {reportes.map((r) => {
                  const arbol = r.Adopcion?.Arbol;
                  const usuario = r.Adopcion?.Usuario;
                  const foto = r.EvidenciaFotograficas?.[0];
                  return (
                    <article key={r.id_reporte} className={`card ${styles.reporteCard}`}>
                      {foto?.url_imagen && (
                        <img src={foto.url_imagen} alt="Evidencia" className={styles.reporteImg} />
                      )}
                      <div className={styles.reporteInfo}>
                        <strong>
                          {arbol?.Especie?.nombre_comun || arbol?.id_unico || `Árbol #${r.id_adopcion}`}
                        </strong>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {r.estado_general}
                        </span>
                        <p className={styles.reporteMeta}>
                          {usuario?.nombre || '—'} &bull;{' '}
                          {r.fecha_reporte ? new Date(r.fecha_reporte).toLocaleDateString('es-MX') : '—'}
                        </p>
                        <p className={styles.reporteMeta}>
                          Riego: {r.nivel_riego} &bull; Coloración: {r.coloracion_hojas}
                        </p>
                        {r.presencia_plagas && (
                          <p className={styles.reporteAlerta}>⚠️ Plagas: {r.detalle_plagas || 'Sin detalle'}</p>
                        )}
                        {r.observaciones && (
                          <p className={styles.reporteMeta}>{r.observaciones}</p>
                        )}
                        <div style={{ marginTop: 6 }}>
                          {r.aprobado ? (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>✓ Aprobado</span>
                          ) : (
                            <button
                              type="button"
                              className={`btn ${styles.btnAprobar}`}
                              onClick={() => aprobarReporte(r.id_reporte)}
                            >
                              Aprobar reporte
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* ============================== ESTUDIANTE ============================= */}
      {isEstudiante && (
        <>
          {/* Stats personales */}
          <section className={styles.stats} aria-label="Estadísticas">
            <div className="card">
              <span className={styles.statIcon} aria-hidden="true">🌳</span>
              <strong className={styles.statValue}>{activas.length}</strong>
              <span className={styles.statLabel}>Árboles adoptados</span>
            </div>
            <div className="card">
              <span className={styles.statIcon} aria-hidden="true">📸</span>
              <strong className={styles.statValue}>{adopciones.length}</strong>
              <span className={styles.statLabel}>Adopciones totales</span>
            </div>
            <div className="card">
              <span className={styles.statIcon} aria-hidden="true">💨</span>
              <strong className={styles.statValue}>—</strong>
              <span className={styles.statLabel}>kg CO₂ capturado</span>
            </div>
          </section>

          {/* Hero — adopciones activas */}
          <section>
            <h2 className={styles.sectionTitle}>Mis adopciones activas</h2>

            {activas.length === 0 ? (
              <div className={`card ${styles.empty}`}>
                <ArbolPlaceholder size={96} />
                <p>Aún no has adoptado ningún árbol.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/escanear')}
                >
                  📷 Escanear QR para adoptar
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {activas.map((a) => {
                  const dias = diasDesde(a.fecha_adopcion);
                  return (
                    <article key={a.id_adopcion} className={`card ${styles.treeCard}`}>
                      <ArbolPlaceholder size={72} />
                      <h3 className={styles.treeTitle}>
                        {a.Arbol?.id_unico || `Árbol #${a.id_arbol}`}
                      </h3>
                      <span className={`badge ${ESTADO_BADGE[a.estado] || 'badge-neutral'}`}>
                        {a.estado}
                      </span>
                      <p className={styles.treeMeta}>
                        Adoptado hace {dias ?? '—'} día{dias === 1 ? '' : 's'}
                      </p>
                      <button
                        type="button"
                        className="btn btn-outline btn-block"
                        onClick={() => navigate(`/dashboard/${a.id_arbol}`)}
                      >
                        Ver Dashboard
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={() =>
                          navigate(`/adopciones/${a.id_adopcion}/reporte`)
                        }
                      >
                        📝 Generar reporte
                      </button>
                      <button
                        type="button"
                        className={`btn btn-block ${styles.btnDesadoptar}`}
                        onClick={() => desadoptar(a.id_adopcion)}
                      >
                        Desadoptar
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* FAB escanear (solo estudiante) */}
          <button
            type="button"
            className={styles.fab}
            onClick={() => navigate('/escanear')}
            aria-label="Escanear código QR"
          >
            <span aria-hidden="true">📷</span>
          </button>
        </>
      )}
    </div>
  );
}
