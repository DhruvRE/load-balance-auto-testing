import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // ensures correct relative paths for Nginx serving
  build: {
    outDir: 'dist',
  },
})
