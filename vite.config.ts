import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: { host: '127.0.0.1' },
  define: { __BUILD_COMMIT__: JSON.stringify(process.env.BUILD_COMMIT || 'development') },
});
