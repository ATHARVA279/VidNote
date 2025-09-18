import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'lucide-icons': ['lucide-react'],
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
  },
  esbuild: {
    treeShaking: true,
    legalComments: 'none',
  },
});
