import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { setupLeaflet, coloredIcon } from '../utils/leafletSetup';
import { arbolesAPI } from '../services/api';
import Loader from '../components/shared/Loader';
import styles from './MapaLeaflet.module.css';

setupLeaflet();

const DEFAULT_CENTER = [19.5046, -99.1469];

const ESTADOS = {
  Bueno: { color: '#16a34a', label: 'Bueno' },
  Regular: { color: '#d97706', label: 'Regular' },
  'Crítico': { color: '#dc2626', label: 'Crítico' },
  Disponible: { color: '#2563eb', label: 'Disponible' },
};

/** Normaliza el estado de salud de un árbol para colorear el marcador. */
function estadoDe(arbol) {
  const e = arbol.estado_salud || arbol.estado;
  if (e && ESTADOS[e]) return e;
  return 'Disponible';
}

/** Mapa de árboles a pantalla completa con clustering (RF). */
export default function MapaLeaflet() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [arboles, setArboles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    Bueno: true,
    Regular: true,
    'Crítico': true,
    Disponible: true,
  });

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, 16);
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Carga los árboles.
  useEffect(() => {
    let activo = true;
    (async () => {
      setLoading(true);
      try {
        const res = await arbolesAPI.listar({ limit: 50 });
        if (activo) setArboles(res.data || []);
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  // Renderiza los marcadores filtrados.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }
    const cluster = L.markerClusterGroup();
    arboles
      .filter((a) => a.latitud != null && a.longitud != null)
      .filter((a) => filtros[estadoDe(a)])
      .forEach((a) => {
        const estado = estadoDe(a);
        const marker = L.marker([Number(a.latitud), Number(a.longitud)], {
          icon: coloredIcon(ESTADOS[estado].color),
        });
        const especie = a.Especie?.nombre_comun || a.id_unico;
        marker.bindPopup(
          `<strong>${especie}</strong><br/>Estado: ${ESTADOS[estado].label}<br/>` +
            `<button id="ver-${a.id_arbol}" class="gt-popup-btn">Ver árbol</button>`
        );
        marker.on('popupopen', () => {
          const btn = document.getElementById(`ver-${a.id_arbol}`);
          if (btn) btn.onclick = () => navigate(`/arboles/${a.id_arbol}`);
        });
        cluster.addLayer(marker);
      });
    map.addLayer(cluster);
    clusterRef.current = cluster;
  }, [arboles, filtros, navigate]);

  const toggleFiltro = (estado) =>
    setFiltros((prev) => ({ ...prev, [estado]: !prev[estado] }));

  const miUbicacion = useCallback(() => {
    const map = mapRef.current;
    if (!map || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        map.setView(latlng, 17);
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = L.circleMarker(latlng, {
          radius: 8,
          color: '#2d6a4f',
          fillColor: '#52b788',
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindPopup('Estás aquí');
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className={styles.screen}>
      {loading && (
        <div className={styles.loaderOverlay}>
          <Loader mensaje="Cargando árboles…" />
        </div>
      )}
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <div ref={containerRef} className={styles.map} />

      {/* Botón mi ubicación */}
      <button
        type="button"
        className={styles.locBtn}
        onClick={miUbicacion}
        aria-label="Centrar en mi ubicación"
      >
        📍
      </button>

      {/* Toggle panel */}
      <button
        type="button"
        className={styles.panelToggle}
        onClick={() => setPanelOpen((o) => !o)}
      >
        {panelOpen ? '✕' : '☰'} Filtros
      </button>

      {/* Panel lateral */}
      <aside className={`${styles.panel} ${panelOpen ? styles.panelOpen : ''}`}>
        <h2 className={styles.panelTitle}>Filtrar por estado</h2>
        <ul className={styles.filterList}>
          {Object.entries(ESTADOS).map(([key, { color, label }]) => (
            <li key={key}>
              <label className={styles.filterRow}>
                <input
                  type="checkbox"
                  checked={filtros[key]}
                  onChange={() => toggleFiltro(key)}
                />
                <span
                  className={styles.dot}
                  style={{ background: color }}
                  aria-hidden="true"
                />
                {label}
              </label>
            </li>
          ))}
        </ul>

        <h2 className={styles.panelTitle}>Árboles ({arboles.length})</h2>
        <ul className={styles.treeList}>
          {arboles.map((a) => (
            <li key={a.id_arbol}>
              <button
                type="button"
                className={styles.treeItem}
                onClick={() => navigate(`/arboles/${a.id_arbol}`)}
              >
                <span
                  className={styles.dot}
                  style={{ background: ESTADOS[estadoDe(a)].color }}
                  aria-hidden="true"
                />
                {a.Especie?.nombre_comun || a.id_unico}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
