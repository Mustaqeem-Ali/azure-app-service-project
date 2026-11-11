import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The frontend lives in /client; the production build lands in client/dist,
// which Express serves. In dev, /api is proxied to the Express server so the
// React code can always use relative URLs.
export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
