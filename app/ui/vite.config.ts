import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    // tui-color-picker ships old IE star-hack CSS that LightningCSS rejects
    lightningcss: { errorRecovery: true },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3033',
      '/files': 'http://localhost:3033',
    },
  },
})
