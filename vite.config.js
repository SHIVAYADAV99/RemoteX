// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'  // assuming React renderer
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Optional: if you have other aliases or settings
  resolve: {
    alias: {
      // example if needed
    }
  }
})