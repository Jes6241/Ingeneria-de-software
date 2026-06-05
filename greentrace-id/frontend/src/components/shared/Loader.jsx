import PropTypes from 'prop-types';
import styles from './Loader.module.css';

const SIZES = { sm: 20, md: 32, lg: 48 };

/**
 * Indicador de carga centrado con el verde primario.
 * @param {{ size?: 'sm'|'md'|'lg', mensaje?: string, fullscreen?: boolean }} props
 */
export default function Loader({ size = 'md', mensaje = '', fullscreen = false }) {
  const dimension = SIZES[size] || SIZES.md;
  return (
    <div
      className={fullscreen ? styles.fullscreen : styles.wrapper}
      role="status"
      aria-live="polite"
    >
      <span
        className={styles.spinner}
        style={{ width: dimension, height: dimension }}
      />
      {mensaje && <span className={styles.text}>{mensaje}</span>}
      <span className="sr-only">Cargando</span>
    </div>
  );
}

Loader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  mensaje: PropTypes.string,
  fullscreen: PropTypes.bool,
};
