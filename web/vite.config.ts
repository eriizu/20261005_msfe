import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Bind on all interfaces so the app is reachable from the tailnet
// (e.g. http://gaufrette:5280 or http://100.108.94.13:5280).
const server = {
  host: true,
  port: 5280,
  strictPort: true,
  allowedHosts: ['.ts.net', 'gaufrette', 'gaufrette.potate.space'],
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server,
  preview: server,
})
