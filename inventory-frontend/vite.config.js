import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/dashboard': 'http://localhost:8000',
      '/products': 'http://localhost:8000',
      '/categories': 'http://localhost:8000',
      '/suppliers': 'http://localhost:8000',
      '/customers': 'http://localhost:8000',
      '/sales': 'http://localhost:8000',
      '/purchases': 'http://localhost:8000',
      '/reports': 'http://localhost:8000',
      '/ai': 'http://localhost:8000',
      '/activity-log': 'http://localhost:8000',
      '/static': 'http://localhost:8000',
    },
  },
})
