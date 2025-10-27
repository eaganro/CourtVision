import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../server/public/js'),
    emptyOutDir: false,
    assetsDir: '.',
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.jsx'),
      output: {
        entryFileNames: 'main.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'style.css';
          }
          return '[name]-[hash][extname]';
        },
      },
    },
  },
});
