import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api calls are proxied to the Express server on port 5000,
// so the frontend can always use relative URLs like "/api/dashboard".
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
  build: { chunkSizeWarningLimit: 1200 },
});
