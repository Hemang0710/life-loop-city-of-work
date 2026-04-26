import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
  },
});
