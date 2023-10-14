import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as tailwindcss from 'tailwindcss'
import * as autoprefixer from 'autoprefixer'
import { resolve } from 'node:path'

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        (autoprefixer as any).default(),
        tailwindcss.default({
          content: [resolve(__dirname, './**/*.{html,tsx,ts,js,jsx}')],
        }),
      ],
    },
  },
  plugins: [react()],
})
