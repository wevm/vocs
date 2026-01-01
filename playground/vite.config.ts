import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import vocs from './vocs.config.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vocs.plugin()],
})
