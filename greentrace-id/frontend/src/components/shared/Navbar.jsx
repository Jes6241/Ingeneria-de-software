import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import styles from './Navbar.module.css';

/** Barra de navegación principal (Mobile-First) con drawer lateral. */
export default function Navbar() {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    setMenuOpen(false);
    navigate('/login');
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
