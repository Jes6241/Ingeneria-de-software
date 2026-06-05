import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Corrige las rutas de los íconos por defecto de Leaflet, que se rompen al
 * empaquetar con Vite. Se cargan desde el CDN de unpkg.
 */
let configured = false;
export function setupLeaflet() {
  if (configured) return;
  configured = true;
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

/**
 * Crea un ícono de marcador de color sólido (DivIcon) según el estado.
 * @param {string} color - Color CSS del marcador.
 */
export function coloredIcon(color) {
  return L.divIcon({
    className: 'gt-marker',
    html: `<span style="
      display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -16],
  });
}

export default L;
