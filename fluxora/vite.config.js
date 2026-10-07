import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served under /fluxora/ behind the Flask app on this EC2 instance.
export default defineConfig({
  base: '/fluxora/',
  plugins: [react()],
})
