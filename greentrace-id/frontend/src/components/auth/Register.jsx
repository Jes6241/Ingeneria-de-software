import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';
import styles from './Auth.module.css';

const EMAIL_DOMAIN = '@alumno.ipn.mx';

/** Formulario de registro restringido a @alumno.ipn.mx (RF09). */
export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    boleta: '',
    correo: '',
    password: '',
    confirm: '',
    acepta: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    const next = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio';
    if (!/^\d{10}$/.test(form.boleta)) next.boleta = 'La boleta debe tener 10 dígitos';
    if (!form.correo.toLowerCase().endsWith(EMAIL_DOMAIN)) {
      next.correo = `El correo debe terminar en ${EMAIL_DOMAIN}`;
    }
    if (form.password.length < 8) next.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirm) next.confirm = 'Las contraseñas no coinciden';
    if (!form.acepta) next.acepta = 'Debes aceptar los términos de uso';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { usuario, token } = await authAPI.register({
        nombre: form.nombre.trim(),
        correo: form.correo,
        password: form.password,
      });
      login(usuario, token);
      toast.success('¡Cuenta creada exitosamente! 🌱');
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
            <label className="form-label" htmlFor="nombre">
              Nombre completo
            </label>
            <input
              id="nombre"
              name="nombre"
              className={`form-input ${errors.nombre ? 'is-invalid' : ''}`}
              value={form.nombre}
              onChange={handleChange}
              autoComplete="name"
            />
            {errors.nombre && (
              <span className="form-error" role="alert">
                {errors.nombre}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="boleta">
              Boleta (10 dígitos)
            </label>
            <input
              id="boleta"
              name="boleta"
              inputMode="numeric"
              maxLength={10}
              className={`form-input ${errors.boleta ? 'is-invalid' : ''}`}
              value={form.boleta}
              onChange={handleChange}
              placeholder="2020630000"
            />
            {errors.boleta && (
              <span className="form-error" role="alert">
                {errors.boleta}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="correo">
              Correo institucional
            </label>
            <input
              id="correo"
              name="correo"
              type="email"
              className={`form-input ${errors.correo ? 'is-invalid' : ''}`}
              value={form.correo}
              onChange={handleChange}
              placeholder="usuario@alumno.ipn.mx"
              autoComplete="email"
            />
            {errors.correo && (
              <span className="form-error" role="alert">
                {errors.correo}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña (mín. 8 caracteres)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form-input ${errors.password ? 'is-invalid' : ''}`}
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="form-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm">
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              className={`form-input ${errors.confirm ? 'is-invalid' : ''}`}
              value={form.confirm}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.confirm && (
              <span className="form-error" role="alert">
                {errors.confirm}
              </span>
            )}
          </div>

          <div className={styles.checkboxRow}>
            <input
              id="acepta"
              name="acepta"
              type="checkbox"
              checked={form.acepta}
              onChange={handleChange}
            />
            <label htmlFor="acepta">
              Acepto los términos de uso de GreenTrace ID
            </label>
          </div>
          {errors.acepta && (
            <span className="form-error" role="alert">
              {errors.acepta}
            </span>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Crear cuenta'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
