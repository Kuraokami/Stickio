import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Fix: removed the extra "vite-"
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
  ],
})