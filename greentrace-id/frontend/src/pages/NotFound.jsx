import { useNavigate } from 'react-router-dom';

/** Página 404. */
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      className="container page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 12,
        paddingTop: 48,
      }}
    >
      <svg width="140" height="140" viewBox="0 0 100 100" role="img" aria-label="Árbol confundido">
        <rect x="44" y="62" width="12" height="28" rx="3" fill="#8d6e63" />
        <circle cx="50" cy="38" r="26" fill="#95d5b2" />
        <text x="50" y="46" textAnchor="middle" fontSize="28" fill="#2d6a4f" fontWeight="700">
          ?
        </text>
      </svg>
      <h1>404 — Página no encontrada</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Esta ruta no existe en GreenTrace ID.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
        Volver al inicio
      </button>
    </div>
  );
}
