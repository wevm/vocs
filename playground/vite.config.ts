import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { vocs } from 'vocs/waku/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vocs()],
})
