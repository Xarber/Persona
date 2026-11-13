import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
const privateData = path.resolve(process.env.DATA_DIR || '.data').replaceAll('\\', '/');
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: {
    host: '127.0.0.1',
    fs: {
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem,key,p12,pfx,cer,der}',
        '.npmrc',
        '.yarnrc.yml',
        '**/.git/**',
        '**/.data/**',
        `${privateData}/**`,
      ],
    },
    watch: {
      ignored: [
        '**/.data/**',
        `${privateData}/**`,
        '**/dist/**',
        '**/test-results/**',
        '**/playwright-report/**',
      ],
    },
  },
  define: {
    __BUILD_COMMIT__: JSON.stringify(process.env.BUILD_COMMIT || 'development'),
    __HOSTED_STUDIO__: JSON.stringify(process.env.PERSONA_HOSTED === 'true'),
  },
});
