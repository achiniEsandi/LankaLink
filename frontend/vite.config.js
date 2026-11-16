import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Tailwind is only used by the operations preview (see src/pages/operations/operations.css)
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // File-change events don't cross Docker bind mounts on Windows, so poll when containerised
    watch: process.env.VITE_USE_POLLING === 'true' ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
    },
  },
})
