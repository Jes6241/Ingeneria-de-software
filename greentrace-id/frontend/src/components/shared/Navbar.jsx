import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { notificacionesAPI } from '../../services/api';
import styles from './Navbar.module.css';

// Intervalo de sondeo de notificaciones (ms).
const POLL_MS = 60000;

/** Formatea una fecha ISO a un texto corto en español. */
function formatFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Barra de navegación principal (Mobile-First) con drawer lateral. */
export default function Navbar() {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const cargarNotificaciones = useCallback(async () => {
    try {
      const data = await notificacionesAPI.mias();
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas || 0);
    } catch {
      // Silencioso: no bloquear la navegación si falla.
    }
  }, []);

  // Sondea las notificaciones mientras haya sesión activa.
  useEffect(() => {
    if (!isAuthenticated()) {
      setNotificaciones([]);
      setNoLeidas(0);
      return undefined;
    }
    cargarNotificaciones();
    const id = setInterval(cargarNotificaciones, POLL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, cargarNotificaciones]);

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    setMenuOpen(false);
    setNotiOpen(false);
    navigate('/login');
  };

  const marcarLeida = async (id) => {
    try {
      await notificacionesAPI.marcarLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id_notificacion === id ? { ...n, leido: true } : n))
      );
      setNoLeidas((c) => Math.max(0, c - 1));
    } catch {
      /* sin acción */
    }
  };

  const marcarTodas = async () => {
    try {
      await notificacionesAPI.marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
      setNoLeidas(0);
    } catch {
      /* sin acción */
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  const navLinks = (
    <>
      <NavLink to="/home" className={styles.link} onClick={closeDrawer}>
        Inicio
      </NavLink>
      <NavLink to="/mapa" className={styles.link} onClick={closeDrawer}>
        Mapa
      </NavLink>
      {hasRole(ROLES.ESTUDIANTE) && (
        <NavLink to="/escanear" className={styles.link} onClick={closeDrawer}>
          Escanear QR
        </NavLink>
      )}
      {hasRole(ROLES.ADMIN) && (
        <NavLink
          to="/admin/arboles/nuevo"
          className={styles.link}
          onClick={closeDrawer}
        >
          Registrar Árbol
        </NavLink>
      )}
    </>
  );

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/home" className={styles.brand}>
          <span aria-hidden="true">🌳</span>
          <span>GreenTrace ID</span>
        </Link>

        {isAuthenticated() ? (
          <>
            {/* Links desktop */}
            <nav className={styles.desktopNav} aria-label="Navegación principal">
              {navLinks}
            </nav>

            {/* Campana de notificaciones */}
            <div className={styles.bellArea}>
              <button
                type="button"
                className={styles.bellBtn}
                onClick={() => setNotiOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={notiOpen}
                aria-label={`Notificaciones${
                  noLeidas ? `, ${noLeidas} sin leer` : ''
                }`}
              >
                <span aria-hidden="true">🔔</span>
                {noLeidas > 0 && (
                  <span className={styles.badge}>
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>
              {notiOpen && (
                <div className={styles.notiPanel} role="menu">
                  <div className={styles.notiHeader}>
                    <strong>Notificaciones</strong>
                    {noLeidas > 0 && (
                      <button
                        type="button"
                        className={styles.notiMarkAll}
                        onClick={marcarTodas}
                      >
                        Marcar todas
                      </button>
                    )}
                  </div>
                  <div className={styles.notiList}>
                    {notificaciones.length === 0 ? (
                      <p className={styles.notiEmpty}>
                        No tienes notificaciones.
                      </p>
                    ) : (
                      notificaciones.map((n) => (
                        <button
                          key={n.id_notificacion}
                          type="button"
                          className={`${styles.notiItem} ${
                            n.leido ? '' : styles.notiUnread
                          }`}
                          onClick={() =>
                            !n.leido && marcarLeida(n.id_notificacion)
                          }
                        >
                          <span className={styles.notiMsg}>{n.mensaje}</span>
                          <small className={styles.notiFecha}>
                            {formatFecha(n.fecha_envio)}
                          </small>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Usuario desktop */}
            <div className={styles.userArea}>
              <button
                type="button"
                className={styles.avatarBtn}
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {user?.nombre?.charAt(0)?.toUpperCase() || '?'}
                </span>
                <span className={styles.userName}>{user?.nombre}</span>
                <span aria-hidden="true">▾</span>
              </button>
              {menuOpen && (
                <div className={styles.dropdown} role="menu">
                  <div className={styles.dropdownInfo}>
                    <strong>{user?.nombre}</strong>
                    <small>{user?.correo}</small>
                  </div>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            {/* Hamburguesa móvil */}
            <button
              type="button"
              className={styles.hamburger}
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
            >
              ☰
            </button>
          </>
        ) : (
          <Link to="/login" className={styles.link}>
            Iniciar sesión
          </Link>
        )}
      </div>

      {/* Drawer móvil */}
      {drawerOpen && (
        <div className={styles.overlay} onClick={closeDrawer} role="presentation">
          <aside
            className={styles.drawer}
            onClick={(e) => e.stopPropagation()}
            aria-label="Menú lateral"
          >
            <button
              type="button"
              className={styles.closeBtn}
              onClick={closeDrawer}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
            <div className={styles.drawerUser}>
              <span className={styles.avatar} aria-hidden="true">
                {user?.nombre?.charAt(0)?.toUpperCase() || '?'}
              </span>
              <div>
                <strong>{user?.nombre}</strong>
                <small>{user?.correo}</small>
              </div>
            </div>
            <nav className={styles.drawerNav}>{navLinks}</nav>
            <button
              type="button"
              className="btn btn-danger btn-block"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </aside>
        </div>
      )}
    </header>
  );
}
