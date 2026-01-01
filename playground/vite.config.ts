import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { vocs } from 'vocs/vite'

export default defineConfig({
  plugins: [devtoolsJson(), react(), vocs()],
})
