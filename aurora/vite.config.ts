import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served under /aurora/ behind the Flask app on this EC2 instance.
export default defineConfig({
  base: '/aurora/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
