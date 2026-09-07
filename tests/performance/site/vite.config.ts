import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { vocs } from 'vocs/vite'

export default defineConfig({
  plugins: [react(), vocs({ unstable_adapter: 'vocs/waku/internal/patches/adapters/node' })],
})
