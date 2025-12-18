import { defineConfig } from 'vite'
import { vocs } from 'vocs/react-router/vite'

export default defineConfig({
  plugins: [vocs()],
})
