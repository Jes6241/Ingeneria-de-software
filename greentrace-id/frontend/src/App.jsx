import { Routes, Route } from 'react-router-dom';
import { ROLES } from './constants/roles';
import Navbar from './components/shared/Navbar';
import PrivateRoute from './components/shared/PrivateRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Home from './pages/Home';
import DetalleArbol from './pages/DetalleArbol';
import EscanerQR from './components/arboles/EscanerQR';
import RegistroArbol from './components/arboles/RegistroArbol';
import FormularioReporte from './components/reportes/FormularioReporte';
import DashboardCO2 from './pages/DashboardCO2';
import MapaLeaflet from './pages/MapaLeaflet';
import CatalogoEspecies from './pages/CatalogoEspecies';
import NotFound from './pages/NotFound';

/** Componente raíz: barra de navegación y enrutado de la aplicación. */
export default function App() {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Privadas (ambos roles) */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/arboles/:id" element={<DetalleArbol />} />
            <Route path="/dashboard/:id" element={<DashboardCO2 />} />
            <Route path="/mapa" element={<MapaLeaflet />} />
          </Route>

          {/* Privadas solo ESTUDIANTE */}
          <Route element={<PrivateRoute requiredRole={ROLES.ESTUDIANTE} />}>
            <Route path="/escanear" element={<EscanerQR />} />
            <Route
              path="/adopciones/:id/reporte"
              element={<FormularioReporte />}
            />
          </Route>

          {/* Privadas solo ADMINISTRADOR */}
          <Route element={<PrivateRoute requiredRole={ROLES.ADMIN} />}>
            <Route path="/admin/arboles/nuevo" element={<RegistroArbol />} />
            <Route path="/admin/especies" element={<CatalogoEspecies />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}
