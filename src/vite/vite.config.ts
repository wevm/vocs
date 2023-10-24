import react from '@vitejs/plugin-react'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

import { css } from './plugins/css.js'
import { mdx } from './plugins/mdx.js'
import { root } from './plugins/root.js'
import { routes } from './plugins/routes.js'

export default defineConfig({
  plugins: [splitVendorChunkPlugin(), react(), css(), mdx(), routes(), root()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
