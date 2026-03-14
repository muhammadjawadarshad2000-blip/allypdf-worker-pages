import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'pdf-lib-vendor': ['pdf-lib'],
          'pdfjs-vendor': ['pdfjs-dist'],
          'jszip-vendor': ['jszip'],
          'react-vendor': ['react', 'react-dom', 'react-redux'],
          'router-utils': ['react-router-dom'],
        },
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  }
})
