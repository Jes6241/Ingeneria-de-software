import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';
import styles from './Auth.module.css';

const EMAIL_DOMAIN = '@alumno.ipn.mx';

/** Formulario de inicio de sesión (RF09). */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!correo.toLowerCase().endsWith(EMAIL_DOMAIN)) {
      next.correo = `El correo debe terminar en ${EMAIL_DOMAIN}`;
    }
    if (!password) next.password = 'La contraseña es obligatoria';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { usuario, token } = await authAPI.login({ correo, password });
      login(usuario, token);
      toast.success(`¡Bienvenido, ${usuario.nombre}!`);
      navigate('/home');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={`card ${styles.card}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon} aria-hidden="true">
            🌳
          </span>
          <h1 className={styles.logoText}>GreenTrace ID</h1>
        </div>
        <p className={styles.slogan}>
          Trazabilidad ambiental respaldada por código.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="correo">
              Correo institucional
            </label>
            <div className={styles.inputIcon}>
              <span aria-hidden="true">📧</span>
              <input
                id="correo"
                type="email"
                className={`form-input ${errors.correo ? 'is-invalid' : ''}`}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@alumno.ipn.mx"
                autoComplete="email"
              />
            </div>
            {errors.correo && (
              <span className="form-error" role="alert">
                {errors.correo}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div className={styles.inputIcon}>
              <span aria-hidden="true">🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'is-invalid' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <span className="form-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Iniciar sesión'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
