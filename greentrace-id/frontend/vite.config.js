import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite para el frontend de GreenTrace ID.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
server: {
  port: 5173,
  host: true,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
},
});
