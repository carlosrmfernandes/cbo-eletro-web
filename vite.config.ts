import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Em desenvolvimento, /api é repassado para a cbo-eletro-api.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
})
