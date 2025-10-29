// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8082', // <-- tu backend (ajusta si usas otro puerto)
        changeOrigin: true,
        secure: false,
        // rewrite: (p) => p.replace(/^\/api/, ''), // solo si tu backend NO tiene el prefijo /api
      },
    },
  },
})
