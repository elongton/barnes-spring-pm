import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api calls are proxied to the Express server so the browser only talks to one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: process.env.API_URL || 'http://localhost:4000', changeOrigin: true } },
  },
});
