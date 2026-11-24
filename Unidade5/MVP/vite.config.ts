import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // o MapLibre sozinho passa de 1 MB; o aviso padrão de 500 kB não ajuda aqui
  build: { chunkSizeWarningLimit: 1800 },
})
