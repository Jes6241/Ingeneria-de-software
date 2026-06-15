import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Captura errores de renderizado de los componentes hijos para evitar que
 * un fallo deje la aplicación en blanco. Muestra un mensaje de recuperación.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Registro útil para depuración en consola del navegador.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturó un error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
          }}
          role="alert"
        >
          <h1 style={{ fontSize: '1.4rem' }}>⚠️ Algo salió mal</h1>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 420 }}>
            Ocurrió un error inesperado en esta sección. Puedes intentar
            recargar la página.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};
