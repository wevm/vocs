import react from '@vitejs/plugin-react'
import * as autoprefixer from 'autoprefixer'
import { defineConfig } from 'vite'

import { mdx } from './plugins/mdx.js'
import { routes } from './plugins/routes.js'

export default defineConfig({
  css: {
    postcss: {
      plugins: [(autoprefixer as any).default()],
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  plugins: [react(), mdx(), routes()],
})
