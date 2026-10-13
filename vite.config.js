import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['campus-crew-frontend.onrender.com'],
  },
  preview: {
    allowedHosts: ['campus-crew-frontend.onrender.com'],
  },
})