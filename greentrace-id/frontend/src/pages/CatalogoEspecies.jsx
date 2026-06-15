import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { especiesAPI } from '../services/api';
import Loader from '../components/shared/Loader';
import styles from './CatalogoEspecies.module.css';

const FORM_INICIAL = {
  nombre_comun: '',
  nombre_cientifico: '',
  necesidad_riego: '',
  exposicion_solar: '',
  descripcion: '',
};

// Valores admitidos por la base de datos (CHECK constraints).
const NECESIDAD_RIEGO = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
];
const EXPOSICION_SOLAR = [
  { value: 'SOMBRA', label: 'Sombra' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'PLENO_SOL', label: 'Pleno sol' },
];

/** Devuelve la etiqueta legible de un valor de catálogo. */
function etiqueta(opciones, value) {
  return opciones.find((o) => o.value === value)?.label || value;
}

/** Catálogo de especies — solo Administrador (RF10). */
export default function CatalogoEspecies() {
  const [especies, setEspecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await especiesAPI.listar();
      setEspecies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre_comun.trim()) {
      toast.error('El nombre común es obligatorio.');
      return;
    }
    setEnviando(true);
    try {
      const creada = await especiesAPI.crear({
        nombre_comun: form.nombre_comun.trim(),
        nombre_cientifico: form.nombre_cientifico.trim() || null,
        necesidad_riego: form.necesidad_riego || null,
        exposicion_solar: form.exposicion_solar || null,
        descripcion: form.descripcion.trim() || null,
      });
      setEspecies((prev) => [...prev, creada].sort((a, b) =>
        a.nombre_comun.localeCompare(b.nombre_comun)
      ));
      setForm(FORM_INICIAL);
      toast.success('Especie registrada.');
    } catch (err) {
      toast.error(err.message || 'No se pudo registrar la especie.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1>📋 Catálogo de especies</h1>
        <p className={styles.subtitle}>
          Gestiona las especies disponibles para el registro de árboles.
        </p>
      </header>

      <section className={`card ${styles.formCard}`}>
        <h2 className={styles.cardTitle}>Registrar nueva especie</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="nombre_comun">
              Nombre común *
            </label>
            <input
              id="nombre_comun"
              name="nombre_comun"
              className="form-input"
              value={form.nombre_comun}
              onChange={handleChange}
              placeholder="Ej. Jacaranda"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="nombre_cientifico">
              Nombre científico
            </label>
            <input
              id="nombre_cientifico"
              name="nombre_cientifico"
              className="form-input"
              value={form.nombre_cientifico}
              onChange={handleChange}
              placeholder="Ej. Jacaranda mimosifolia"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="necesidad_riego">
              Necesidad de riego
            </label>
            <select
              id="necesidad_riego"
              name="necesidad_riego"
              className="form-input"
              value={form.necesidad_riego}
              onChange={handleChange}
            >
              <option value="">Sin especificar</option>
              {NECESIDAD_RIEGO.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="exposicion_solar">
              Exposición solar
            </label>
            <select
              id="exposicion_solar"
              name="exposicion_solar"
              className="form-input"
              value={form.exposicion_solar}
              onChange={handleChange}
            >
              <option value="">Sin especificar</option>
              {EXPOSICION_SOLAR.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className={`form-group ${styles.fullWidth}`}>
            <label className="form-label" htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              className="form-input"
              rows={3}
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Características relevantes de la especie."
            />
          </div>
          <div className={styles.fullWidth}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={enviando}
            >
              {enviando ? 'Guardando…' : 'Registrar especie'}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.listSection}>
        <h2 className={styles.cardTitle}>
          Especies registradas{' '}
          {!loading && <span className={styles.count}>({especies.length})</span>}
        </h2>

        {loading ? (
          <Loader mensaje="Cargando especies…" />
        ) : error ? (
          <div className="card">
            <p className={styles.error}>⚠️ {error}</p>
            <button type="button" className="btn btn-secondary" onClick={cargar}>
              Reintentar
            </button>
          </div>
        ) : especies.length === 0 ? (
          <div className="card">
            <p>No hay especies registradas todavía.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {especies.map((e) => (
              <article key={e.id_especie} className={`card ${styles.especie}`}>
                <h3 className={styles.especieNombre}>{e.nombre_comun}</h3>
                {e.nombre_cientifico && (
                  <p className={styles.cientifico}>{e.nombre_cientifico}</p>
                )}
                <ul className={styles.meta}>
                  {e.necesidad_riego && (
                    <li>💧 Riego: {etiqueta(NECESIDAD_RIEGO, e.necesidad_riego)}</li>
                  )}
                  {e.exposicion_solar && (
                    <li>☀️ Sol: {etiqueta(EXPOSICION_SOLAR, e.exposicion_solar)}</li>
                  )}
                </ul>
                {e.descripcion && (
                  <p className={styles.descripcion}>{e.descripcion}</p>
                )}
                {e.activa === false && (
                  <span className="badge badge-neutral">Inactiva</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
